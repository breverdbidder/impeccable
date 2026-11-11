# Ploy reverse engineering report, V7

Target: Ploy (ploy.ai), Ploy, Inc.
Purpose: build Deploy, our internal equivalent, at feature parity on the slice we need, for our own websites only.
Captured: 2026-11-11. Prepared with AI assistance.

## 1. What this report can and cannot claim

| Area | Coverage | How |
| --- | --- | --- |
| Public site, 460 URLs | Complete inventory. 85 pages rendered and screenshotted, including one sample of every template | sitemaps, Playwright + Chromium |
| Tab and toggle states | 40 tab states on 7 pages, pricing Monthly / Annual, mobile home | Playwright clicks on `[role=tab]` |
| Logged-in app | Reconstructed from 73 docs pages. No screenshots | docs.ploy.ai full text |
| Your linked view (`/workspaces/c4b2.../ploys/0b10...?view=gallery`) | Route confirmed. Contents not seen | the URL returns `307` to `/auth/login` without a session |
| API surface | Everything Ploy publishes for machines, plus XHR calls observed on public pages | well-known files, OpenAPI, passive request log |
| Tech stack | Mix of stated facts and inference, labelled per row | headers, HTML markers, docs quotes |

Three limits you should know about:

1. **The app interior was not screenshotted.** That needs your Ploy login. I did not ask for credentials and would not use them from this environment. To close the gap, see section 11.
2. **REA did not execute.** Running `npx rea-agents` was blocked by this session's permission policy (downloading and running external code). I applied REA's method instead: passive observation only, an evidence file behind every claim, limitations and unknowns kept explicit. REA's passive browser capture is the first step of the meta prompt, to be run on your machine.
3. **replica-skill's recon rules were followed.** Public sources only, no JavaScript bundles read, no private endpoints called. Its `parity.py` scored the feature matrix.

One correction to the brief: Ploy is not a competitive intelligence product. It is an AI web marketing platform (site builder, hosting, analytics, AEO, SEO agent, workflows). Competitor watching is one line of its pitch ("Ploy watches your site and your competitors'"). Deploy takes the monitoring and agent loop and drops the competitor half, as you specified.

## 2. Ploy in one page

| | |
| --- | --- |
| Company | Ploy, Inc., San Francisco, founded 2025 by Bryant Chou (source: `llms.txt`) |
| Funding | $27M seed (home page announcement, `/blog/ploy-raises-27m`) |
| Category claim | "AI-powered web marketing automation platform for growth teams" |
| Product lines | Ploy Web (build and optimize), Ploy Grow (identify and reach), Ploy Ads (create and attribute) |
| Core loop | Monitor, Act, Surface: watch signals, have agents change the site, queue next steps for a person |
| Named customers | Clay, Nursa, Avoca, Banyan Software, Attention, Adaptive, Hex, Leadbay, Volca, Once, Indie Health, CodeCrafters, TNT Growth, Tonik |
| Pricing | Free $0 (500 credits a day, 2,000 cap), Starter $50/mo (4,000 credits), Pro $300/mo (24,000 credits), Enterprise custom. Annual saves 20% |
| Paywalled | Custom domains, collaborators, GitHub sync (Starter). Ad and CRM integrations (Pro). SSO, SOC 2, Salesforce, audit log (Enterprise) |
| Channels into the agent | Web app, Slack, email, CLI, MCP, inbound webhooks |
| Content engine | 249 blog posts, 66 integration pages, 48 Ploybook pages, 12 comparison pages |

## 3. Battle card: Ploy vs Deploy

Deploy is not sold, so this card answers one question: where must we match, where can we beat, and what do we skip.

