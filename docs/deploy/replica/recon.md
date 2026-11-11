# Recon map: Ploy (web)

Scope: the "run and grow the websites you already have" loop: agent chat with artifacts, analytics, AI search visibility, SEO, playbooks, publishing. Not the site-migration funnel, not audience data, not billing.
For: Everest Capital USA internal use. Deploy monitors and works on our own websites only.
Date: 2026-11-11
Method: replica-recon (public sources only), with REA-style evidence discipline: every claim carries a source and a confidence, and unknowns stay unknown.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | product docs, full text | https://docs.ploy.ai/llms-full.txt | 550 KB, 73 pages. Digest in `../evidence/ploy-docs-digest.md` |
| 2 | marketing index for agents | https://ploy.ai/llms.txt | product list, comparisons, 249 blog posts |
| 3 | sitemap index | https://ploy.ai/sitemap-index.xml | 460 URLs, list in `../evidence/ploy-sitemap-urls.txt` |
| 4 | pricing page | https://ploy.ai/pricing | plans, credits, gating |
| 5 | MCP server card | https://ploy.ai/.well-known/mcp/server-card.json | endpoint, transport, scopes |
| 6 | OAuth metadata | https://ploy.ai/.well-known/oauth-authorization-server/api/auth | endpoints, PKCE, DPoP |
| 7 | API catalog (RFC 9727) | https://ploy.ai/.well-known/api-catalog | links 5 and 8 |
| 8 | agent-tools OpenAPI | https://ploy.ai/agent-tools/openapi.json | two public operations |
| 9 | rendered public pages | 85 pages via Playwright | `SCREENS.md`, `screens/` |
| 10 | the owner's Ploy workspace | https://ploy.ai/workspaces/.../ploys/...?view=gallery | redirects to login. Not captured: no credentials were used |

Terms check: Ploy's robots.txt allows crawling with `Content-Signal: search=yes, ai-input=yes, ai-train=no`. Nothing here was used for training. No JavaScript bundles were read, no private endpoints were called, and nothing behind the login was accessed.

## Core loop

An agent watches a website's traffic, search and AI-answer data, proposes page changes in the site's own design system, and ships them after a person approves.

## Screens

Logged-in screens are reconstructed from the docs (source 1). "Seen" means a screenshot exists; "documented" means labels come from the docs only.

