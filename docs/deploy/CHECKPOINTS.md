# Deploy build checkpoints

Prepared with AI assistance, 2026-11-11.

Each checkpoint has an exit test. Do not start the next one until the test passes and the state file is updated. State lives in `deploy/STATE.json` in the Deploy repo: `{ "checkpoint": "CP-07", "status": "done|in_progress|blocked", "parity": 0, "notes": "" }`.

Requirement IDs refer to `PRD.md`. Tables, routes and jobs refer to `PRS.md`.

## Phase 0: recon (done in this branch)

| ID | Checkpoint | Exit test | Status |
| --- | --- | --- | --- |
| CP-00 | Public recon of Ploy: sitemap, machine surface, docs digest | `evidence/` holds the 11 files; `replica/recon.md` has screens, flows, data model | done |
| CP-01 | Screenshots of every public template and tab state | `replica/SCREENS.md` lists 85 pages; 129 images present | done |
| CP-02 | Feature matrix and parity baseline | `parity.py replica/features.csv` runs and reports 0 of 39 must-haves | done |
| CP-03 | Wireframes D01 to D09 | 11 SVGs render | done |
| CP-04 | Owner decisions: domain, site list, cap, auto-publish policy | Answers recorded in `PRD.md` section 11 | open, needs Ariel |
| CP-05 | Logged-in recon in the owner's own browser session (optional) | Gallery view and app screens saved to `replica/screens/app/`; Ploy terms read first | open, needs Ariel |

## Phase 1: foundation (v0, week 1)

| ID | Checkpoint | Exit test |
| --- | --- | --- |
| CP-10 | New private repo, Astro app shell, Cloudflare Pages project, CI (lint, typecheck, unit) | Preview URL serves the shell; CI green |
| CP-11 | Supabase project, migrations for `members`, `allowlist`, `sites`, `audit_log`, `usage`, `budget` with row level security | pgTAP: a non-allowlisted email cannot sign in; `audit_log` rejects update and delete |
| CP-12 | Sign in (R-01) and app chrome from D01 and D02 | Playwright: allowlisted user reaches Home; other email is refused |
| CP-13 | Site registry and ownership verification (R-03) | Adding `example.com` without proof leaves `verified_at` null; `assertVerifiedHost('https://example.com')` throws and writes an audit row |
| CP-14 | `uptime` and `crawl` jobs, `monitors`, `checks`, `findings` with dedupe (R-62, R-70, R-72) | A deliberately broken link on a staging page yields exactly one finding after two runs |
| CP-15 | `post-deploy` job: Lighthouse and visual diff (R-63, R-71) | A staging deploy that shifts the hero yields a visual finding with before and after images |
| CP-16 | Home: portfolio table, Needs you feed, dismiss (R-10, R-11) | Findings from CP-14 and CP-15 appear as cards; dismiss persists |

Gate G1: all four sites verified, first real findings on Home, spend so far $0.

## Phase 2: measurement (v0.5, week 2)

| ID | Checkpoint | Exit test |
| --- | --- | --- |
| CP-20 | `deploy-ingest` Worker, `t.js`, `events` partitions (R-40, R-42) | Script under 5 KB gzipped; no cookie before consent on a consent-required page; foreign `Origin` is rejected |
| CP-21 | Channel classifier with AI assistants; `bot-rollup` (R-41) | Unit tests cover 20 referrer and user agent cases |
| CP-22 | Analytics screen D04 with seven tabs (R-43) | Numbers match a SQL count on the same range within 1% |
| CP-23 | Search Console and GA4 connections; `gsc-sync` (R-44) | 90 days of rows for one site |
| CP-24 | SEO screen D08: keyword gaps, technical tab, Lighthouse tab (R-60, R-62) | Gaps table shows covered, partial, missing for 5 real pages |

Gate G2: 7 days of first-party data on one site; PostHog forward verified.

## Phase 3: the agent loop (v1, weeks 3 to 5)

