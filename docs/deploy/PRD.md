# Deploy: product requirements document

Status: draft v1, 2026-11-11. Owner: Ariel Shapira. Prepared with AI assistance.
Inputs: `REVERSE-ENGINEERING-REPORT-V7.md`, `replica/recon.md`, `replica/features.csv`.

## 1. Problem

Our sites launch and then drift. Traffic, search rankings, AI-answer citations, page speed and broken links change every week, and nobody is watching all of them. Ploy sells an agent that watches and fixes a website for $50 to $300 a month per workspace, on its own hosting, with our code inside its sandbox. We want the same loop on our own stack, for our own sites, at our own cost ceiling.

## 2. Product in one sentence

Deploy is an internal agent that watches every website we own, tells us what changed and what to do, and ships the fix as a pull request once a person approves.

## 3. Scope

**In scope: websites we own and can prove we own.** Starting list (edit before build):

| Site | Repo | Host |
| --- | --- | --- |
| biddeed.ai | breverdbidder/biddeed-web | Cloudflare Pages |
| dealdeed.app (RentalIQ is merged into it) | breverdbidder/rentaliq | Cloudflare Pages, project `rentaliq` |
| ZoneWise (hostname to confirm) | breverdbidder/zonewise-web | Cloudflare Pages |

Repositories are matched by name and still need confirming when each site is connected.

**Hard rule.** Deploy never crawls, screenshots or queries a host that has not passed ownership verification (DNS TXT record, meta tag, or a file at `/.well-known/deploy-verify.txt`). This is enforced in the crawler and the job runner, not only in the UI. Competitor monitoring is out.

**Out of scope:** hosting, domain and SSL management, visitor identification, contact enrichment, ad platforms, billing, multi-tenant organizations, a public sign-up.

## 4. Users

| User | Needs | Time available |
| --- | --- | --- |
| Ariel, owner | One screen each morning: what changed, what needs a yes or no | Minutes a day |
| Claude Code and other agents | Read findings, start work, open pull requests, never publish without the publish scope | Continuous |
| A future collaborator | Read access, comment, approve drafts | Occasional |

## 5. Goals and measures

| Goal | Measure | Target |
| --- | --- | --- |
| Nothing breaks unseen | Time from a regression (down, broken link, web vitals, visual change) to an alert | Under 15 minutes for uptime, under 24 hours for the rest |
| Findings turn into fixes | Share of high-severity findings with an approved fix inside 7 days | 80% |
| AI answers cite us more | Answer share across tracked prompts | Up quarter over quarter, per site |
| Owner time stays small | Approvals per week, median time per approval | Under 20 approvals, under 1 minute each |
| Cost stays bounded | Monthly model and API spend | Under $100, hard stop at the cap |
| Parity with Ploy on the chosen slice | `parity.py` on `replica/features.csv` | All 39 must-haves for v1, 85 or higher for parity |

## 6. Principles

1. **GitHub is the source of truth.** The agent changes a site by opening a pull request in that site's repo. No sandbox copy.
2. **Publishing is a separate permission.** Chat, read, write and publish are four scopes. Default for every agent and schedule: no publish.
3. **Every finding is a card.** Each one states what changed, the evidence, the proposed action and its cost, with Approve, Edit and Dismiss.
4. **Every action is logged.** Human or agent, with actor, scope, input, output and cost.
5. **A budget, not credits.** Dollars per month with a hard cap. A run that would cross the cap stops and says so.
6. **Own sites only.** See the hard rule above.
7. **Deploy has its own brand.** Nothing of Ploy's name, type, art or copy ships. `sweep.py` gates the release.

## 7. Requirements

Priorities follow `features.csv`. IDs are stable; the checkpoints and the specification refer to them.

### 7.1 Access and workspace