| Dimension | Ploy | Deploy (planned) | Verdict |
| --- | --- | --- | --- |
| Scope | Any customer's site plus competitors | Only sites that pass our ownership check | Narrower on purpose |
| Source of truth for site code | Ploy sandbox repo; GitHub sync is a paid add-on | GitHub, always. Agent works by pull request | Beat |
| Hosting | Own edge (Cloudflare Workers under the hood), `*.ploy.build` | Cloudflare Pages we already run | Skip building |
| Rollback | Restore a version in the editor, then republish | Promote the previous Pages deployment in one action | Beat |
| Analytics | First-party, AI-assistant channel, Bots card, agent-built dashboards | Same shape: Worker ingest to Supabase, PostHog forward | Match |
| AI visibility | ChatGPT search, Gemini, Claude, Perplexity, AI Overviews, AI Mode; no prompt cap; costs credits | Same six engines, scheduled weekly, hard dollar cap | Match |
| SEO | GSC keyword gaps, suggested edits, programmatic pages, Lighthouse on request | Same, plus Lighthouse on every deploy | Match, small beat |
| Monitoring | Claimed (rankings, traffic, gaps, conversion drops); no uptime or visual diff documented | Uptime, certificate, visual diff, sitemap and content change, web vitals | Beat |
| Workflows | Ploybooks: markdown, on demand, scheduled, webhook-triggered | Playbooks: same model, run by LangGraph in GitHub Actions | Match |
| Goals | Projects with dashboard, plan, daily check-in | Same, phase 2 | Match later |
| Agent surface | Ploy Agent and Ploy Lite; MCP with 4 scopes; CLI | Full and lite tiers through our model router; MCP with the same 4 scopes | Match |
| Audience data | Visitor identification, contact enrichment, ABM | None | Skip |
| Audit log | Enterprise only | On for everything from day one | Beat |
| Cost | $50 to $300 a month plus overage credits | Target under $100 a month in model spend, no seat or plan fees | Beat |
| Polish and breadth | A funded team, 66 integrations, weekly releases | One founder plus agents, 8 integrations | Ploy wins |

Where Ploy is weak, from its own docs (full list in `evidence/ploy-docs-digest.md`, section 19):

- Imports are "not an identical copy"; a "slurp" is a best-effort pass.
- No one-click rollback and no page password protection.
- No documented REST API. Programmatic control is CLI, MCP, PloyDB and inbound webhooks only.
- The agent can stop silently mid-task; the documented fix is to reply "continue".
- Experiments, Effects, Slack, custom MCP and workspace-level access are gated or still rolling out.
- Credit cost per action is not published, so spend is hard to predict.
- Path routing is capped at 20 rules and edge sync can fail after a successful save.

Where Ploy is strong and we should copy the idea, not the asset:

- One chat per goal, with a plan and artifacts beside the thread.
- Publishing as its own permission, separate from chat and data access.
- A "For you" feed that turns findings into approvable cards.
- Agent-facing plumbing on its own site: `llms.txt`, markdown content negotiation, API catalog, MCP server card, a search endpoint. Our sites should ship the same.

## 4. Sitemap

Public site, 460 URLs in 4 sitemaps. Full list: `evidence/ploy-sitemap-urls.txt`. Screenshots: `replica/SCREENS.md`.

```
ploy.ai
├── /                          home
├── /pricing  /pricing-wizard
├── /features/                 10 in sitemap + 2 linked
│   ├── ai-website-builder  landing-page-builder  brand-from-url
│   ├── analytics  visitor-identification  account-based-marketing
│   ├── answer-engine-optimization  seo-agent
│   ├── database  hosting
│   └── ploy-grow  ploy-ads    (linked from llms.txt, not in sitemap)
├── /for/                      startups, startups/yc, agencies, enterprise, growth, marketing, sales, exporters
├── /use-cases  /marketing-stack  /the-ploy-effect
├── /ploybooks/                index + 48 workflows
├── /integrations/             index + 66 integrations
├── /vs/                       12 comparisons (framer, webflow, vercel, sanity, v0, lovable, bolt, claude ...)
├── /alternatives
├── /customers/                index + 8 stories
├── /agencies/                 index + 5
├── /blog/                     index + 249 posts
├── /library/  /webinars/  /whats-new/   6, 6 and 12 entries
├── /mcp  /cli
├── /migration-cost-calculator  /ab-test-sample-size      free tools
├── /ployground                community
├── /about  /careers/ (7)  /contact  /demo  /faq  /startups
├── /a16z-speedrun  /a16z-speedrun-tonik
├── /privacy  /terms-of-service
├── /zh/for/exporters          one localized page
├── /auth/login  /auth/sign-up  /auth/sign-in-help
└── machine surface: /llms.txt  /robots.txt  /sitemap-index.xml
    /.well-known/api-catalog  /.well-known/mcp/server-card.json  /.well-known/mcp.json
    /.well-known/oauth-protected-resource/api/mcp
    /.well-known/oauth-authorization-server/api/auth
    /agent-tools/openapi.json  /agent-tools/search  /agent-tools/migration-estimate
    /og/ (disallowed in robots.txt)

docs.ploy.ai                   73 pages: Getting started, Platform, CLI, Integrations, Hosting, Security

Logged-in app (from docs; routes marked * are confirmed)
/workspaces/{workspace}*
├── Overview                   prompt box, For you feed
├── /ploys/{ploy}*             a chat. ?view=gallery* confirmed, other views unknown
├── Projects                   Work | Dashboard | Plan | Chats | Outputs | Context
├── Ploybooks                  Suggested | Scheduled; library by category
├── Databases                  Table | Kanban | Diagram
├── Sites/{site}
│   ├── Overview  Dashboard  Visitors  Submissions  Experiments  Deploys
│   ├── Domains                per-domain Path routing
│   └── Settings               Analytics | Environment (Preview | Production) | Developer | Advanced
├── Integrations               catalog | MCP
├── Library                    Docs | Assets | Ploybooks
└── /settings/webhooks*        plus General, Notifications, Developer, Enrichments
Organization                   People, Security, Usage, Billing, Audit log
/account/slack*                account settings: Security (passkeys), Notifications, My Credits
```