| ID | screen | route / how to reach | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Log in | `/auth/login` | email + password, passkey, Google, SSO | form, 4 auth options, help link | seen: default. documented: logged_out reason |
| S02 | Sign up | `/auth/sign-up` | email first, then Google | single-field form | seen: default. documented: account exists, join org, request access |
| S03 | Setup wizard | after sign-up | site URL, business read-back, goals, design choice | full-screen questions, Continue / Back | documented: skip, out of credits, resume |
| S04 | Overview | sidebar Overview | prompt box "What should we work on?", For you feed | composer, filter chips, cards (Needs input, Recommendation) | documented: empty, dismissed |
| S05 | Chat (a "Ploy") | `/workspaces/{id}/ploys/{id}` | one goal, one thread | composer, site picker, agent picker, queued area, artifact viewer | documented: replying, stopped, question pending, expired session |
| S06 | Chat gallery | `...?view=gallery` | artifacts of the chat as a grid | not documented | route confirmed, contents inferred |
| S07 | Preview | chat viewer pane | live site preview | Publish, Versions, desktop/mobile toggle, screenshot, Pages panel | documented: offline, reconnect |
| S08 | Publish panel | Publish button | pick Production or Preview | target tiles, status, QR, gear menu | documented: paused, failed, fix, sandbox full |
| S09 | Projects list | sidebar Projects | goals | rows, New Project, Suggested Projects | documented: empty suggestions |
| S10 | Project page | project row | goal home | tabs Work, Dashboard, Plan, Chats, Outputs, Context | documented: no data yet, drafted for you |
| S11 | Ploybooks | Overview and Library | saved workflows | tabs Suggested / Scheduled, library categories, Run, Customize, Share | documented |
| S12 | Schedule dialog | Ploybook page | plain-language schedule | cadence text, timezone, start, end, enable | documented |
| S13 | Site dashboard | Sites, site | analytics cards | cards, tabs, date range, Save for everyone, Refresh | documented: partial refresh, 1,000-row cap |
| S14 | Site overview | Sites, site | traffic summary | Top Sources, Bots card | documented |
| S15 | Visitors | site tab | identified people and companies | table, enrichment settings | documented: limit reached |
| S16 | Submissions | site dashboard tab | form inbox | list, Notifications | documented |
| S17 | Experiments | site nav | champion vs challenger | create dialog, traffic split, statuses | documented: 7 statuses |
| S18 | Domains | site menu | custom domains | Add domain, DNS records, Path routing | documented: pending, provisioning, connected |
| S19 | Path routing | domain page | route paths to origins | ordered rows, Add path dialog, History, Test a URL, JSON edit | documented: edge sync failed |
| S20 | Deploys | site dashboard | deployment list | rows, build log | documented: failed |
| S21 | Environment | site settings | variables and secrets | tabs Preview / Production, Add dialog | documented |
| S22 | Databases | sidebar | tables | Table, Kanban, Diagram views, record panel, CSV import | documented: import partial / failed |
| S23 | Library Docs | Library | markdown docs and reports | search, tags, folders, New Doc | documented |
| S24 | Library Assets | Library | files | categories, Upload, Details | documented |
| S25 | Integrations | sidebar | connections | searchable cards, Connect, MCP tab | documented: reconnect, allow writes |
| S26 | Settings | sidebar | workspace, org, billing, usage, developer, webhooks, security, audit log | tabbed settings | documented |
| S27 | Marketing home | `/` | pitch | hero video, logo wall, Monitor / Act / Surface | seen |
| S28 | Pricing | `/pricing` | plans | Monthly / Annual toggle, 4 plan cards, comparison table | seen: both toggles |
| S29 | Feature page | `/features/*` | one capability | hero, mock UI, FAQ | seen: 10 pages |
| S30 | Docs | `docs.ploy.ai/*` | help | left nav, search, on-this-page, Ask Ploy | seen: 12 pages |

## Flows

```
F01 Fix a page from a signal
    S04 For you card -> S05 chat -> S07 preview -> S08 publish
    happy path clicks: 4
    edge: agent stops mid-task, publish fails, out of credits

F02 Check AI visibility
    S05 chat "how do AI tools answer X" -> result table -> save as Ploybook -> S12 schedule
    happy path clicks: 5
    edge: answers differ per run, engine unavailable

F03 Close keyword gaps
    S11 run GSC Keyword Optimization -> suggested edits -> approve -> S08 publish
    happy path clicks: 5
    edge: Search Console not connected, page not in design system

F04 Run a goal for weeks
    S09 New Project -> S10 Work tab -> daily check-in -> S10 Outputs
    happy path clicks: 3, then zero per day
    edge: no data yet, check-in spends credits with nothing to do

F05 Drive it from another assistant
    add MCP URL -> OAuth consent with scopes -> chat tool call -> publish as separate permission
    happy path clicks: 6
    edge: scope change needs reconnect

F06 Review a Deploy's output (the owner's linked view)
    S05 chat -> S06 gallery -> open artifact -> S07 preview
    happy path clicks: 3
    edge: no artifacts yet
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary (dark pill), secondary (white pill, grey border), ghost | default, hover, focus, disabled, loading | all |
| Composer | with site picker, agent picker, attach, mic | idle, replying, queued, out of credits | S04, S05 |
| Card | recommendation, needs input, artifact, KPI, plan | default, dismissed, draft | S04, S06, S10, S13 |
| Tabs | pill tabs, underline tabs | active, inactive | S10, S11, S13, S21, S28 |
| Table | sortable, with row menu | empty, loading, capped | S13, S15, S20, S22 |
| Side nav | workspace switcher, sections, bottom utilities | collapsed, active item | all app screens |
| Dialog | form, confirm, upgrade | default, error | S12, S17, S19 |
| Status badge | deploy, domain, experiment | 3 to 7 states each | S08, S18, S17, S20 |
| Toast with undo | routing saved | shown, undone | S19 |
| Chart | line, bar, funnel | no data yet, loaded | S10, S13 |
| Preview frame | desktop, mobile | live, offline, reconnecting | S07 |

## Inferred data model

```
Organization  id, name, plan, credits
              evidence: docs /working-with-a-team, /credits    confidence: high