| ID | Requirement | Priority |
| --- | --- | --- |
| R-01 | Sign in through Cloudflare Access (one-time email code or Google), restricted to an allowlist of emails in the Access policy. No sign-up page. Every API request verifies the Access token | must |
| R-02 | Roles: owner, admin, member. Only owner and admin can approve publishing | should |
| R-03 | Site registry: add a domain, prove ownership, connect its GitHub repo and Cloudflare project, install tracking | must |
| R-04 | Audit log of every agent and human action, filterable, exportable as CSV | must |
| R-05 | API tokens with expiry for CI and remote agents | should |

### 7.2 Home

| ID | Requirement | Priority |
| --- | --- | --- |
| R-10 | Portfolio table: every site with status, 7-day visitors, AI answer share, open findings, last deploy | must |
| R-11 | "Needs you" feed of approval cards, newest and highest severity first, with filters | must |
| R-12 | Activity log of runs, deploys and alerts | should |

### 7.3 Deploys (the agent workspace)

A Deploy is one goal-scoped chat with the agent, bound to one site. It is our counterpart of a "Ploy".

| ID | Requirement | Priority |
| --- | --- | --- |
| R-20 | Chat with a visible plan and tool-call trace | must |
| R-21 | Views as tabs, addressable by URL (`?view=chat|gallery|preview|changes|runs`) | must |
| R-22 | Gallery: every artifact the Deploy produced (page drafts, images, reports, datasets), filterable by type | must |
| R-23 | Preview: the pull request's Cloudflare Pages preview, with desktop, tablet and mobile widths | must |
| R-24 | Changes: the Git diff and a before / after screenshot pair | must |
| R-25 | Approval cards in the thread for anything that writes outside the Deploy (merge, publish, schedule, spend over a threshold) | must |
| R-26 | Two agent tiers, full and lite, selectable per message | should |
| R-27 | File attachments; queue or steer a message while the agent works | should / could |

### 7.4 Publishing

| ID | Requirement | Priority |
| --- | --- | --- |
| R-30 | Publish means merge the pull request; Cloudflare Pages deploys it | must |
| R-31 | Per-site policy: off, preview only, preview and production. Default off | should |
| R-32 | Deploy list with status and build log | must |
| R-33 | One-action rollback to the previous production deployment | should |

### 7.5 Analytics

| ID | Requirement | Priority |
| --- | --- | --- |
| R-40 | First-party tracking of pageviews, sessions, sources, scroll depth, clicks, forms | must |
| R-41 | Channels including AI assistants; a Bots card separating AI crawlers from agent visits | must / should |
| R-42 | Consent support: no cookie before consent where required | must |
| R-43 | Tabs: Overview, Pages, Sources, AI assistants, Events, Forms, Web vitals | must |
| R-44 | Connect Search Console and GA4; forward events to PostHog | must / should |
| R-45 | Dashboards the agent can build and save | should |

### 7.6 AI visibility

| ID | Requirement | Priority |
| --- | --- | --- |
| R-50 | Tracked prompts per site, checked against ChatGPT search, Gemini, Claude, Perplexity, Google AI Overviews and AI Mode | must |
| R-51 | Per prompt and engine: named, cited, top, or absent, with the cited URLs, kept as history | must |
| R-52 | Agent readiness audit with a score: `llms.txt`, markdown negotiation, structured data, sitemap, robots signals | must |
| R-53 | Generate `llms.txt` and an API catalog for each site as a pull request | should |

### 7.7 SEO

| ID | Requirement | Priority |
| --- | --- | --- |
| R-60 | Keyword gaps: Search Console queries over 90 days compared with page content, marked covered, partial or missing | must |
| R-61 | Suggested edits queue with Approve, Edit, Dismiss | must |
| R-62 | Technical checks: sitemap, canonical, robots, broken links | must |
| R-63 | Lighthouse on every production deploy and weekly | must |
| R-64 | Programmatic pages from a template and a table | should |

### 7.8 Monitors

| ID | Requirement | Priority |
| --- | --- | --- |
| R-70 | Uptime and certificate expiry | must |
| R-71 | Visual diff of key pages after each deploy | must |
| R-72 | Sitemap and content change detection | must |
| R-73 | Alert rules with severity and a destination (feed, email, Slack) | must |