## 5. API and endpoint inventory

Confidence: **P** published by Ploy for machines, **D** documented in docs, **O** observed as a browser request on a public page. Nothing here was probed beyond a plain GET of a published URL.

| # | Method | Endpoint | Auth | Purpose | Conf. |
| --- | --- | --- | --- | --- | --- |
| 1 | Streamable HTTP | `https://ploy.ai/api/mcp` | OAuth 2 | MCP server. Scopes `ploy:chat`, `ploy:data:read`, `ploy:data:write`, `ploy:site:publish`, `offline_access`. Tool names are not published | P |
| 2 | GET | `/.well-known/mcp/server-card.json`, `/.well-known/mcp.json` | none | MCP server card, version `2026-10-15` | P |
| 3 | GET | `/.well-known/oauth-protected-resource/api/mcp` | none | Resource metadata | P |
| 4 | GET | `/.well-known/oauth-authorization-server/api/auth` | none | Issuer `https://ploy.ai/api/auth` | P |
| 5 | GET, POST | `/api/auth/oauth2/authorize`, `/token`, `/register`, `/introspect`, `/revoke` | per RFC | Authorization code + refresh, PKCE S256, dynamic client registration, DPoP | P |
| 6 | GET | `/api/auth/passkey/generate-authenticate-options` | none | WebAuthn sign-in challenge | O |
| 7 | callback | `/api/auth/sso/callback/sso-<id>` | OIDC | Per-organization SSO | D |
| 8 | GET | `/agent-tools/search?q=` | none | Semantic search over site and docs, top 5 sections | P |
| 9 | GET | `/agent-tools/migration-estimate?url=` | none | Migration cost estimate, 6-second scan budget | P |
| 10 | GET | `/agent-tools/openapi.json`, `/.well-known/api-catalog` | none | OpenAPI 1.1.0 for 8 and 9; RFC 9727 linkset | P |
| 11 | GET | any page with `Accept: text/markdown` | none | Markdown rendition of the page | P |
| 12 | POST | `/api/v1/webhook/{endpointSlug}` | Bearer endpoint key | Inbound webhook. JSON only, 1 MB (128 KB if writing to a table), 60 requests a minute, returns `{"event_id"}` | D |
| 13 | GET | `https://ploydb-do-production.ploy.workers.dev/site/v1/ploydbs/{pdb_id}/tables` | Bearer access key | List tables | D |
| 14 | POST | `.../tables/{tableId}/query` | Bearer access key | Query rows | D |
| 15 | POST, PATCH, DELETE | `.../tables/{tableId}/rows[/{rowId}]` | Bearer access key | Row writes | D |
| 16 | POST | `/_ploy/ingest` (also on docs.ploy.ai) | Origin check | First-party analytics events and forms | O, D |
| 17 | GET | `/geo.json` | none | Visitor geo for personalization | O |
| 18 | script path | `/_p/` | none | Analytics script on hosted sites | D |
| 19 | static path | `/_ploy_static/_astro/*` | none | Site assets | O |
| 20 | site routes | `/ploy-ai/*` | injected `PLOY_AI_KEY` | Site-side calls to the AI Gateway | D |
| 21 | POST | `/ingest/flags`, `us.i.posthog.com/flags/` | none | PostHog through a first-party proxy path | O |
| 22 | POST | `/monitoring` | none | Error-report tunnel on app pages | O |
| 23 | GET | `/careers-api/application-form` | none | Careers form schema | O |
| 24 | GET | `https://ploy.ai/install.sh` | none | CLI installer | D |
| 25 | CLI | `ploy` binary with `PLOY_API_TOKEN=sk_ploy_pat_...` | token | Calls undocumented `ploy.ai` APIs. Command index in the digest, section 14 | D |
| 26 | browser global | `window.ploy.track`, `.identify`, `.consent` | n/a | Custom events. Cookies `ploy_anon_id` (1 year), `ploy_consent` (180 days) | D |

