# Deploy: product requirements specification

Status: draft v1, 2026-11-11. Prepared with AI assistance.
This is the technical counterpart of `PRD.md`: architecture, schema, API, jobs, agent design. Method: replica-architect (managed parts, one database, a thin vertical slice first). Requirement IDs (R-xx) refer to the PRD.

## 0. Amendment, 2026-11-11: everything runs on our Cloudflare account

The owner decided Deploy is built on Cloudflare for internal use, with no custom domain. This overrides the Supabase and Pages choices below wherever they conflict.

| Was | Now |
| --- | --- |
| Cloudflare Pages + Pages Functions | One Worker, `deploy-internal`, with static assets, on its `workers.dev` hostname |
| Supabase Postgres | Cloudflare D1 database `deploy-internal` (`d913e974-a802-45a6-93cf-60eb76c21716`), created and migrated |
| Supabase Auth | Cloudflare Access in front of the Worker; the Worker verifies the Access JWT |
| Supabase Storage | R2, when screenshots and reports arrive |
| GitHub Actions cron for light jobs | Worker cron triggers. Actions stays for browser jobs (Lighthouse, visual diff) and the agent |
| LangGraph checkpoints in Supabase | D1 |

The implemented schema is `deploy/migrations/` (SQLite). The Postgres DDL in section 3 is the design for tables not built yet and is ported to SQLite table by table: `uuid` becomes integer or text ids, `jsonb` becomes text, `timestamptz` becomes ISO text, plpgsql guards become `RAISE(ABORT)` triggers, and the `events` table is not partitioned.

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Web app | Astro 6 + React islands + TypeScript | Same shape as the sites it manages; static shell, interactive islands |
| Styling | Tailwind with tokens from Deploy's own `DESIGN.md` | Built with the impeccable skill, Operate mode |
| Hosting | Cloudflare Pages + Pages Functions, project `deploy-internal` on its `pages.dev` hostname, no custom domain | Already our host; free tier is enough |
| Edge ingest | One Cloudflare Worker (`deploy-ingest`) | Tracking endpoint must answer at the edge |
| Database | Supabase Postgres, row level security on every table | Already in the stack |
| Auth | Cloudflare Access in front of the whole project; Functions verify the Access JWT (signature, audience, issuer, expiry). Supabase is reached only by Functions with the service role | Internal tool: no sign-in code to maintain, allowlist lives in the Access policy |
| Files | Supabase Storage (screenshots, reports, artifacts) | One vendor |
| Jobs | GitHub Actions on cron and `repository_dispatch` | Already in the stack; free minutes cover it |
| Agent orchestration | LangGraph, state checkpointed to Supabase | Matches the existing team model |
| Models | Router: Gemini Flash (free tier) for bulk reads, DeepSeek for cheap drafting, Claude Sonnet for code and judgment | Target 40 to 55% of calls on the free tier |
| Browser automation | Playwright + Chromium in Actions | Screenshots, visual diff, Lighthouse |
| Email | Resend | Already connected |
| Product analytics forward | PostHog | Already installed on our sites |
| MCP server | Pages Function at `/api/mcp`, Streamable HTTP, Access service tokens mapped to scopes | Parity with Ploy's four scopes |

One database. No microservices. Nothing that needs a server we operate.

## 2. Architecture

```
            our sites (Cloudflare Pages)                    people and agents
        ┌──────────────────────────────┐          ┌───────────────────────────────┐
        │ <script src="/_deploy/t.js"> │          │ Deploy web app   MCP clients  │
        └───────────────┬──────────────┘          └───────┬───────────────┬───────┘
                        │ POST /_deploy/ingest            │ HTTPS         │ /api/mcp (OAuth)
                 ┌──────▼───────┐                  ┌──────▼───────────────▼──────┐
                 │ deploy-ingest│                  │ Pages Functions  /api/*     │
                 │   Worker     │                  │ auth, scopes, audit, budget │
                 └──────┬───────┘                  └──────┬──────────────┬───────┘
                        │ batched inserts                 │ SQL + RLS    │ repository_dispatch
                 ┌──────▼─────────────────────────────────▼──────┐ ┌─────▼────────────────────┐
                 │            Supabase Postgres + Storage        │ │ GitHub Actions runners   │
                 │ events, findings, deploys, runs, audit, cost  │◄┤ LangGraph agent, crawler,│
                 └───────────────────────────────────────────────┘ │ Lighthouse, visual diff, │
                                                                   │ AI-answer checks         │
                        site repos on GitHub ◄── pull requests ────┤                          │
                        Cloudflare Pages ◄── preview / production ─┘──────────────────────────┘
```