| ID | Checkpoint | Exit test |
| --- | --- | --- |
| CP-30 | LangGraph skeleton with Supabase checkpoints, model router, `usage` writes and the cap function (R-95) | A run that would cross a $0.10 test cap ends as `stopped_budget` and says what was left |
| CP-31 | `deploys`, `messages`, streaming chat, plan and tool trace (R-20) | Playwright: send a message, see plan steps stream |
| CP-32 | Site repo tools: checkout, edit, build, open pull request; never push to a default branch | A typo-fix Deploy opens a pull request on a staging repo; an attempted direct push is refused and audited |
| CP-33 | Preview, Changes and Gallery views with `?view=` routing (R-21 to R-24) | Deep link `?view=gallery` opens the gallery; artifacts filter by kind; D03b layout diff passes |
| CP-34 | Approvals and publish scope (R-25, R-30, R-31) | Merge is refused without `deploy:site:publish`; approving merges and a release row goes live |
| CP-35 | Finding to fix: "Fix with Deploy" seeds a Deploy (flow F01) | End to end on staging in 4 clicks |
| CP-36 | Suggested edits from keyword gaps (R-61) | Approving a suggestion opens a pull request with the edit |
| CP-37 | AI visibility: prompts, `ai-visibility` job, D05 (R-50, R-51) | 10 prompts across available engines stored with citations; unavailable engines marked, not faked |
| CP-38 | Agent readiness audit and `llms.txt` pull request (R-52, R-53) | Score shown; pull request adds `llms.txt` to one site |
| CP-39 | Playbooks: markdown in Git, run, schedule from plain language, run history, D07 (R-80 to R-83) | "every Monday at 9am" stores `0 9 * * 1` with the site timezone and fires once in a test window |
| CP-40 | MCP server with OAuth and four scopes (R-91) | Claude Code connects, lists tools; a read-only grant cannot call `start_deploy` |
| CP-41 | Audit log screen and CSV export, tokens (R-04, R-05) | Every action from CP-31 to CP-40 has a row |
| CP-42 | Releases list and rollback (R-32, R-33) | Rollback restores the prior deployment in one action |
| CP-43 | Own brand: name check, palette, type, voice; `sweep.py . --avoid "Ploy"` clean | Sweep exits 0 |
| CP-44 | Design quality pass with the impeccable skill: audit, then polish | No high-severity audit findings open |
| CP-45 | Full test run: flows F01 to F06, parity score | No S1 or S2 bug open; 39 of 39 must-haves; score recorded in `STATE.json` |

Gate G3 (v1): must-haves complete, month-to-date spend under the cap, owner signs off.

## Phase 4: parity (v1.5, weeks 6 to 9)

| ID | Checkpoint | Exit test |
| --- | --- | --- |
| CP-50 | Projects with dashboard, plan, outputs, daily check-in (R-84) | A project runs 3 daily check-ins unattended |
| CP-51 | Agent-built dashboards (R-45) | "Chart signups by channel" saves a card |
| CP-52 | Inbound webhooks and webhook-triggered playbooks (R-92) | A signed POST stores an event and starts a run; the 61st request in a minute gets 429 |
| CP-53 | Weekly emailed report (R-93) | Email arrives; document stored |
| CP-54 | Programmatic pages (R-64) | 10 pages generated from one template and a table as one pull request |
| CP-55 | Forms inbox, documents, assets | CRUD and search work |
| CP-56 | Parity review | `parity.py` reports 85 or higher |

Gate G4: parity reached. Anything still skipped stays skipped unless `PRD.md` changes.

## Standing rules for every checkpoint

1. Commit small, push to a feature branch, open a pull request only when asked.
2. Run the repo's tests before pushing. Never skip or disable a test to get green.
3. After 3 failed attempts at the same problem, stop and report: problem, attempts, recommendation.
4. Ask before: any spend over $10, a schema change to a production table, deleting production data, an auth or security change, a first-time third-party integration.
5. Update `STATE.json` and the `clone` column in `features.csv` at the end of each checkpoint.
6. No host is fetched unless it is verified.