Not available anywhere public: a REST API for sites, chats or publishing; the MCP tool list; outbound webhooks; the analytics server-side endpoint URLs (shown only in-app).

## 6. Technology stack, end to end

| Layer | Finding | Evidence | Conf. |
| --- | --- | --- | --- |
| Edge and CDN | Cloudflare | `server: cloudflare`, `cf-ray`, `__cf_bm` cookie | fact |
| Customer hosting | Cloudflare Workers with Workers static assets; custom hostnames via Cloudflare for SaaS | docs: `cloudflare:workers` import, `_acme-challenge` to `*.dcv.cloudflare.com`, A `207.207.209.209`, CNAME `proxy.runploy.com` | fact |
| Certificates | Google Trust Services through ACME | docs /custom-domains | fact |
| Site framework | Astro 6 + React + TypeScript + Tailwind, islands hydrated with `client:idle` and `client:load` | docs; `astro-island` elements and `/_ploy_static/_astro/` on ploy.ai itself | fact |
| Marketing site | Built on Ploy's own platform | same asset paths and `/_ploy/ingest` as customer sites | fact |
| App shell | React single-page app under `/workspaces`, `/auth` | observed routes | fact |
| App server | Possibly Next.js with a Sentry tunnel | `POST /monitoring` is the Sentry tunnel route convention | inference, low |
| Auth | Better Auth style server: `/api/auth/oauth2/*`, `/api/auth/passkey/*`, `/api/auth/sso/callback/*`; email + password, Google, passkeys, OIDC SSO | endpoint shapes, login form | inference, medium |
| Agent runtime | Per-site sandbox with git and bun; sub-agents for design, code, research, copy | docs /site-builder, /cli | fact |
| Models | OpenAI, Anthropic, ElevenLabs "and other providers" through an AI Gateway exposed as a Vercel AI SDK provider | docs /ai-gateway; blog titles name GPT and Opus | fact |
| Database product | PloyDB on Workers, likely Durable Objects | hostname `ploydb-do-production.ploy.workers.dev` | inference, medium |
| Routing config | Likely Workers KV | fields `kvSynced`, `kvSyncError` in CLI output | inference, medium |
| Product analytics | Own first-party pipeline (`/_ploy/ingest`, `ingest.ploy.ai`) plus PostHog | request log on 72 of 85 pages | fact |
| Ad and tag stack | Google Tag Manager `GTM-PF7R2RX2`, GA4, Google Ads, LinkedIn Insight, X Ads, Snap Pixel | request log, inline tags | fact |
| Visitor identification on ploy.ai | Snitcher | `cdn.snitcher.com` on 66 of 85 pages | fact |
| Webinars | Sequel | `prod-assets.sequelvideo.com` | fact |
| DNS automation, domain sales | Entri, IONOS | docs | fact |
| Source control | Git per site, GitHub App from the `ployspace` org | docs /integrations/code-sync-github | fact |
| CLI | Standalone binary for macOS and Linux, likely Bun-compiled | docs /cli | inference, low |
| Structured data | Organization, WebSite, WebPage, BreadcrumbList, FAQPage, SoftwareApplication, TechArticle | JSON-LD counts in `evidence/ploy-page-capture.json` | fact |
| Agent readiness | `llms.txt`, markdown negotiation, API catalog, MCP card, `Content-Signal` in robots.txt, `Link` response header | captured headers and files | fact |

Raw data: `evidence/ploy-page-capture.json` holds, per page, the status, headings, forms, Astro islands, JSON-LD types, hosts contacted and XHR calls.

## 7. Design system observed

Recorded so Deploy can be laid out comparably and branded differently. Do not reuse the values.

| Token | Ploy value |
| --- | --- |
| Display type | "FK Screamer", 144 px, weight 700, uppercase, condensed |
| Body type | Geist variable, 16 px, weight 400 |
| Text | `#212121` primary, `#555` secondary |
| Surfaces | `#f4f4f4` page, `#fff` cards, `#000` inverse sections |
| Borders | `#e3e3e3`, inputs `#c4c4c4` |
| Primary button | `#212121` fill, white text, full pill radius |
| Secondary button | white fill, `#b3b3b3` border, pill |
| Accent | None. Colour comes from 3D inflated-balloon art (blue, yellow, green, pink) and full-bleed video |
| Token naming | `--ploy-{neutral|accent|text|background|button|border|input}-*`, each ramp 50 to 950 |
| Layout | Floating pill nav, oversized uppercase headline, logo marquee, mock product UI inside feature sections, FAQ at the foot of most pages |
| App chrome (docs site as proxy) | Left nav with icon rows and a dark pill for the active item, top search with a keyboard hint, right "On this page", floating "Ask Ploy" button |