The ownership gate sits in one shared module, `assertVerifiedHost(url)`, called by the crawler, the screenshotter, the Lighthouse runner and every agent tool that fetches a URL. It reads `sites.verified_at`. An unverified host raises and writes an audit row.

## 3. Schema

Conventions: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, times in UTC, money in integer cents, every foreign key indexed, row level security on. Policy for all tables unless noted: members of the single workspace can read; writes go through Pages Functions with the service role after a scope check.

```sql
create table members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now()
);
create table allowlist (email text primary key);          -- sign-in trigger rejects others

create table sites (
  id uuid primary key default gen_random_uuid(),
  hostname text not null unique,
  name text not null,
  github_repo text,                                        -- owner/name
  cf_project text,
  verify_method text check (verify_method in ('dns_txt','meta','file')),
  verify_token text not null,
  verified_at timestamptz,                                 -- null = nothing may touch this host
  auto_publish text not null default 'off' check (auto_publish in ('off','preview','preview_production')),
  tracking_key text not null unique,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now()
);

create table deploys (                                     -- a goal-scoped agent chat
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  title text not null,
  goal text,
  status text not null default 'open' check (status in ('open','waiting_approval','merged','closed')),
  agent_tier text not null default 'full' check (agent_tier in ('full','lite')),
  branch text, pr_number int, preview_url text,
  created_by uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on deploys (site_id, updated_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  deploy_id uuid not null references deploys(id) on delete cascade,
  role text not null check (role in ('user','agent','tool','system')),
  author_id uuid references members(id),
  content jsonb not null,                                  -- text, plan, tool call, approval card
  created_at timestamptz not null default now()
);
create index on messages (deploy_id, created_at);

create table artifacts (                                   -- the gallery
  id uuid primary key default gen_random_uuid(),
  deploy_id uuid not null references deploys(id) on delete cascade,
  kind text not null check (kind in ('page','image','document','dataset','chart','screenshot')),
  title text not null,
  storage_path text, url text, meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on artifacts (deploy_id, kind);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  deploy_id uuid references deploys(id) on delete cascade,
  finding_id uuid,
  action text not null check (action in ('merge','publish','schedule','spend','apply_edit')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  decided_by uuid references members(id), decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index on approvals (status, created_at desc);

create table releases (                                    -- published snapshots
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  target text not null check (target in ('production','preview')),
  commit_sha text not null, cf_deployment_id text, url text,
  status text not null check (status in ('building','live','failed','rolled_back')),
  log_path text,
  created_at timestamptz not null default now()
);
create index on releases (site_id, created_at desc);

create table events (                                      -- first-party analytics, partition by month
  site_id uuid not null references sites(id) on delete cascade,
  ts timestamptz not null default now(),
  anon_id text, session_id text,
  name text not null,                                      -- pageview, click, scroll, form_submit, custom
  path text, referrer text, channel text,                  -- organic, direct, ai_assistant, referral, social, paid
  country text, device text, props jsonb not null default '{}'
) partition by range (ts);
create index on events (site_id, ts desc);
create index on events (site_id, name, ts desc);

create table bot_hits (
  site_id uuid not null references sites(id) on delete cascade,
  day date not null, agent text not null,
  kind text not null check (kind in ('ai_crawler','ai_agent','search','other')),
  hits int not null, primary key (site_id, day, agent)
);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  text text not null, tags text[] not null default '{}',
  active boolean not null default true,
  unique (site_id, text)
);
create table prompt_checks (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  engine text not null check (engine in ('chatgpt_search','gemini','claude','perplexity','ai_overviews','ai_mode')),
  result text not null check (result in ('top','cited','named','absent','unavailable')),
  cited_urls text[] not null default '{}', answer_excerpt text,
  cost_cents int not null default 0,
  checked_at timestamptz not null default now()
);
create index on prompt_checks (prompt_id, engine, checked_at desc);

create table gsc_queries (
  site_id uuid not null references sites(id) on delete cascade,
  day date not null, page text not null, query text not null,
  impressions int not null, clicks int not null, position numeric(6,2) not null,
  primary key (site_id, day, page, query)
);

create table monitors (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  kind text not null check (kind in ('uptime','cert','visual','lighthouse','links','sitemap','content')),
  target text not null, config jsonb not null default '{}',
  enabled boolean not null default true
);
create table checks (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references monitors(id) on delete cascade,
  ok boolean not null, value jsonb not null,               -- status code, scores, diff percent
  artifact_path text,
  ran_at timestamptz not null default now()
);
create index on checks (monitor_id, ran_at desc);

create table findings (                                    -- the cards on Home
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  source text not null,                                    -- monitor kind, seo, ai_visibility, playbook
  severity text not null check (severity in ('high','medium','low')),
  title text not null, evidence jsonb not null, proposed_action jsonb,
  status text not null default 'open' check (status in ('open','in_progress','fixed','dismissed')),
  deploy_id uuid references deploys(id) on delete set null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (site_id, dedupe_key)
);
create index on findings (status, severity, created_at desc);

create table playbooks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, title text not null, description text,
  category text, path text not null,                       -- markdown file in the deploy repo
  agent_tier text not null default 'full'
);
create table schedules (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references playbooks(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  cron text not null, timezone text not null,
  starts_at timestamptz, ends_at timestamptz,
  enabled boolean not null default true
);
create table runs (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid references playbooks(id) on delete set null,
  site_id uuid references sites(id) on delete cascade,
  deploy_id uuid references deploys(id) on delete set null,
  trigger text not null check (trigger in ('manual','schedule','webhook','deploy','mcp')),
  status text not null check (status in ('queued','running','succeeded','failed','stopped_budget')),
  cost_cents int not null default 0, trace_path text,
  started_at timestamptz not null default now(), finished_at timestamptz
);
create index on runs (site_id, started_at desc);

create table documents (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete set null,
  path text not null unique, title text not null, tags text[] not null default '{}',
  body text not null, kind text not null default 'doc' check (kind in ('doc','report','memory')),
  updated_at timestamptz not null default now()
);

create table webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, key_hash text not null,
  playbook_id uuid references playbooks(id) on delete set null,
  enabled boolean not null default true
);
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references webhook_endpoints(id) on delete cascade,
  payload jsonb not null, received_at timestamptz not null default now()
);

create table api_tokens (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  name text not null, token_hash text not null unique,
  scopes text[] not null, expires_at timestamptz not null, revoked_at timestamptz
);

create table usage (                                       -- the budget meter
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  site_id uuid references sites(id) on delete set null,
  run_id uuid references runs(id) on delete set null,
  provider text not null, model text not null,
  tokens_in int not null default 0, tokens_out int not null default 0,
  cost_cents int not null
);
create index on usage (ts desc);
create table budget (month date primary key, cap_cents int not null default 10000);

create table audit_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  actor_type text not null check (actor_type in ('member','agent','token','system')),
  actor_id text not null, scope text, action text not null,
  target text, input jsonb, output jsonb, cost_cents int not null default 0
);
create index on audit_log (ts desc);
```