Workspace     id, org_id, name, site_url, summary(<=500), logo, timezone
              evidence: docs /core-concepts, Settings General   confidence: high
Site          id, workspace_id, name, default_hostname, auto_publish(off|preview|preview+production)
              evidence: docs /publishing                         confidence: high
Chat (Ploy)   id, workspace_id, site_id, title, agent(ploy|lite), participants
              evidence: route /workspaces/{id}/ploys/{id}, CLI `ploy chat`   confidence: high
Turn          id, chat_id, sender_id, status, questions[]
              evidence: CLI `--steer <turn-id>`, `chat questions`           confidence: medium
Artifact      id, chat_id, type(page|document|image|chart|database), ref
              evidence: docs /core-concepts "thread, plan, and artifacts"   confidence: medium
Project       id, workspace_id, outcome, memory_doc, checkin_schedule
              evidence: docs /projects                           confidence: high
Ploybook      id, workspace_id, title, description, tags[], content(markdown)
              evidence: CLI `ploy ploybook create`               confidence: high
Schedule      id, ploybook_id, cron, timezone, starts, ends, enabled
              evidence: CLI `schedule create --cron --timezone`  confidence: high
Run           id, ploybook_id|project_id, chat_id, started_at, status
              evidence: Run History                              confidence: medium
Deploy        id, site_id, target(production|preview), status, log
              evidence: docs /publishing, CLI publish-status     confidence: high
Domain        id, site_id, hostname, state, ssl_status, dns_verified, kv_synced
              evidence: CLI `ploy domain list --json`            confidence: high
RoutingDoc    hostname, rules[<=20], default_fallback
              evidence: CLI `site routing get`                   confidence: high
Event         site_id, anon_id, session, name, props, ts, channel
              evidence: docs /analytics, cookie ploy_anon_id     confidence: medium
Dashboard     id, site_id|project_id, cards[]
              evidence: docs /analytics                          confidence: medium
Database/Table/Field/Row  ids pdb_ tbl_ fld_ row_
              evidence: docs /database/external-apps             confidence: high
Document      id, path, title, tags[], body(markdown)
              evidence: docs /documents                          confidence: high
WebhookEndpoint  slug, key, ploybook_id?, table_id?, enabled; WebhookEvent id, payload
              evidence: docs /webhooks                           confidence: high
Integration   id, workspace_id|user_id, provider, write_access
              evidence: docs /integrations                       confidence: medium
ApiToken      id, workspace_id, prefix sk_ploy_pat_, expires(30|90|365d)
              evidence: docs /cli/authentication                 confidence: high
```

Relationships: Organization 1-n Workspace, Workspace 1-n Site, Workspace 1-n Chat, Chat n-1 Site, Chat 1-n Turn, Chat 1-n Artifact, Workspace 1-n Project, Project n-n Chat, Project n-n Ploybook, Ploybook 1-n Schedule, Ploybook 1-n Run, Site 1-n Deploy, Site 1-n Domain, Site 1-n Event.

## Feature matrix

See `features.csv`. Must: 43, should: 30, could: 26. Skipped on purpose: 17. Starting parity score from `parity.py`: 0 of 39 counted must-haves.

## Out of scope (cannot or should not be cloned)

- Visitor identification and contact enrichment: third-party licensed data.
- Competitor monitoring and Semrush data: excluded by the owner. Deploy's crawler refuses any host that has not passed ownership verification.
- Ploy's hosting network, reverse proxy and custom-hostname SSL: our sites already sit on Cloudflare.
- Billing, plans, agency organizations, referrals.
- Ploy's name, logo, copy, 3D balloon art, FK Screamer display type and page layouts. Deploy gets its own brand through replica-brand and `sweep.py`.

## Size

Screens 30 mapped, 12 to build. Flows 6. Entities 21. Hard parts: the agent loop with human approval, AI-answer checks across six engines, first-party analytics ingest, visual diff monitoring. Size: L (a quarter for full scope; the first usable slice is 2 weeks).