## 8. Screens and tabs captured

129 images in `replica/screens/`, indexed in `replica/SCREENS.md`.

| Group | Pages | Notes |
| --- | --- | --- |
| Core and one-off pages | 22 | home, pricing, about, mcp, cli, faq, contact, demo, calculators, legal |
| Features | 12 | all feature pages |
| Solutions | 8 | all `/for/*` |
| Collections | 30 | index plus two samples each for blog, integrations, ploybooks, vs, customers, agencies, library, webinars, whats-new, careers |
| Auth | 1 | login (sign-up is under extra states) |
| Docs | 12 | home plus the 11 platform pages that describe the app |
| Tab states | 40 | `/mcp` 7, `/agencies` 8, `/for/enterprise` 6, `/for/growth` 6, `/for/marketing` 6, `/for/sales` 4, one library post 3 |
| Extra states | 4 | pricing Monthly, pricing Annual, mobile home, sign-up |

The other 375 URLs are instances of templates already captured (230 blog posts, 64 integrations, 46 Ploybooks and so on). They were listed, not rendered, to stay within reading at human scale.

## 9. Deploy wireframes

Low-fidelity, generated by `wireframes/generate.py`. They follow the information layout found in recon and use none of Ploy's visual identity.

| ID | Screen | File | Ploy counterpart |
| --- | --- | --- | --- |
| D01 | Sign in | `wireframes/D01-sign-in.svg` | S01 |
| D02 | Home: portfolio and "Needs you" | `wireframes/D02-home-portfolio.svg` | S04 |
| D03a | Deploy workspace, Chat | `wireframes/D03a-deploy-chat.svg` | S05 |
| D03b | Deploy workspace, Gallery | `wireframes/D03b-deploy-gallery.svg` | S06 |
| D03c | Deploy workspace, Preview | `wireframes/D03c-deploy-preview.svg` | S07 |
| D04 | Analytics | `wireframes/D04-analytics.svg` | S13, S14 |
| D05 | AI visibility | `wireframes/D05-ai-visibility.svg` | chat-only in Ploy |
| D06 | Monitors | `wireframes/D06-monitors.svg` | none |
| D07 | Playbooks | `wireframes/D07-playbooks.svg` | S11 |
| D08 | SEO | `wireframes/D08-seo.svg` | feature page mock |
| D09 | Settings: sites, budget | `wireframes/D09-settings.svg` | S26 |

## 10. Parity definition

Parity means Deploy does the same job on the in-scope slice, measured by `replica/features.csv` and replica-diff's `parity.py` (must 3, should 2, could 1, partial counts half, skips excluded).

- 99 features listed. 17 skipped with a reason. 4 are Deploy-only additions.
- 78 counted toward parity, 39 of them must-haves.
- Score today: 0 of 100. Ship gates: every must-have done for v1, 85 or higher for "parity reached".

## 11. Open items that need you

| # | Item | Why | What unblocks it |
| --- | --- | --- | --- |
| 1 | Logged-in screenshots, including the gallery view you linked | Needs your session | Run step 1 of `META-PROMPT.md` on your machine, signed in to Ploy in your own browser |
| 2 | MCP tool list | Only visible after OAuth | Connect the Ploy MCP in Claude Code and list tools |
| 3 | Ploy's terms on competitive use of an account | replica-recon requires the check before account-based recon | Read `ploy.ai/terms-of-service` before doing items 1 and 2 |
| 4 | The Deploy domain | I did not verify that `deploy.app` is available or yours | Confirm the domain; the spec uses `deploy.internal` as a placeholder |
| 5 | Final list of sites to monitor | Spec assumes biddeed.ai, dealdeed.app, zonewise, rentaliq | Edit the list in `PRD.md` section 3 |

## 12. File map

```
docs/deploy/
├── README.md                          start here
├── REVERSE-ENGINEERING-REPORT-V7.md   this report (battle card, sitemap, API, stack)
├── PRD.md                             product requirements
├── PRS.md                             product requirements specification: architecture, schema, API, jobs
├── CHECKPOINTS.md                     build checkpoints with exit tests
├── META-PROMPT.md                     the prompt that drives the build
├── replica/                           recon.md, features.csv, SCREENS.md, screens/ (129 images)
├── wireframes/                        11 SVGs + generate.py
└── evidence/                          sitemap, MCP card, OAuth, OpenAPI, page capture, docs digest, capture scripts
```