Hard constraints from recon, handled in the database and not the UI:

- A finding is unique per `(site_id, dedupe_key)`, so a monitor that fails every 5 minutes yields one card.
- `sites.verified_at is not null` is checked by a `security definer` function `assert_site_verified(site_id)` that every job calls before it inserts into `checks`, `prompt_checks`, `gsc_queries` or `events`.
- `usage` inserts go through a function that compares the month's sum with `budget.cap_cents` and raises when the cap is reached.
- `audit_log` is insert-only: no update or delete policy exists.

## 4. API

All routes are Pages Functions under `/api`. Auth is a Supabase session cookie, an API token, or an OAuth access token; each carries scopes.

| Method | Path | What it does | Scope | Flow |
| --- | --- | --- | --- | --- |
| POST | `/api/sites` | Add a site, return the verification token | data:write (admin) | setup |
| POST | `/api/sites/{id}/verify` | Check DNS TXT, meta tag or file; set `verified_at` | data:write (admin) | setup |
| GET | `/api/sites` | Portfolio rows with rollups | data:read | home |
| GET | `/api/findings` | Feed with filters | data:read | home |
| POST | `/api/findings/{id}/dismiss` | Dismiss with a reason | data:write | home |
| POST | `/api/findings/{id}/fix` | Open a Deploy seeded with the finding | chat | fix |
| POST | `/api/deploys` | Start a Deploy (site, goal, first message, tier) | chat | fix |
| GET | `/api/deploys/{id}` | Deploy with status, branch, preview URL | data:read | fix |
| POST | `/api/deploys/{id}/messages` | Send, queue or steer a message | chat | fix |
| GET | `/api/deploys/{id}/stream` | Server-sent events: tokens, plan steps, tool calls | data:read | fix |
| GET | `/api/deploys/{id}/artifacts` | Gallery items, filter by kind | data:read | review |
| GET | `/api/deploys/{id}/changes` | Diff and screenshot pairs from the pull request | data:read | review |
| POST | `/api/approvals/{id}` | Approve or reject | site:publish for merge and publish; data:write otherwise | review |
| POST | `/api/sites/{id}/rollback` | Promote the previous production deployment | site:publish | publish |
| GET | `/api/sites/{id}/releases` | Deploy list and logs | data:read | publish |
| GET | `/api/sites/{id}/analytics` | Aggregates by tab, range, filters | data:read | analytics |
| GET | `/api/sites/{id}/prompts` | Prompts with latest result per engine | data:read | ai visibility |
| POST | `/api/sites/{id}/prompts` | Add or archive prompts | data:write | ai visibility |
| POST | `/api/sites/{id}/prompts/check` | Queue a check run, returns a cost estimate first | chat | ai visibility |
| GET | `/api/sites/{id}/seo/gaps` | Keyword gaps per page | data:read | seo |
| GET | `/api/playbooks` | Library | data:read | playbooks |
| POST | `/api/playbooks/{slug}/run` | Run now | chat | playbooks |
| POST | `/api/playbooks/{slug}/schedules` | Create a schedule from plain language; stores cron and zone | data:write | playbooks |
| GET | `/api/runs` | Run history with cost and trace link | data:read | playbooks |
| POST | `/api/v1/webhook/{slug}` | Inbound webhook, bearer key, JSON up to 1 MB, 60 a minute | endpoint key | webhooks |
| GET | `/api/usage` | Spend by site, playbook, model; cap status | data:read | budget |
| GET | `/api/audit` | Audit log, CSV export | data:read (admin) | audit |
| POST | `/api/tokens` | Create a token, shown once | admin | access |
| * | `/api/mcp` | MCP over Streamable HTTP | OAuth scopes | agents |