### 7.9 Playbooks and projects

| ID | Requirement | Priority |
| --- | --- | --- |
| R-80 | Playbooks are markdown files with phases and steps, stored in Git | must |
| R-81 | Run on demand, on a plain-language schedule with a timezone, or from a webhook | must / must / should |
| R-82 | Run history with cost | must |
| R-83 | Starter library: GSC keyword optimization, agent readiness audit, weekly traffic report, broken link sweep, Lighthouse regression, content refresh, schema and llms.txt audit | should |
| R-84 | Projects: a goal with dashboard, plan, linked Deploys, outputs and a daily check-in | should |

### 7.10 Integrations and agent access

| ID | Requirement | Priority |
| --- | --- | --- |
| R-90 | Integrations: GitHub, Cloudflare, Supabase, Search Console, GA4, PostHog, Resend, Slack | must for the first four |
| R-91 | MCP server over Streamable HTTP with OAuth and four scopes: `deploy:chat`, `deploy:data:read`, `deploy:data:write`, `deploy:site:publish` | must |
| R-92 | Inbound webhooks that store events and can trigger a playbook | should |
| R-93 | Weekly emailed report per site, stored as a document | should |

### 7.11 Cost control

| ID | Requirement | Priority |
| --- | --- | --- |
| R-95 | Budget meter by site, playbook and model, with a monthly cap that stops runs | must |
| R-96 | Cost estimate before any batch job; sample first | should |

## 8. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Security | Row level security on every table. Secrets only in GitHub and Cloudflare secret stores. Tokens hashed at rest. Agent never sees secret values |
| Privacy | Analytics stores no raw IP; anonymous id cookie only after consent where required |
| Reliability | A failed job retries 3 times with backoff, then raises a finding. Circuit breaker on every external API |
| Performance | Tracking script under 5 KB gzipped; ingest responds under 100 ms at the edge; dashboards load under 2 s |
| Accessibility | Checked in the audit step before release, WCAG 2.1 AA |
| Observability | Every run has a trace: steps, tool calls, tokens, dollars |

## 9. Release plan

| Release | Contains | Exit |
| --- | --- | --- |
| v0, week 1 | Registry with ownership check, uptime, Lighthouse, broken links, Home with findings | 4 sites verified, first findings shown |
| v0.5, week 2 | Tracking and Analytics, Search Console, SEO keyword gaps | 7 days of data on one site |
| v1, weeks 3 to 5 | Deploys with chat, gallery, preview, changes; pull request flow; AI visibility; playbooks with schedules; MCP; budget cap; audit log | all 39 must-haves done |
| v1.5, weeks 6 to 9 | Projects, dashboards, webhooks, emailed reports, programmatic pages, rollback | parity score 85 |
| Later | Experiments, image generation, Slack and email as chat channels | as needed |

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| AI-answer checks are unstable and can be costly | Weekly cadence, trends not single runs, per-run cost cap, cache identical prompts for 24 hours |
| Engine terms on automated querying | Use official APIs with search or grounding where they exist; mark an engine "unavailable" instead of scraping its consumer UI |
| Agent ships a bad change | Pull request, preview, visual diff and Lighthouse gate, human approval, one-action rollback |
| Scope creep toward Ploy's full surface | `features.csv` is the contract; skipped rows stay skipped unless the PRD changes |
| Looking like Ploy | Own brand pass before release; `sweep.py` blocks on Ploy's name, domain and colours |
| Ploy account terms | Do not use the Ploy account for further recon until the terms are read (report section 11, item 3) |

## 11. Decisions that are yours

1. Domain: decided 2026-11-11. No custom domain. Deploy runs on our Cloudflare account as a Pages project (`deploy-internal`, default `pages.dev` hostname) behind Cloudflare Access.
2. Site list: decided 2026-11-11. Three sites; RentalIQ is part of dealdeed.app. ZoneWise's hostname is still needed.
3. Whether any site may ever auto-publish to production (default: no).
4. The monthly cap (default: $100).