Edge, on each monitored site (served by the `deploy-ingest` Worker through a Pages route):

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/_deploy/t.js` | Tracking script, under 5 KB gzipped. Exposes `window.deploy.track`, `.identify`, `.consent` |
| POST | `/_deploy/ingest` | Events. Validates `Origin` against `sites.hostname` and the tracking key, drops raw IP, derives channel and country |

Agent-facing files Deploy generates for each of our sites as pull requests: `/llms.txt`, `/.well-known/api-catalog`, markdown renditions on `Accept: text/markdown`.

MCP tools (names are ours; Ploy's are unpublished):

| Scope | Tools |
| --- | --- |
| `deploy:data:read` | `list_sites`, `get_site_summary`, `list_findings`, `get_analytics`, `get_ai_visibility`, `get_seo_gaps`, `list_deploys`, `read_deploy`, `list_artifacts`, `list_runs` |
| `deploy:chat` | `start_deploy`, `send_message`, `answer_question`, `run_playbook` |
| `deploy:data:write` | `add_prompt`, `dismiss_finding`, `create_schedule`, `write_document` |
| `deploy:site:publish` | `approve_and_merge`, `rollback_site` |

## 5. Jobs

All run in GitHub Actions in the Deploy repo. Each job calls `assert_site_verified` first and writes `runs`, `usage` and `audit_log`.

| Job | Trigger | Does | Writes |
| --- | --- | --- | --- |
| `uptime` | every 5 minutes | HEAD each site and key pages; certificate days left | checks, findings |
| `post-deploy` | Cloudflare Pages deployment webhook | Lighthouse, visual diff against the last baseline, broken links on changed pages | checks, findings, artifacts |
| `crawl` | daily 02:00 site time | Sitemap, canonical, robots, links, structured data, content hashes | checks, findings |
| `gsc-sync` | daily | Pull Search Console rows for the last 3 days | gsc_queries |
| `seo-gaps` | weekly | Compare 90-day queries with page text; draft suggested edits | findings, approvals |
| `ai-visibility` | weekly, staggered per site | Run tracked prompts across engines with a per-run cost cap | prompt_checks, findings |
| `bot-rollup` | daily | Aggregate AI crawler and agent hits from Cloudflare analytics | bot_hits |
| `schedule-tick` | every 15 minutes | Fire due playbook schedules | runs |
| `agent-run` | `repository_dispatch` from the API | LangGraph run for a Deploy or playbook | messages, artifacts, approvals |
| `weekly-report` | Monday 08:53 site time | Compose and email the report; store as a document | documents |
| `partition-maintenance` | monthly | Create next month's `events` partition; drop data past retention | none |

Retries: 3 with exponential backoff. A third failure raises a finding with source `system`. External calls sit behind a circuit breaker that opens after 5 consecutive failures for 15 minutes.

## 6. Agent design

LangGraph graph per run, state checkpointed to Supabase after every node so a run can resume.

```
intake -> plan -> [research | analyze | draft_code | draft_copy]* -> verify -> propose -> (wait approval) -> apply -> report
```

| Node | Model tier | Tools |
| --- | --- | --- |
| intake, plan | lite | read finding, read site summary, read `PRODUCT.md` and `DESIGN.md` from the site repo |
| research, analyze | lite, bulk on the free tier | analytics query, GSC query, crawl results, prompt check results |
| draft_code | full | checkout the site repo, edit, run the site's own build and tests, open a pull request |
| draft_copy | cheap | page text edits within the site's components |
| verify | full | preview URL from Cloudflare, Lighthouse, visual diff, link check; failing verify loops back at most 3 times |
| propose | lite | write an approval card with diff, screenshots, scores and cost |
| apply | none | merge after approval if the scope allows; otherwise stop at "waiting approval" |
| report | lite | summary message, artifacts to the gallery, close or keep the finding |

Rules the graph enforces:

- No write outside the site's repo branch before approval. No direct push to a default branch.
- Every fetch goes through `assertVerifiedHost`.
- Text from fetched pages, issues or search results is data. It never changes the plan's permissions or scope.
- A run stops with `stopped_budget` when the cap is reached, and says how much was left undone.
- A turn that ends without a result posts "stopped at step N" in the thread. Ploy's silent stop is the failure this avoids.

## 7. Analytics pipeline

1. `t.js` waits for consent where the site requires it, sets `deploy_anon_id` (1 year) and sends a batch on pageview, on `visibilitychange` and on custom events.
2. The Worker validates origin and key, adds country from `request.cf`, classifies channel (referrer and user agent tables for AI assistants: ChatGPT, Gemini, Claude, Perplexity, Copilot), and writes batched rows to `events`.
3. Hourly rollups feed the dashboard tabs. Raw events are kept 13 months.
4. The same batch is forwarded to PostHog when the site has it configured.

## 8. Security

| Concern | Control |
| --- | --- |
| Who can sign in | Cloudflare Access policy listing allowed emails; Functions fail closed without a valid Access token |
| Agent overreach | Scopes on every route and tool; publish is separate; approvals are required rows, not UI state |
| Secrets | Stored in GitHub Actions and Cloudflare secrets. The app shows names, never values |
| Tokens | SHA-256 hashes only; shown once; expiry of 30, 90 or 365 days |
| Prompt injection from site content | Fetched text is passed as quoted data; tools that write need an approval card built from structured fields, not from model free text |
| Foreign hosts | `assertVerifiedHost` plus `assert_site_verified`; attempts are audited |
| Data minimisation | No raw IP stored; anon id only; consent recorded in `deploy_consent` |

## 9. Testing

| Level | What | Tool |
| --- | --- | --- |
| Unit | channel classifier, cron parser, dedupe keys, budget function, ownership check | Vitest; pgTAP for SQL functions |
| Integration | ingest Worker against a local Supabase; each job against a fixture site | Miniflare, `supabase start` |
| End to end | flows F01 to F06 from `replica/recon.md` on a staging site | Playwright, traces off by default |
| Parity | feature score and layout diff of D01 to D09 against the wireframes | replica-diff `parity.py`, `imgdiff.py` |
| Brand | nothing of Ploy left | replica-brand `sweep.py . --avoid "Ploy"` |
| Design quality | audit and polish pass, Operate mode | impeccable skill |

## 10. Build order

Thin vertical slice first: one site, one monitor, one finding card, one approval, one pull request. Then widen. The ordered steps and their exit tests are in `CHECKPOINTS.md`.
