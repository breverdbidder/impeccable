# Ploy (ploy.ai) public docs recon digest

Source material (all read from disk, nothing fetched): `d_docs.ploy.ai_llms-full.txt` (550 KB, 10,492 lines, 73 pages, read in full), `d_docs.ploy.ai_llms.txt` (docs index), `f_llms.txt` (marketing index). A few small machine-readable files in the same recon directory were consulted where the docs are silent and are always labelled as such (`f_.well-known_mcp.json`, OAuth metadata, `f_agent-tools_openapi.json`, `f_ws.hdr`).

Conventions: quoted strings are verbatim from the docs; **bold** terms are UI labels as the docs print them; `/slug` means `docs.ploy.ai/slug`. "Not documented" means the public docs do not state it. Items marked "inference" are deductions from names or hostnames, not statements by Ploy. Within each section, notes are grouped by source page.

Contents: 1 Core concepts · 2 App IA · 3 Agent · 4 Site builder · 5 Publishing and hosting · 6 Analytics · 7 AI search visibility · 8 Audience · 9 Database and CMS · 10 Ploybooks and Projects · 11 Integrations · 12 AI Gateway · 13 MCP server · 14 CLI · 15 HTTP APIs, webhooks, env vars · 16 Team, roles, security · 17 Plans, credits, limits · 18 Tech-stack evidence · 19 Gaps and known issues · 20 Docs page list


---

## 1. Core concepts and object hierarchy

### Two layers: organization vs workspace (docs.ploy.ai/working-with-a-team, /agencies)
- **Organization**: "holds people, roles, plan, and billing"; contains one or more workspaces. A person joins with an Owner, Admin, or Member role. Billing lives at the organization level ("a separate bill means a separate org").
- **Parent organization with child organizations**: for agencies; "typically one child org per client. Entitlements inherit from the parent, so plan features flow down to each client org while billing stays separate." (/agencies)
- **Workspace**: "Your team's home base in Ploy. Contains your sites, documents, assets, brand design system, and integrations. Everything lives here." Also holds databases, brand context, chats, projects, Ploybooks. Workspace settings fields: workspace name, company website (site URL), company summary (up to 500 characters; "Ploy's Agent reads it in every chat"), logo, favicon. A workspace has a timezone (used by check-ins and reminders). A workspace can be **transferred** to another organization (workspace details/settings -> **Transfer**; must be admin of destination org).
- Access is organization-wide by default; optional "workspace-level access" (per-account flag, on request via sales@ploy.ai) lets a Member be limited to specific workspaces.

### Glossary (docs.ploy.ai/core-concepts, verbatim definitions)
| Term | Definition |
|---|---|
| Workspace | "Your team's home base in Ploy. Contains your sites, documents, assets, brand design system, and integrations." |
| Site | "A website project inside your workspace. Each site has its own pages, components, and version history. You can have multiple sites in one workspace." |
| Chat | "A conversation where you work with Ploy's Agent to get things done... Each chat focuses on one goal." Each chat "has its own thread, plan, and artifacts (pages, documents, images, charts)". |
| Project | "A home for one goal: a dashboard, a task plan, linked chats and Ploybooks, and a daily check-in. Ploy's Agent sets it up and keeps it current." |
| Ploybook | "A reusable, step-by-step workflow Ploy's Agent can follow - written once, run on demand or on a recurring schedule." Plain markdown: "phases, steps, and instructions". |
| Ploy's Agent | "Your AI assistant. It lives in the Ploy dashboard and can build pages, write content, design layouts, run SEO research, analyze analytics, generate images, and more." |
| Agent | "AI workers that Ploy's Agent coordinates behind the scenes... dispatches specialized agents to handle different parts in parallel - design, code, research, copywriting." |
| Deploy | "A published snapshot of your site. Every time you publish, Ploy creates a new deploy. To go back to an earlier version, restore it from Versions and publish again." |
| Design System | "Your brand's visual DNA - colors, fonts, spacing, border radius, and other tokens. Stored in your workspace and automatically applied to every page and component." |
| Brand | "The combination of your design system, logo, and company information. Ploy can extract your brand from an existing website or Figma file, or you can configure it manually." |
| Assets | "Images, logos, and files stored in your workspace. Includes user uploads, AI-generated images, Figma exports, and website screenshots." |
| Documents | "Markdown files in your workspace for research, plans, briefs, and content drafts... Find them under Library, then Docs." |
| Preview | "A live, hot-reloading view of your site in the dashboard. Shows changes in real time as Ploy's Agent works." |
| Publish | "Push your site live. Deploys to Ploy's hosting infrastructure with automatic SSL." |
| Custom Domain | "Your own domain ... pointed at your Ploy-hosted site. Ploy handles DNS verification and SSL certificate provisioning automatically." |
| Integrations | "Connections to external tools - GitHub, Figma, Google Analytics, Google Search Console, Notion, Slack, HubSpot, and others. Open Integrations from the workspace sidebar." |

Hierarchy diagram from /core-concepts:
```
Workspace
├── Brand & Design System
├── Sites
│   ├── Pages & Components
│   ├── Versions (restore and republish)
│   └── Custom Domain
├── Documents (research, plans, drafts)
├── Assets (images, logos, files)
├── Integrations (GitHub, Figma, GA4, etc.)
├── Chats (conversations with Ploy's Agent)
├── Projects (goal, dashboard, tasks, daily check-in)
└── Ploybooks (reusable workflows - manual, scheduled, or webhook-triggered)
```
- Terminology note: the task brief mentions "a Ploy" as an object. In these docs the unit of work is called a **chat** (older name appears only in the URL slug `/ploy-chat` and in "create one from a Ploy conversation" in the docs index line for Ploybooks). See section 2 for what the docs say about per-chat views.

### Additional objects surfaced elsewhere in the docs
| Object | Definition / evidence | Source |
|---|---|---|
| Ploy (noun) | Internal/legacy name for an agent chat: UI button "Chat in a Ploy", CLI "Start a Ploy", app route `/workspaces/{uuid}/ploys/{uuid}` | /database, /cli/workspaces-sites, recon/f_ws |
| Agent profile | **Ploy Agent** (general) or **Ploy Lite** (focused) | /ploy-chat, /ploy-lite |
| Turn / question | A chat has turns (`--steer <turn-id>`) and pending questions (choice, decision, boolean, free text) | /cli/chats |
| Version | Auto-saved snapshot of site code (every 3 seconds); restorable in editor | /tips-and-tricks, /publishing |
| Target / environment | **Production** and **Preview** (CLI name `staging`); each with its own Variables/Secrets | /publishing, /environment-variables |
| Page / Section / Component | Astro route / React block / UI primitive | /site-builder |
| Private page / draft | Page under `/private`, or DB-record page with publish flag off | /site-builder, /cms |
| Voice and copy rules | Per-site copy record next to the design system; workspace brand guidelines override | /site-builder |
| Database / Table / Column / Record / Access key | PloyDB model (`pdb_`, `tbl_`, `fld_`, `row_` ids) | /database |
| Document | Markdown file with path, title, tags, folders | /documents, /cli/documents-ploybooks |
| Report | Workspace report emailed by Ploy, stored in Docs | /documents |
| Asset | File in Library Assets | /assets |
| Project memory / Ploybook working memory | Documents carrying decisions across chats/runs | /projects, /ploybooks |
| Schedule | Cron + IANA timezone + start/end + enabled flag attached to a Ploybook | /ploybooks, /cli/documents-ploybooks |
| Webhook endpoint / event | Workspace-scoped inbound URL with key; stored events | /webhooks |
| Domain / domain family | Hostname connected to a site; apex + subdomains = one family for plan limits | /custom-domains |
| Routing document | `{ rules[], defaultFallback }` per default domain | /cli/workspaces-sites, /routing-rules |
| Experiment | Champion vs challenger for one page section | /experiments |
| Dashboard / card / shared definition | Per-site (and per-project) analytics dashboard | /analytics |
| Integration connection | Workspace or personal OAuth connection with optional write access | /integrations |
| Credits | AI credits, visitor enrichment credits, contact credits; org-level | /credits |
| API token | `sk_ploy_pat_...`, workspace-pinned | /cli/authentication |
| Recommendation / Needs input card | Items in **For you** | /quick-start, /projects |

---

## 2. Logged-in app information architecture

### Onboarding / workspace setup wizard (docs.ploy.ai/quick-start)
Sequence of full-screen questions, each with **Continue** and **Back** (on phone they stay pinned at the bottom):
1. **Is this your website?** (confirm) / **What's your website?** (enter) / option "I don't have a website yet". Optional field "Tell me a little about your business".
2. **What I learned about your company** screen: "My read of your business, in three highlighted lines about who you sell to, why they pick you, and why they stay, followed by the gaps it found." Buttons **Edit** -> **Done**, **Continue**.
3. Recommendations screen: first card **Let Ploy automate your website growth** (not preselected); per-gap recommendations with where the gap was found; "Here's what else I can do". Fallback states: if no tailored recs possible "it says so and shows the usual starting points"; if site is not a business, step skipped.
4. **What do you want help with?** goals (multi-select): Migrate my site to Ploy; Organic traffic (preselected); Conversion rate optimization; Improve brand positioning; Ad campaigns; Find more qualified leads; **Something else** (free text). "Migrate my site to Ploy" and "Improve brand positioning" only appear when a website was entered.
5. **What's the vision for your site?**: Create a new design / Enhance my current design / Keep my design as is.
6. **How do you want to start your design?**: **Upload a design** (HTML file or .zip, <= 10 MB) / **Design from scratch**.
- **Skip setup** shown for workspace creators who have used Ploy before.
- Out-of-credits state: dialog **Setup needs AI credits**; answers saved; resumes after checkout.
- Abandoned setup: Overview shows link **Finish setting up your workspace** or **Resume workspace setup**.
- Welcome tour (3 steps): "We started a few chats for you"; "Connect tools you already use"; "While you wait, here's what else Ploy can do" -> **Go to your chats**. Replay via **Help & support** -> **Getting started** under Resources.

### Overview (workspace home) (docs.ploy.ai/quick-start)
- Sidebar item **Overview**. Prompt box titled **What should we work on?** plus suggested prompts ("Sending a suggested prompt starts work"). Agent-profile picker in composer. Ploybooks browsable from Overview (see /ploybooks#find-a-ploybook-from-overview).
- **For you** feed: recommendations and work awaiting response. Filter chips for categories; **Filter** with **Needs** and **Channel**. Card types: **Needs input** (with **Dismiss**, **Undo**; hidden across devices) and **Recommendation**. Card actions: **Open**, **Chat**, **View**. Inside a chat a question card has **Close** -> chat shows "Question dismissed".

### Sidebar items named so far
- **Overview**, **Your chats** (list of chats; goal chats appear here), **Chats** list (participant avatars), **Projects**, **Ploybooks** ("section in the left sidebar"), **Integrations** ("workspace sidebar"), **Library** (-> **Docs**, **Assets**), bell (notifications/invitations), **Help & support**, **Settings**. Organization menu -> **People**.

### Chat screen (docs.ploy.ai/ploy-chat, /working-with-a-team)
- **New chat** button. Composer (message box) contains: plus menu (**Upload files**), site picker (site name in blue next to the plus button; "Choose site" when none; searchable; option **No specific site**; hidden with only one site), agent-profile picker (click the agent name: **Ploy Agent** / **Ploy Lite**), microphone button (dictation), Send, **Stop**.
- Suggested requests shown above the message box on first chat.
- **Queued** area above message box (Ctrl/Cmd+Enter queues; Enter injects into current reply). Queued messages cannot be edited/reordered; other teammates' messages queue under their name.
- Sender name + avatar beside each message; participant avatars on **Chats** list.
- Per-reply feedback: **Good response** / **Bad response**, optional **Tell us more**.
- "pages, documents, images, and databases open in the workspace viewer" (the artifact/viewer pane next to chat).
- Dictation: hold Right Option (Mac) / Right Ctrl; double-tap to latch; Escape discards; auto-stops after ~15 s silence; error state "Microphone access is blocked".
- Paste > 4,000 chars becomes attachment `pasted-text.txt`.
- Attachments up to 10 MB each: images (HEIC -> JPEG), PDF, fonts, CSV, JSON, Markdown/text/code, HTML, XML, ZIP, MP4/MOV/WebM, MP3, GLB, RIV, KTX2.
- Error states: "Failed JSON" = session expired, refresh (/tips-and-tricks). Agent may silently stop; reply "continue".

### Projects (docs.ploy.ai/projects)
- Sidebar **Projects** -> list with rows (⋯ menu -> **Delete project**), **New Project** button, **Suggested Projects** cards: **Improve visibility in search**, **Get recommended in AI answers**, **Turn more visitors into customers** (dismiss with **X**; used card hidden per browser).
- Project page: goal at top (**Outcome**), then **For you** row, then tabs **Work**, **Dashboard**, **Plan**, **Chats**, **Outputs**, **Context**. Opens on last-used tab per browser; first visit **Work**; deep links to a tab exist (URL form not documented).
  - **Work**: log grouped by day (**Today**), **Up next** (next scheduled check-in) at top; first entry **Project created**; tab icon animates while working.
  - **Dashboard**: tiles (charts); empty chart state **No data yet**; **See all** expands a tile.
  - **Plan**: task board (kanban); card opens brief, steps, outputs; **Run**.
  - **Chats**, **Outputs**.
  - **Context**: memory, linked Ploybooks, daily check-in; **Run now**; **Edit the check-in in chat**.
  - Menu next to project name: **Edit Project**, **Delete project** -> **Delete**. Click name to rename.
  - Recommendation cards may carry **Draft** tag + **Review** button; brief lists "Drafted for you"; **Review and publish**.
  - **Run History** lists check-in chats.

### People / org screens (docs.ploy.ai/working-with-a-team, /agencies)
- Organization menu -> **People**: **Invite** (email, role), member menu **Promote to Admin** or (with workspace-level access) **Edit permissions** dialog: **Role**, **Member can access**: **All workspaces** / **Only these workspaces**, **Load more**, **Save changes**. **Access Requests** list with **Approve** / **Decline**.
- Organization settings -> **Members** (agencies page naming); **Membership** setting "Anyone with an @yourdomain email can join".
- Signup join screen: **Join**, **Request access**, **Continue without joining**.
- **Settings** -> **Workspace** -> **General**: name, company website, company summary, logo, favicon; **Danger Zone** delete (type workspace name). Blocking messages: "This workspace can't be deleted" (**Open billing settings**), "This workspace has purchases or saved auto-reload settings and cannot be deleted", "Disconnect your domains first".
- **Settings** -> **Organization** -> **Usage** (credit balance) (/tips-and-tricks).

### Site-level screens (docs.ploy.ai/site-builder, /analytics)
- Editor/preview pane: preview toolbar with **Publish**, **Versions** (phone: ⋯ -> **Version history**), desktop/mobile toggle, screenshot.
- **Pages** panel (page list with status dots, **More actions**, right-click menu).
- Site **Overview** (has a **Bots** card: AI crawlers vs Agent visits; **Top Sources**).
- Site **Dashboard** page (**Create** / **Edit dashboard**; cards, text notes with pencil button, sections, tabs; card settings **Resize**, **Height**: Auto height / Short / Medium / Tall / Extra tall; drag handle; controls above cards; **Save for everyone**, **Reset**, **Refresh** with "Updated 3 of 25"; "Showing the first 1,000 rows"; filter state kept in the page address/URL query).
- Site **Visitors** tab (**Enrichment settings**).
- Site menu -> **Settings** -> **Analytics**: **Sources** list (hosted site row with **Manage** -> **Settings** tab toggle **Collect analytics on this site**, status **Off**, **Retry**; **Debug** live event view; **External sites** -> **Set up**; **Server-side events** -> **Set up** / **Instructions**); destinations with **Add**, **Filter events**, statuses **Active**, **Active · nothing routed**, **Inactive**.
- Workspace **Settings** -> **Enrichments** (Disabled toggle). **Workspace Settings** -> **Developer** (Code Sync).
- **Integrations** page: searchable cards with **Connect**; Google Analytics card property picker ("Select a property to get started", **Retry setup**); Search Console site picker.
- **Library** -> **Assets** (categories, **Upload**, preview, **Details**, **Copy link**).
- Chat inline cards: design-system build progress (step + elapsed time, expandable), **Compare original and draft** card, database card (import status/partial/failed), secure credential form, saved chart/table with date-range and filter controls.

### Publish panel and site screens (docs.ploy.ai/publishing)
- **Publish** button -> Publish panel (targets Production / Preview tiles, status line, QR code button, gear menu: **Domains**, site details, automatic publishing, **Unpublish**). Failure states **Publishing paused**, **Publish failed** (**Fix**, **Publish again**, **Show details**, **Full output**, **Publish anyway**, **Manage credits**), **Sandbox out of storage**. Publish status card in chat (per-target state, gear -> Advanced).
- **Sites** list -> site -> **Domains** page (**Add domain** -> **Set it up with Ploy** / **Set it up yourself**; domain row -> **Path routing**).
- Site dashboard -> **Advanced** (**Automatic publishing**: **Preview only** / **Preview + Production**).
- Site sidebar with site preview image -> **View live site**.

### Databases screens (docs.ploy.ai/database, /cms)
- Sidebar **Databases** -> database -> table. Views: **Table** (grid), **Kanban**, **Diagram** (via **Add view**). **Record panel**. **Add property**. **Import CSV**. Table view menu -> **Export current view CSV**. **Manage access**. **Chat in a Ploy**. Record actions **Chat about this**, **Run**, **Related work**. **Mark as secret**. Restore points / rollback UI (labels not given). URL contains `pdb_...` id.
- **Pages** / "Pages Manager": expandable dynamic routes listing records with search + pagination; **Placeholder** label; record **More actions** -> **Hide from published site** / **Include in published site**.

### Usage / billing screens
- Usage screen with **Website AI** section and **Edit limit** (/ai-gateway). **Billing settings -> Plan** (/contact-tools). **Account -> Notifications** (/audience).

### Library -> Docs (docs.ploy.ai/documents)
- **Library** -> **Docs**: **New Doc**; search by title or content; filter by tag or date updated; type filter **Reports** ("the workspace reports Ploy emails you"; open a report to read or start a chat about it); folders shown above documents; breadcrumb path e.g. "Knowledge Base › Acme › Acme overview"; documents can be read, edited, renamed, exported as Markdown. `@` mention a document in chat for context.

### Site Settings -> Environment (docs.ploy.ai/environment-variables)
- Site -> **Settings -> Environment**: tabs **Preview** and **Production**; **Add** menu/dialog with **Name**, **Tier** (Variable / Secret), **Value**; pasting a whole `.env` into **Name** triggers bulk import + manual review (each line defaults to **Secret**). Chat alternative: secure form in conversation.

### Experiments (docs.ploy.ai/experiments) — gated per workspace
- Site navigation item **Experiments** -> **Create an experiment** dialog: **Experiment name**, **Page URL**, **Section key**, **Hypothesis**, **Goal**, **Guardrail (optional)** -> **Create and edit challenger** (opens a Ploy chat). Controls: **Traffic split** (10%-90%), **Start experiment**, **Pause**, **Resume**, **Delete draft**, **Choose champion** -> dialog **Choose the next section champion** with **Check before you promote**; reminder **Publish the site to Production afterwards**. Notice **Publish before starting an experiment**. Warning **Guardrail at risk: <event>**. Upgrade window **Upgrade for more than N experiment(s) at a time**.
- Statuses: Not started, Publish required, Needs proof, Gathering visitors, Completed, Archived, Needs manual repair.

### Form submissions (docs.ploy.ai/form-submissions)
- **Sites** -> site -> **Dashboard** -> **Submissions** tab "in the left sidebar" -> **Notifications** (upper-right) to add notification emails (per site).

### Ploybooks screens (docs.ploy.ai/ploybooks)
- **Overview** -> **Ploybooks**: tabs **Suggested** and **Scheduled**; card preview; **Open Ploybook**, **Run Ploybook**.
- **Library** -> **Ploybooks**: saved Ploybooks; **Explore library** (category tabs such as **SEO**, **Content**, **Conversion**, **All**; tabs hide while searching); template actions **Run**, **Customize**, **Share** (copies link; opens in recipient's own workspace).
- Ploybook page: **Schedule a Ploybook** / **Add Schedule** dialog: **When should this run?** (plain-language cadence + timing preview), **Timezone**, **Starts (optional)**, **Ends (optional)**, **Enable schedule**, AI credit notice, **Save**; schedule list. **Run History** (/projects).

### Visitors (docs.ploy.ai/visitor-identification)
- Site **Visitors** tab: identified visitors (Name, Company, Job title, LinkedIn, Visit count, Pages viewed); **Enrichment settings**; warning with **Increase limit** -> **Settings -> Enrichments**.

### Developer settings and Deploys (docs.ploy.ai/cli/authentication, /cli/workspaces-sites)
- Workspace **Settings -> Developer -> API tokens** (create token with 30/90/365-day expiry; raw token shown once with copyable `export PLOY_API_TOKEN=…` line; owners/admins see and revoke all). **Developer** also hosts Ploy Code Sync connection.
- Site dashboard -> **Deploys**: list of deployments; open a failed deployment to view its full build log.
- Device login approval page with **Authorize CLI** button.
- **Database options -> Access keys -> Create access key** (naming used in /cli/workspace-transfers; /database calls the entry point **Manage access**).
- Terminology evidence: CLI help text says "Start a Ploy with an initial request" and "follow the prompted Ploy until its turn completes" => "a Ploy" is the product's internal noun for an agent chat/thread.

### Billing / usage / notifications screens (docs.ploy.ai/credits, /notifications)
- **Settings -> Organization -> Usage**: Credits bar; rows AI credits (reset date), Extra credits, Lifetime credits (Free), Contact credits, Visitor enrichment, **Website AI** (**Edit limit**); **Credit usage** analytics (date range picker, **Filter by user**, **Group usage by** Chat/User/Usage type, **Cumulative**/**Per day**, **What used your credits** paged list).
- Workspace switcher: shows credit usage meter (click -> full usage), **Upgrade** / **Fix billing** label, "Earn 1,500 credits" referral entry.
- **Settings -> Billing**: plan card (**Manage** / **View invoices**), plan picker with **Monthly** / **Annual**, credit picker (tiers; **Talk with Sales**), **Switch to annual billing** / **Switch to monthly billing**, pending change **Undo**, **Downgrade to Free?** dialog, **Auto-reload** (**Turn on**, **Save changes**, **Turn off**, **Paused**, **Resume**).
- Account settings: **My Credits** (referral balance), **Notifications**. Gift icon at bottom of navigation (referral). Bell at bottom of sidebar.
- **Upgrade to continue** dialog; out-of-credits notice above chat box.
- Workspace **Settings -> Notifications** (Reports and recommendations; Accept email triggers).
- **Integrations** page tabs: catalog and **MCP** tab (Ploy MCP server URL, **Manage connected clients**, **Add MCP server**).

### Settings screens (docs.ploy.ai/webhooks, /enhanced-security/*, /integrations/code-sync-github)
- **Workspace Settings -> Webhooks** (URL `https://ploy.ai/workspaces/{workspace-uuid}/settings/webhooks`): endpoint list, **Create webhook**, endpoint page (**Rotate key**, **Trigger ploybook**, PloyDB destination, enable/disable, delete), **Events** tab.
- **Workspace Settings -> Developer**: **API tokens**; **Ploy Code Sync** row (**Connect** / **Connected** -> **Disconnect**).
- **Site Settings -> Developer**: **Sync from GitHub**; **Source Control - Collaborators**.
- Account: avatar at bottom of left sidebar -> **Settings** -> **Security** (**Passkeys**: **Add a passkey**, pencil, trash).
- **Organization -> Security** (enhanced sign-in, **Deadline**); **Settings -> Organization -> Audit log** (filters; **Export CSV**).
- Login page: email/password form, **Log in with a passkey**, Google sign-in, **Having trouble signing in?**.

### Domains, SSO, Slack screens (docs.ploy.ai/custom-domains, /security/sso, /slack)
- Site menu -> **Domains** page and domain detail page (see section 5 for labels); **Ploy address** section.
- **Organization settings -> Security**: SSO provider form (**Email domain**, **Check DNS**, **OIDC issuer**, **Client ID**, **Client secret**, **Token endpoint authentication**, advanced overrides, **Save Provider**, **Verify domain**, **Require SSO**) or **Talk to sales to enable SSO**.
- Login `https://ploy.ai/auth/login` with **Continue with SSO**.
- **Account settings -> Slack** (`https://ploy.ai/account/slack`).
- Known app URL fragments overall: `ploy.ai/auth/login`, `ploy.ai/account/slack`, `ploy.ai/workspaces/{uuid}/settings/webhooks`, `ploy.ai/r/<CODE>`, database URL containing `pdb_...`, API `ploy.ai/api/mcp`, `ploy.ai/api/v1/webhook/{slug}`, `ploy.ai/api/auth/sso/callback/...`.

### Path routing editor (docs.ploy.ai/routing-rules)
- On each domain's page. Rows = paths, checked top to bottom, first match wins; last row **Everything else** (named **All pages** until a path is added).
- **Add path** dialog: path; match **This page and every page under it** / **Only this page** / **Custom pattern (regex)** (with **Try a path**; redirect targets can use `$1`, `$2`); **Destination**: a Ploy site (this site or another site in the workspace) / **Another URL** (proxy) / **Another URL** + **Redirect instead** (default permanent 301; type under **More options**); **More options**: **Keep the original domain in the Host header**, **Add Ploy analytics to pages from this URL**; **Save** -> toast "Routing saved. Changes usually take effect within 60 seconds." with **Undo**.
- Row affordances: drag, **Move up** / **Move down**, badge such as **Keeps host header**, unreachable-path warning.
- ⋯ menu next to **Add path**: **History** (restore earlier version, shows diff), **Test a URL**, **Edit as JSON** -> **Review changes** -> **Apply changes**. **Retry edge sync** when save succeeded but edge sync failed.
- Agent-prepared proposal card in chat: **Review changes** -> **Apply changes** (stale-proposal notice if paths changed).

### Help & support, misc (docs.ploy.ai/faq)
- **Help & support** panel titled **How can we help?**: **Private support**, **Ask the community** (public Ploy Slack community), **Find answers faster in our docs**, **Getting started** (replay tour). Status page `status.ploy.ai`.
- Preview connection states: "You're offline" (auto-reconnect); "We're having trouble connecting to your preview" with **Reconnect**.
- Site settings -> **Delete Site** (permanent; removes all deploys and content). No self-serve account deletion.
- Sign-up state: email already has an account -> **Log in**.

### A Ploy's views: "gallery" and other `view=` modes
- **docs.ploy.ai does not document any `view=` parameter or a "gallery" view.** Full-text search of the 550 KB docs dump finds "gallery" only inside a Microsoft Entra link ("non-gallery applications") and no `view=` query string. The docs call the object a "chat"; "Ploy" as a noun survives in a few places ("Chat in a Ploy" button on a database, "edit the challenger in a Ploy chat", CLI help "Start a Ploy", "It does not start a Ploy").
- The only on-disk evidence of the route is outside the docs: the captured redirect in `recon/f_ws.hdr` / `recon/f_ws` shows the app URL shape `/workspaces/{workspace-uuid}/ploys/{ploy-uuid}?view=gallery`, which unauthenticated requests 307-redirect to `/auth/login?reason=logged_out&return_to=...`. So: route segment `ploys`, query `view=gallery` exists; what the gallery contains, and which other `view=` values exist (chat / preview / code etc.), is **not documented**.
- What the docs do say about what sits beside a chat (candidate contents of such views): "Each chat has its own thread, plan, and artifacts (pages, documents, images, charts)" (/core-concepts); "pages, documents, images, and databases open in the workspace viewer" (/quick-start); the live preview with desktop/mobile toggle, **Versions**, **Publish**, **Pages** panel (/site-builder); `ploy chat get <chat-id>` "shows the chat and its dashboard link" (/cli/chats); project page tabs **Outputs** and **Chats** (/projects); record **Related work** "chats and artifacts" (/database); MCP read scope covers "conversations, and artifacts" (/mcp).
- A code view/editor inside the app is implied but not described: "restores your site's code to that point in the editor", "resolve them in the editor" (Code Sync conflicts), "site editor". No file-tree or code-editor UI labels are given.

---

## 3. The in-app Agent

### Capabilities (docs.ploy.ai/ploy-chat, /core-concepts)
- Capability table: Build pages; Design & style; Write copy; Research; Analytics; Images (generate, remove background, find brand assets); Integrations; Publish ("Publish the site", "Set up a custom domain", "Did my last publish succeed?"); Workspace settings (name, site URL, logo, favicon, company summary).
- "Publishing, domain changes, and workspace settings changes through Ploy's Agent need the Owner or Admin role."
- Also: "Ship and route traffic - publish deploys, attach custom domains, configure routing rules and fallback proxies"; "Operate integrations - pull from Notion, sync GitHub, push to HubSpot, run Attio actions".
- Research includes "checks on how AI answers from ChatGPT, Gemini, Claude, Perplexity, and Google mention your business".
- Sub-agents: "dispatches specialized agents to handle different parts in parallel - design, code, research, copywriting". Helpers "can report what it found while it keeps working".
- Background jobs survive **Stop**: "image or video generation or a design system build".

### Profiles / modes (docs.ploy.ai/ploy-chat#choose-an-agent-profile, /tips-and-tricks)
- **Ploy Agent**: "the general choice" and "for especially demanding work".
- **Ploy Lite**: "suits smaller edits and analyses"; "small edits, such as a wording change or a spacing fix".
- Switchable at any point between messages; "the conversation carries over"; not while replying.

### Chat mechanics
- One chat = one site ("The first site you open in a chat becomes that chat's site"); everyone in chat shares the site.
- Multi-user: "Ploy's Agent answers one person at a time. Each reply works with the role and connected accounts of the person who sent the message."
- Mid-reply steering: **Enter** injects message read "at its next step"; **Ctrl+Enter / Cmd+Enter** queues.
- Scheduled check-backs/reminders in same chat: workspace timezone; "A repeating check with no end date stops after 7 days"; each uses AI credits.
- Interactive question cards ("pick from the focused options Ploy presents"); mockup pickers (e.g., "paints three different full-page homepage designs", "three hero mockups", "three ad creatives").
- First-publish behavior: agent auto-publishes first built page once to ploy.build Production and Preview addresses "even with automatic publishing off" (except migrations).
- Agent can show a card to create a separate workspace (**Create workspace**); "never creates a workspace without your click".
- Emphasis convention: CAPITAL LETTERS treated as more important (/tips-and-tricks #13).
- Dictation "does not use AI credits" but unavailable when out of credits.
- Agent cannot listen to MP3 audio.

### Ploy Lite (docs.ploy.ai/ploy-lite)
- "Choose Ploy Lite when the request is small, specific, and easy to verify": validate a question, draft a response, make a small adjustment. Rule: "if you can describe the change in one clear sentence and it affects a small part of the work".
- Delegation: user can ask for Ploy Lite or Ploy Agent for delegated work; "Ploy's Agent may also hand investigation that is mostly reading and looking things up to Ploy Lite on its own. Hard questions and judgment calls stay with Ploy's Agent. So does research for a page it is building."
- "If Ploy Lite cannot do part of a task, it asks you to make this switch."
- Underlying model names for either profile: not documented in docs.ploy.ai (marketing blog titles mention "Migrating a production AI agent to GPT-5.6" and "AI Web Design with Opus and Sol"; ploy.ai/llms.txt).
- Some library Ploybooks pin the profile: Website health and usability audit "always runs on Ploy Agent".

### Other agent behaviors
- Secure forms: for secrets/credentials "Ploy surfaces a secure form right in the conversation... The secret is never seen by Ploy's Agent, Ploy's team, or stored in chat history." (/environment-variables)
- `@` mention documents for context (/documents).
- Secret DB columns hidden from the agent (/database).
- Agent can run Lighthouse audits ("Ask Ploy's Agent to run a Lighthouse audit") (/publishing).
- Agent reads form submissions over a date range and classifies them (/form-submissions).
- Agent often offers to save finished work as a Ploybook (/ploybooks).

### Artifacts, tools, costs (cross-page synthesis)
- Artifacts named in docs: pages, documents (Markdown in Docs), images, charts/dashboards, databases; cards in chat: question cards, design mockup pickers, **Compare original and draft**, design-system build progress, database/import card, publish status card, routing proposal card (**Review changes** / **Apply changes**), domain setup card, integration cards (**Connect** / **Reconnect** / **Choose account** / **Allow Writes**), secure credential form, create-workspace card, saved chart/table.
- Agent "tools" as described (no internal tool names are published): site code editing in a per-site sandbox (git, bun), preview/screenshots, publish, domains and routing, PloyDB CRUD and CMS import, documents, assets + image/video generation + background removal, analytics queries (Ploy analytics, GA4, GSC), visitor identification queries, Contact Tools lookups, AI-answer checks (ChatGPT search, Gemini, Claude, Perplexity, Google AI Overviews, AI Mode), Lighthouse, link checking, integrations (OAuth + custom MCP tools), scripts calling the AI Gateway, Ploybook create/run/schedule, reminders/check-backs, webhooks, workspace settings, projects/memory, multi-language site generation (/faq), custom code ("can write and modify React components, Tailwind styles, and Astro pages").
- Models: profile names only (**Ploy Agent**, **Ploy Lite**; CLI `--agent ploy|lite`); underlying LLMs not documented in docs. AI Gateway exposes OpenAI, Anthropic, ElevenLabs "and other providers"; example id `openai/gpt-6-luna-fast`.
- Credit costs: no per-action price list. Stated principles: AI credits meter everything the agent "builds, writes, plans, or generates"; longer chats cost more; "Larger builds use more"; each scheduled run, reminder check, project check-in, AI-answer check uses credits; direct text edits and dictation are free; big batch jobs get a sample + cost estimate first.
- Other channels to the same agent: Slack (DMs/threads), email replies and workspace email trigger address, CLI `ploy chat`, MCP (`ploy:chat`), webhook-triggered Ploybooks.

---

## 4. Site builder and design system

### Stack and code layout (docs.ploy.ai/site-builder, /introduction)
- "Every Ploy site runs on a modern web stack: **Astro**, **React**, **TypeScript**, and **Tailwind CSS**."
- Page = "A route on your site... Each page is an Astro file that composes sections together." Section = "A reusable block of content: hero, features grid, testimonials, pricing table, FAQ, footer, etc. Sections are React components with props for customization." Component = "Smaller UI building blocks used inside sections: buttons, cards, badges, inputs. Pulled from a shared component library."
- Layout shown: `src/pages/*.astro`, `src/sections/*.tsx` (Hero, Features, Testimonials, Pricing), `src/components/*.tsx` (Button, Card, Badge).
- Static HTML can be served from Astro `publicDir`; any client-side script works (Three.js cited); public Git repos (GitHub, GitLab, Bitbucket) can be pulled in as a `git submodule` "because it is available in the same sandbox" (so each site has a sandbox with a git checkout).
- "We do not recommend bringing in an outside repo built with an arbitrary framework." Compatible local Astro repos: see /cli/bring-your-own-repo.
- Site search: "We strongly recommend Pagefind" (static index generated during production builds, runs in browser).

### Design system (docs.ploy.ai/site-builder)
- Tokens: **Colors** (primary, secondary, accent, neutral, semantic; light and dark mode), **Typography** (heading/body families, weights, type scale `xs` to `9xl`), **Spacing**, **Border Radius** (buttons, cards, inputs, global defaults), **Shadows** (shadow color, elevation).
- "The design system is defined in your workspace and compiled into CSS custom properties (Tailwind theme tokens)."
- Update paths: from chat; from Figma ("Connect a Figma file and Ploy's Agent will extract your brand tokens automatically"); from a website URL (new site: builds; existing: "extends it instead of replacing it").
- Build-from-website is a background job: chat shows "current step and elapsed time", expandable step list; failure keeps the build open and "marks the step where it ended"; non-retryable -> agent offers fresh build; "If your site blocks automated visits, the build stops right away"; fresh build reuses unfinished build's files.
- On finish the agent asks once "whether new pages should follow your current site's matching live pages or the design system's layouts" and remembers per site.
- **Voice and copy rules**: per-site record "of how its copy reads, next to its design system" (voice, terms, button labels, words to avoid); "Your workspace brand guidelines win over older rules".
- Onboarding design flows (/quick-start): Design from scratch -> agent "paints three different full-page homepage designs", user picks, agent "repaints only the design you picked", then builds homepage + design system (+ navigation and footer when no website). Enhance -> captures "design foundations", asks 3 questions, keeps brand colors.

### Pages, drafts, privacy (docs.ploy.ai/site-builder)
- **Private pages** "live under /private. You can open them in the preview, but they are never published." Not password protected.
- **Review copy** of an existing page; **Compare original and draft** card in chat with modes **Side by side** and **Wipe**; highlights Red (removed), Green (added), Yellow (rewritten); toggle **Highlight changes**; **Scroll Sync**; per-side change counts. Compares current states only, not history.
- **Pages** panel: per-row status dot — Amber **Edited**, Blue **New**, Muted **Hidden**; header summary e.g. "3 pages with unpublished changes", or "Unpublished site-wide changes", or "Publish to start tracking changes". Row context menu / **More actions** -> **Hide from published site** / **Include in published site**. Dynamic routes and error pages can't be hidden. Hide semantics: content page leaves at next publish; database-record page leaves immediately; other pages move under /private.

### Preview and editing (docs.ploy.ai/site-builder)
- Live preview: desktop and mobile views; click-through navigation (off-site links blocked with explanation); screenshots; opens on the page last created/edited in that chat; deep link to a specific page.
- **Edit Text Directly in Preview**: click text to edit inline; "Direct text edits do not use AI credits in most cases"; falls back to an AI edit when not deterministic.
- **Versions** in the preview toolbar (phone: ⋯ menu -> **Version history**); restore affects editor/preview only; must Publish again. Auto-save snapshot every 3 seconds (/tips-and-tricks).

### Import / migration (docs.ploy.ai/site-builder, /migrate/framer, /database/cms-migration)
- URL import: source must be public HTTP(S); "An import is not a guarantee of an identical copy".
- Whole-site move: Ploybook **Rebuild your site on Ploy**: inventory -> recommend what to rebuild vs keep on current host -> plan -> build key pages first -> check -> switch over; publishes only with OK.
- Framer migration 5 steps: import pages, import CMS (Framer project URL + API key via secure form), rebuild what doesn't transfer, keep the code (`ploy site git clone <directory>` or Code Sync; paid plan Starter+; Member role or higher for git clone), switch traffic (301 redirects in Path routing; proxy rest to `*.framer.website` / `*.framer.app` via **Everything else** row).
- CMS import sources: WordPress, Squarespace (public URL, no connection), Sanity (public dataset or token), Webflow, Framer, Wix, Notion (one-time secure connection). Mapping: collection -> table, item -> record, field -> column, rich text -> "Render-ready long text", image -> source URL then workspace-hosted asset. Re-import is not a sync; unreadable cell left empty and run marked partial on the "database card"; requires owner/admin.

### Effects (docs.ploy.ai/effects)
- Paper Shaders, npm `@paper-design/shaders-react`, Apache-2.0; 30 shaders: Backgrounds (20): Mesh Gradient, Static Mesh Gradient, Static Radial Gradient, Grain Gradient, Dithering, Dot Orbit, Dot Grid, Warp, Spiral, Swirl, Waves, Neuro Noise, Perlin Noise, Simplex Noise, Voronoi, Pulsing Border, Metaballs, Color Panels, Smoke Ring, God Rays. Image filters (7): Paper Texture, Fluted Glass, Water, Image Dithering, Halftone Dots, Halftone CMYK, Lens Distortion. Logo animations (3): Heatmap, Liquid Metal, Gem Smoke.
- Ploybook **Add an Effect** (`ploy-effects`); in-product "effects browser"/"effects catalog"; rolling out per workspace. Agent "hydrates it in your Astro site, and checks reduced-motion behavior and performance". Guidance: one WebGL canvas per page.

### Assets (docs.ploy.ai/assets)
- **Library** -> **Assets**. Categories: Images, Videos, Fonts, Documents, 3D Models, Animations (audio also supported). Pagination 50/100/200 per page ("Showing 1-50 of 1,240 assets"); search returns best matches from top 500.
- **Upload** types: Images JPEG, PNG, WebP, GIF, SVG, ICO, HEIC (-> JPEG); Videos MP4, WebM, MOV, AVI, MKV, OGG; Audio MP3; Fonts WOFF, WOFF2, TTF, OTF; Documents PDF; 3D GLB (glTF/FBX converted in browser); Animations RIV; Textures KTX2. "Raster images, including GIFs, must be under 50 MB. Other files can be up to 100 MB." Error: "Couldn't convert this HEIC image".
- Asset preview with **Details** and **Copy link** -> **Copied** (workspace-internal link, not public).
- Site rebuilds save the source site's images, videos, fonts into Assets.

### Templates
- No template gallery for sites is documented; the starting points are URL import, uploaded HTML/.zip design, "Design from scratch", Figma, and Ploybooks (workflow templates). The CLI references a "Ploy-provisioned Astro starter" (see section 14).

### Repository / publish contract (docs.ploy.ai/cli/bring-your-own-repo)
- `package.json` at root with `name` exactly `ploy-web`; `astro.config.mjs` at root, committed, default-exporting plain `defineConfig({...})`.
- Supported majors: `astro` 6.x, `@astrojs/cloudflare` 13.x, `@astrojs/react` 5.x, `@astrojs/sitemap` 3.x, `@astrojs/mdx` 5.x (if MDX).
- "Ploy wraps the tenant Astro config with its own config, which imports these packages from the tenant's `node_modules`."
- "The sandbox install is a plain `bun install`. Ploy deletes `package-lock.json` before installing".
- "At publish time Ploy AST-patches four fields: `site`, `build.assets`, `cacheDir`, and `vite.cacheDir`." "Ploy forces `output: "server"` for the Workers build".
- Example config: `output: "server"`, `build: { assets: "_astro" }`, `adapter: cloudflare()`, `integrations: [react(), sitemap()]`.
- Workers runtime rules: static routes need `export const prerender = true`; static assets served with `html_handling: "drop-trailing-slash"` (or `"force-trailing-slash"` if `trailingSlash: "always"`); server responses without cache headers get `Cache-Control: private`; `_redirects` entries ending `/index` or `/index.html` rejected; `node:fs` shimmed (use `import.meta.glob`).
- Local test: `bun install` then `bunx wrangler dev --local`.
- "A public `tenant-starter-astro` template and `bunx create-ploy-site` command are not available yet." Get the starter by provisioning a site and `ploy site git clone` / Code Sync (paid plan).
- Terms used: "tenant repository", "tenant Astro config" (multi-tenant build system).
- `ploy site init --from /path/to/repo --wait` = one-time initial import (new site each time); later changes via `ploy site git` (remote `ployspace`) or Code Sync.

### Code Sync with GitHub (docs.ploy.ai/integrations/code-sync-github)
- Per-site integration. Repos live in Ploy's own GitHub org: `git@github.com:ployspace/your_unique_site_name_slug.git` (Ploy-managed repositories; customers are added as collaborators). "Ploy initiates the repo in your sandbox during site creation."
- "Ploy's Agent commits changes to branches, opens PRs, and can also pull your team's external updates"; "Every commit Ploy's Agent makes includes a clear message".
- Pull: **Sync from GitHub** on the site's **Developer** page, `ploy site code-sync sync`, or ask the agent. "Ploy uses `git pull --rebase --autostash` so local sandbox edits aren't lost during a sync."
- "Ploy-managed repositories don't support third-party GitHub integrations for security reasons" (use a mirror).
- Paid plans only. Disconnect via **Workspace Settings -> Developer** -> Ploy Code Sync row -> **Connected** -> **Disconnect**.
- Troubleshooting states: "Sandbox is starting"; Push rejected; Permission denied; Merge conflicts; "Publishing paused because storage holds newer changes".

---

## 5. Publishing and hosting

### Publish pipeline (docs.ploy.ai/publishing)
- Steps: **Build** ("Ploy builds your site into optimized static assets") -> **Deploy** ("deployed to Ploy's global hosting infrastructure") -> **Live** (Ploy URL and custom domain). "Every deploy is a snapshot: a complete, immutable version of your site at that point in time." "Typical deploy time: A few seconds for most sites."
- Two targets per site: **Production** (`your-site.ploy.build`) and **Preview** (`staging-your-site.ploy.build`). Publish to either or both.
- First-publish wizard: choose site address -> **Continue** -> title, description, favicon, share image -> **Continue** -> choose targets Production / Preview / both -> **Publish**. Skipped if the agent already auto-published the first page.
- Publish panel: **Production** tile status line: **Up to date**, **N pages changed since last publish**, **Site changed since last publish**. Gear -> **Domains** (Site address), site details, automatic publishing, **Unpublish**. Button text **Publishing** while running. QR code button next to each address. Each target shows last publish time and member (agent publishes show "the Ploy mark"). Phone: panel is a bottom sheet.
- **View live site** from the site preview image in the site sidebar.
- Site address rules: "3 to 24 lowercase letters, numbers, and single hyphens. It cannot start with `staging-`, and some names, such as `app` and `www`, are reserved." Change is immediate, old address dies; owners/admins only; only while no custom domain.
- **Made by Ploy badge** on Free plan ploy.build addresses; hidden on paid; never on custom domains; updated on Production publish.
- **Unpublish**: site replaced by an offline page; nothing deleted.
- Post-publish checks: favicon fallback; tag-coverage check for Google Analytics, Google Tag Manager, Meta Pixel across pages (agent reports in chat; never blocks).
- States: **Publishing paused** (reason sentence; **Fix**); **Publish failed** (**Fix**, **Publish again**, **Show details**, **Full output**, issue count; names file and line for code errors); **Sandbox out of storage**; **Publish anyway** confirm when same error would recur; **Manage credits** replaces Fix when out of credits. Pre-publish "publishing checks" for oversized public files (/tips-and-tricks).
- Concurrency: "Only one publish can run at a time... Your request is not queued".
- **Automatic publishing**: per site, off by default; site dashboard -> **Advanced** -> **Automatic publishing**; scopes **Preview only** or **Preview + Production**. Exception: one-time first publish by the agent. Scheduled Ploybooks can publish to production only if Production auto-publish is enabled in **Site -> Advanced**; otherwise the run stops for manual publish.
- Staging-only review recipe: path like `/test/slug` + `noindex` + publish Preview only.

### Rollback (docs.ploy.ai/publishing, /site-builder)
- No direct "rollback deploy" button: "restore it from Versions in the editor, then publish again." Versions are auto-saved code snapshots of the site; restoring changes editor/preview only.

### Custom domains, SSL (docs.ploy.ai/publishing; details in /custom-domains below)
- Sites -> select site -> **Domains** -> **Add domain** -> **Set it up with Ploy** (chat) or **Set it up yourself**; "one-click via Entri where your DNS provider supports it, or add the records yourself". Click a domain row to manage **Path routing**.
- Free plans: no custom domains.
- "Ploy automatically provisions and renews SSL certificates for every custom domain... Certificates are issued via ACME challenge as soon as your DNS records verify." Always HTTPS.
- Registrars named: Cloudflare, Route 53, GoDaddy, Namecheap, Porkbun.

### Environment variables and secrets (docs.ploy.ai/environment-variables)
- Two tiers: **Variables** (visible in dashboard, available at build time and request time) and **Secrets** (write-only, request time only, "never exposed to Ploy's Agent or staff", not available in the sandbox preview). Scoped separately for **Preview** and **Production**. Changes apply only on next publish of that environment.
- "in an Astro/Cloudflare Workers site, server-side code reads them at request time"; prerendered Astro routes read Variables via `import.meta.env`; `PUBLIC_` prefix rules apply.
- CLI: `ploy env set --env production --env-file .env.production`; `ploy env list --env production`; `ploy env delete NAME... --env production [--dry-run]` (up to 100 names, all-or-nothing); `ploy variable delete`, `ploy secret delete`.

### Launch / migration details (docs.ploy.ai/hosting/launch-checklist, /hosting/migration-readiness)
- "Ploy generates `/sitemap-index.xml` automatically from all prerendered pages." Every site includes `robots.txt`. On Preview the sitemap uses the preview address.
- Primary domain: "Ploy will 308-redirect the other variant automatically"; canonicals handled automatically once primary domain set.
- 301 redirects via Path routing **Redirect instead**; pattern rules; "Contact support@ploy.ai before migration day if you need more than 20 rules."
- "Ploy provisions SSL via Cloudflare automatically after DNS verification." CAA: "allow Google Trust Services". Cloudflare DNS must be **DNS only**.
- Pre-provisioning SSL: **Add domain** -> **Set it up yourself** -> **Add the records yourself** (vs **Connect with** provider); add only `_acme-challenge` CNAMEs; wait for status "The certificate is ready. Waiting for DNS."; **Check again**.
- Requirements to connect a domain: plan includes custom domains AND site published to production.
- **Everything else** row in Path routing = fallback origin (old host); set to **This site** when done.
- "Ploy is optimised for marketing sites. Transactional flows typically live on a separate subdomain"; authenticated web apps "cannot move to Ploy directly" (proxy instead).
- "Ploy supports markdown-based content collections natively".
- Forms: "Submissions are captured in the dashboard and can trigger webhooks to your CRM or marketing stack."

### CSP / framing (docs.ploy.ai/publishing/content-security-policy)
- "`ploy.build` preview URLs intentionally prevent framing." On custom domain, set `Content-Security-Policy: frame-ancestors https://trusted-parent.example;` via `src/middleware.ts` (`defineMiddleware` from `astro:middleware`); route must be server-rendered (no `export const prerender = true`). "Ploy-created Astro sites do not include X-Frame-Options by default."
- Troubleshooting mentions "the intended Ploy site or Worker".

### Geo headers (docs.ploy.ai/visitor-location)
- Server-rendered pages and API routes receive: `cf-ipcountry` (`XX` unknown, `T1` Tor), `cf-region-code`, `cf-region`, `cf-ipcity`, `cf-postal-code`, `cf-metro-code`, `cf-ipcontinent`, `cf-iplatitude`, `cf-iplongitude`, `cf-timezone`. Not sent to proxied origins; usually absent in local CLI dev. "Pages Ploy builds are server-rendered unless they were set up to be prerendered."

### DNS values and edge (docs.ploy.ai/custom-domains/dns-setup, /advanced-setup, /advanced-setup/checklist, /domain-visualizer)
- SSL verification CNAMEs: `_acme-challenge` -> `your-domain.com.a93c3620a44f1490.dcv.cloudflare.com`; `_acme-challenge.www` -> `www.your-domain.com.a93c3620a44f1490.dcv.cloudflare.com` (Cloudflare delegated DCV = Cloudflare for SaaS custom hostnames).
- Production routing: `A @ 207.207.209.209`; `CNAME www proxy.runploy.com`.
- Verify: `curl -v --resolve www.your-domain.com:443:207.207.209.209 https://www.your-domain.com` -> "Response headers should include `server: cloudflare`", `200 OK` for default hostname or `308` for sibling domain.
- Statuses: "The certificate is ready. Waiting for DNS." then **Live**; **Check again**.
- Path routing ⋯ menu -> **Edit as JSON**; "routing schema supports up to 20 total rules".
- Staging hostname suggestion (`v2.your-domain.com`); lower TTL to 60-300 s; DNS purge at one.one.one.one/purge-cache.
- Setup option "Serve only some pages from this site" (listed paths served by Ploy, **Everything else** to existing site).
- Enterprise Support for cutovers via sales@ploy.ai.

### Behind your own proxy (docs.ploy.ai/custom-domains/behind-your-own-proxy)
- Proxy must fetch from `https://your-site.ploy.build`, not a Ploy custom domain (else treated as bot: A/B tests enroll no one, analytics dropped).
- Paths to forward: page paths; `/_ploy_static/` ("Styles, scripts and the favicon"); `/_ploy/` ("Form submissions and analytics events"); `/_p/` ("Ploy's analytics script"); site file folders (`/images`, `/fonts`).
- Must strip `Origin` header (Ploy silently drops forms/analytics when Origin mismatches); don't cache page HTML (A/B assignment at serve time via cookies); rewrite `Location` on absolute redirects. Ploy sees proxy IP (shared rate limit, wrong geo).

### Buying a domain (docs.ploy.ai/custom-domains/buy-domain)
- **Add domain** -> **Set it up yourself** -> enter domain -> if available **Continue to checkout** (IONOS affiliate checkout; separate account/payment) -> **Confirming your order** -> DNS preset. States: **Publish your site first**, **Start over**. Renewals managed at IONOS.

### Fallback origins / proxying (docs.ploy.ai/custom-domains/proxy-to-origins and /framer, /lovable, /webflow)
- Path routing UI vocabulary: **Add path**; match scope **This page and every page under it**; **Destination**: **This site** / **Another URL** / **Redirect instead**; **More options**: **Keep the original domain in the Host header**, **Add Ploy analytics to pages from this URL** (Ploy can inject its analytics into proxied pages); bottom row **Everything else** ("called **All pages** until you add a path"); ⋯ menu **Edit as JSON** -> summary -> **Apply changes**. Order matters (specific paths above broader ones).
- Provider recipes: Cloudflare Pages/Workers (`*.pages.dev`, `*.workers.dev`); Framer (`*.framer.website` or `*.framer.app` Base URL); Mintlify (`https://your-subdomain.mintlify.site`, Host header off); Vercel (stable `.vercel.app`, Host header off or `DEPLOYMENT_NOT_FOUND`); Webflow (dedicated `www2` subdomain, Host header ON, temp `yoursite.webflow.io`); AWS (EC2, ALB/NLB, CloudFront); Google Cloud Run; Lovable (`your-project.lovable.app`; path-prefix proxying not recommended); any public stable hostname (Hetzner, DigitalOcean, Linode, Tailscale Funnel).
- Destination URLs must be fully schemed, no trailing slash.
- Troubleshooting: broken proxied styles = a broader path catching asset requests.

### Ploy Connect WordPress plugin (docs.ploy.ai/hosting/ploy-connect-wordpress-plugin)
- Reverse-proxy plugin (`ploy-connect-1.2.4.zip`; WordPress 5.8+, PHP 7.4+; paid plan). Reads `{origin}/.well-known/ploy-manifest.json` with `Authorization: Bearer <site token>` (user-defined secret `PLOY_MANIFEST_SECRET`; the manifest endpoint is built by the agent inside the site, regenerated on every build).
- Manifest schema: `{ version: 1, enabled: true, min_plugin_version: "1.2.0", routes: [{ local, remote, ttl }], cache: { default_ttl: 300 } }`; required routes `/_ploy_static/*` (ttl 31536000, "content-addressed") and `/_ploy/*` (ttl 0); TTL clamped 0-86400; homepage `/` can never be proxied.
- WP admin page `/wp-admin/options-general.php?page=ploy-connect`: fields **Ploy site origin**, **Local overrides** (rule syntax `/path/*`, `/a/* => /b/*`, `!/path`, `ttl=600`, `#` comments; longest match wins), **Site Token**; settings **Forward 404s to WordPress** (default on), **Cache TTL (seconds)** (recommend 0); sync callback for cron.
- Ploy-rendered markup contains a Ploy-specific string such as `ploy-text` (marker for inline-editable text).
- Domains page has a **Ploy address** section.

### Migration cost calculator (docs.ploy.ai/migration-cost-calculator)
- Public tool at ploy.ai/migration-cost-calculator: scans a URL for source platform (Webflow, WordPress, Framer, Squarespace, Wix, Shopify, custom), page count, CMS items, redirects, forms/integrations, SEO requirements; button **Estimate migration**; "The structural migration is free." Uses the verb "slurp" for site import.

### Custom Domain Setup (docs.ploy.ai/custom-domains)
- Plan allowances "counted per workspace, by domain family": **Free 0**, **Starter 1**, **Pro 5**, **Enterprise unlimited**. "A domain family is one registrable apex. The apex, `www`, and all of its subdomains count together as one family." Each workspace has its own allowance.
- Ploy does not take over nameservers; only A and CNAME records. Owners/admins only; site must be published to production (**Publish your site first**).
- **Domains** page: one row per domain (apex + `www` share a row, "www.example.com redirects here"); statuses **Connecting**, **Live**, **Misconfigured**, **Not connected**; **Primary** badge; **Finish setup**; domain page with **Visit**, ⋯ menu (**Set as primary domain** / **Clear primary domain**, **Move to another site**, **Remove domain**), **Path routing**, **DNS records**.
- **Add domain** wizard: **Set it up with Ploy** (chat; checks broken links, missing redirects, SEO issues; uses credits) or **Set it up yourself**: enter domain -> **Continue** -> (buy if unowned) -> if domain already serves a site choose **This site, on every page** / **Keep some pages on another site** / **Serve only some pages from this site** (needs **Other site's address** e.g. `acme.webflow.io` + paths) -> **Connect with** <provider> (Entri) or **Add the records yourself** (copy buttons, **Check records**, "Ploy checks again every 30 seconds") -> progress steps **Check DNS records**, **Issue SSL certificate**, **Go live**.
- SSL: "Waiting for DNS can take up to 24 hours. Once DNS is verified, issuing the SSL certificate usually takes a few minutes." Default issuer **Google Trust Services**. Cloudflare: DNS only; no "Flexible" SSL.
- Primary domain: others 308-redirect and "their path routing stops applying"; republish to update canonical tags and sitemap.
- Move domain between sites (same org) preserving SSL: ⋯ -> **Move to another site** -> **Move domain** (passkey), or from destination **Add domain** -> **Move here**.
- **Remove domain**: immediate downtime; removes apex + `www` and deletes path routing; Ploy doesn't delete DNS records at provider.
- Troubleshooting themes: stale DNS caches ("Don't roll back your DNS"); Cloudflare 1001 and 1034 errors (domain still claimed by another Cloudflare-for-SaaS platform: BigCommerce, HubSpot, Kinsta, Render, Shopify, Webflow, WP Engine); Webflow Orange-to-Orange conflict; redirect loops with Flexible SSL; "Ploy uses Cloudflare's DNS resolvers".
- Routing JSON schema hints (Vercel/Next.js section): match with `pathPrefix` or `pattern`; action `type: "proxy"` with `originUrl` and `preserveHostHeader`; action `type: "redirect"` with `destination`, `statusCode`.
- Mentions (headings only, body not in dump): "SaaS Providers with Per-Customer Sub-Domains", "Using Cloudflare (or another edge provider) with managed edge certificates?", "Universal SSL notice".

### Path routing semantics (docs.ploy.ai/routing-rules)
- "Ploy ships a built-in **reverse proxy** at the edge of your domain": per request serve a Ploy page, forward to an external origin, or redirect. Matches: prefix, exact, regex. Destinations: Ploy site (any site in the workspace), proxy URL, redirect (301 default). First match wins; **Everything else** fallback. "Routing saved. Changes usually take effect within 60 seconds." Versioned (**History**), testable (**Test a URL**), JSON-editable. Applying requires Admin or Owner; "An additional confirmation may be required." Edge sync can fail independently of save (**Retry edge sync**).
- Max 20 rules (see CLI). Requires a plan with custom domains.

### FAQ items (docs.ploy.ai/faq)
- "My site isn't updating after I publish": clear cache, confirm Production publish finished, purge CDN.
- Multi-language: agent adds languages under prefixed URLs such as `/fr/about`, language switcher, localized titles/descriptions, hreflang; machine translation; CMS content translated only on request.
- **Delete Site** is permanent ("All deploys and content will be removed").
- Source export: paid plans only (`ploy site git clone <directory>` or Code Sync).
- Status page: `status.ploy.ai`.

---

## 6. Analytics

### What is tracked (docs.ploy.ai/analytics)
- "Every published Ploy site includes first-party analytics with no setup. Ploy tracks pageviews, sessions, traffic sources, scroll depth, clicks, forms and searches, and groups visits into channels".
- Hosted site auto-tracking: "page views, sessions, scroll depth, button and outbound clicks, forms, and searches".
- Channels: Direct, Organic Search, AI, Social, Referral, Email, Paid Search, Paid Social. "The AI channel counts visits from AI assistants such as ChatGPT, Perplexity, Claude, Gemini, and Copilot."
- **Bots** card on site Overview: "AI crawlers, which collect pages for AI models" vs "Agent visits, which are AI assistants such as ChatGPT, Claude, and Perplexity opening a page for a person."
- **Top Sources** (referrers, excluding internal clicks), **Top pages**, **Trends** (daily, weekly, custom range comparisons), total and unique pageviews.

### Dashboards
- Chart types: Line, Bar, Metric cards, Tables (sorting/filtering), Pie, Area. Also rolling average, cohort table, funnel; cards combining two tables; rate cards (CTR, CPC, CPA, ROAS) computed from totals; "shared definition" (reusable metric definitions) with impact analysis.
- Each site has a **Dashboard** page; layout elements: cards, text notes, titled sections, tabs. Controls: group by day/week/month, filters, search box; state in URL; **Save for everyone** / **Reset**; **Refresh**; query time limit message; table cap 1,000 rows.
- Cards can read PloyDB tables.
- Charts can be rendered in chat with date range/filter controls.

### Client API and cookies
- `window.ploy.track("event_name", { property: "value" })`; `window.ploy.identify(...)`; `window.ploy.consent("granted" | "denied")` or `window.ploy.consent({ analytics: true, ads: false })`.
- Cookie `ploy_anon_id` (first-party, one year) + matching localStorage entry. Refusal cookie `ploy_consent` (180 days). "Ploy waits up to one second for your banner before it stores anything." Without a consent call, the cookie is set by default.
- Denied mode: anonymous ID "resets every day", no IP stored; returning visitors count as new; no cross-day attribution; no visitor identification; `identify()` ignored; A/B tests show champion only.
- "Events are sent to your site's own domain." (first-party collection endpoint on the site domain; exact path not documented here).
- Ploy does not provide a cookie banner.

### Sources and destinations
- Settings -> Analytics sources: **Hosted site** (automatic; **Debug** to watch events arrive), **External sites** (create a snippet, allow-list domains, paste on every page), **Server-side events** (secret key; "track and identify endpoints shown in Instructions" - URLs not in docs).
- Forwarding destinations: GA4 measurement ID (`G-...`), Meta Pixel ID, Google Ads conversion ID (`AW-...`); browser events only; per-event routing; "Changes go live within a few minutes. You do not need to publish."; tags wait for consent.
- Per-site off switch **Collect analytics on this site**.
- GA4 and GSC connect via **Integrations** (Google OAuth), then property/site picker; agent queries them conversationally (active users, landing pages, acquisition by channel; queries, clicks, average position, index status).

---

## 7. AI search visibility / AEO / SEO

### AI search visibility / AEO (docs.ploy.ai/ai-search-visibility, /analytics)
- Engines checked: "ChatGPT search, Gemini, Claude, Perplexity, Google AI Overviews and Google AI Mode".
- Ad hoc checks in chat: whether business is mentioned and which sites are cited; uses AI credits.
- Tracking over time: Ploybook **Track Your AI Visibility** "sets up a project with a dashboard that asks your tracked questions every day and records where your brand and your competitors appear". Also suggested project **Get recommended in AI answers**.
- AI referral traffic: analytics AI channel (ChatGPT, Perplexity, Claude, Gemini, Copilot); Bots card separates AI crawlers and Agent visits.
- **Agent readiness audit** Ploybook (ploy.ai/ploybooks/agent-readiness-audit): "checks whether AI assistants can discover, read and act on your site. It gives a readiness score from 0 to 5, fixes the gaps it can, and verifies them." Optional llms.txt ("Google says it does not need llms.txt").
- **WebMCP** Ploybook (ploy.ai/ploybooks/add-webmcp-to-website): adds WebMCP "so AI agents can use your website's actions".
- Citable page types: product/feature pages, comparison pages, "Best tool for a use case" pages, how-to guides.
- Stated limits: "No tool can guarantee that an AI assistant names you"; "Results can differ from the answers people see in each AI app"; judge trends over weeks.
- SEO basics claimed in /introduction: "Structured data, meta tags, sitemaps, and robots.txt built in from the start". Onboarding "Organic traffic" goal: audits search ranking + AI answers, shows top three opportunities, builds the top one, offers weekly Ploybook.
- A dedicated "SEO agent" product page is not in docs; SEO work is done by Ploy's Agent with GSC data.

---

## 8. Audience: visitor identification, contact tools, enrichment, ABM

### Audience overview (docs.ploy.ai/audience)
- Two capabilities: **Contact Tools** and **Visitor Identification** ("name, company, title, LinkedIn, visit count, and pages viewed").
- Ploy-hosted unsubscribe page with categories: **Marketing**, **Agent updates**, **Reports and recommendations**, **Onboarding**, **Form submissions**. Re-enable under **Account -> Notifications**; workspace-level notification settings control Reports and recommendations.

### Contact Tools (docs.ploy.ai/contact-tools)
- No setup, "no data provider to connect" (underlying vendor not named).
- Find: **Email lookup** (work or personal), **Phone lookup**, **Email verification** (results: *deliverable*, *risky*, *undeliverable*, *unknown*; never sends an email).
- Enrich: **People** (from LinkedIn URL, email, or name + company domain: title, company, location, work history, education, social profiles, skills); **Companies** (from domain, name, LinkedIn page: industry, description, employee count, HQ, founding year, funding history, technology stack).
- Search/discover: **Prospects** (title, seniority, department, location, employer, recently started), **Companies** (industry, size, location, funding stage, investors, revenue, technologies, hiring), **Job postings**, **Social accounts** (X, TikTok, YouTube search; Instagram by handle), **Company titles**, **Job changes**.
- Metering: "a fixed number of contact lookups per billing period, shared across your organization"; pauses when exhausted; upgrade under **Billing settings -> Plan**; failed lookups from empty allowance not charged; name + domain lookups can often be free. Exact lookup numbers per plan: not documented on this page.
- ABM in docs: onboarding goal "Find more qualified leads" (define ICP, find matching companies, save to a database, build one page template giving each account a tailored draft page kept out of navigation and search, saved as Ploybook); webhook example "Clay enrichment -> generate a personalized ABM landing page per prospect" (/core-concepts).

### Visitor Identification (docs.ploy.ai/visitor-identification)
- Fields per identified visitor: Name (when available), Company, Job title, LinkedIn, Visit count, Pages viewed. Identifies both companies and individuals. On by default (/tips-and-tricks: "Visitor ID is on by default").
- "Each identification uses one visitor-enrichment credit. These credits are separate from AI credits. Starter includes 50 a month, Pro 1,000 a month and Enterprise a custom amount. Free plans do not include enrichment."
- Credits shared across the organization, reset on billing date; a per-workspace "enrichment limit" caps consumption (**Increase limit** -> **Settings -> Enrichments**).
- Only visitors who accept cookies or on sites that report no choice; refused visitors never matched.
- Disable per workspace (**Settings -> Enrichments** -> Disabled) or per site (Visitors tab -> **Enrichment settings**).
- Identification vendor / method: not documented.
- Agent queries: "Which companies viewed our pricing page in the last four weeks but never filled out a form?"; Ploybook pattern "Outbound from signals: Turn identified site visitors into a ranked, reviewed outreach queue" (/ploybooks).
- Geo personalization via `cf-*` headers (see section 5 / /visitor-location).

### Experiments (docs.ploy.ai/experiments) — CRO side of audience
- Section-level A/B test: champion vs challenger; goal = tracked conversion event; guardrails (form: 1; agent: up to 3); traffic split 10%-90%; "Starting an experiment publishes and verifies the live page"; promote != publish; plan sets concurrent running/paused experiments org-wide (number not documented); gated per workspace via sales@ploy.ai. Cookie-refusing visitors always see champion.

---

## 9. Database (PloyDB), CMS and forms

### PloyDB model (docs.ploy.ai/database)
- "PloyDB (Ploy DB), a built-in database (DB) you edit like a spreadsheet". Sidebar: **Databases**.
- Terms: **Database** (workspace-owned container), **Table**, **Column** (typed property), **Record** (row), **Access key** ("A scoped credential that lets your published site read or write specific tables").
- Column types: text, long text, number, currency, percent, checkbox, single-select, multi-select, status, people, date, URL, email, **Relation**. (API shows `columnType: "TEXT"` and `semanticType: "LONG_TEXT"`.) Files are also mentioned in CSV export ("Files export only their names"). Type changes convert values; stops and lists failing rows.
- Creation: via agent (proposes, creates on approval), by hand, or **Import CSV** (first row = column names, types inferred).
- Grid: inline edit (autosave), **Record panel**, filter/sort/reorder, drag rows and columns, live updates without refresh.
- Views: **Table** view (menu labelled **Table** -> **Export current view CSV**), **Kanban** view (no CSV export), **Diagram** view (**Add view** -> **Diagram**; cards and connections for relations). **Add property** -> **Relation**.
- CSV export: all rows matching search/filter/sort "up to 10,000 rows", visible columns in order; truncation warning.
- Database actions: **Chat in a Ploy** ("Open a database and choose Chat in a Ploy to start a new chat about it") — note the UI label uses "Ploy" as the noun for a chat. **Manage access** (owner/admin only; create/roll/revoke keys).
- Record actions: **Chat about this**, **Run** (when a text field is "marked as the prompt"), **Related work** (chats and artifacts linked to the record).
- Pages Manager: a database-backed dynamic route can be expanded in **Pages**: searchable paginated records; selecting one previews its real URL; demo record labelled **Placeholder**.
- DB-backed pages: "your edits reach visitors on their own, usually within a minute, with no republish."
- **Access keys**: one key = one database; per-table read / write / both / neither; new keys have no access; write-only keys can't read back; value shown once; stored as a Secret in site env vars under a chosen name (e.g. `JOBS_READ_TOKEN`); takes effect at next publish; roll / revoke / edit scopes.
- **Version history and restore**: "rolling 30-day history of every database"; named restore points; rollback to any point in 30 days; automatic undo point; owners/admins only.
- **Secret Columns**: hidden from the agent; auto-detected credential-like columns; **Mark as secret**; only a person can un-hide.
- Image links added by the agent are copied to Ploy storage (not for grid/CLI/CSV edits; SVG keeps original link).
- Limits: "up to 97 columns per table", "128 KB per text value", "CSV imports up to 32 MB", site writes rate-limited.

### External-app API (docs.ploy.ai/database/external-apps)
- Gateway origin: `https://ploydb-do-production.ploy.workers.dev`. Base URL: `https://ploydb-do-production.ploy.workers.dev/site/v1/ploydbs/{pdb_id}`. Auth: `Authorization: Bearer {access_key}`. Database ID `pdb_...` copied from the Ploy URL while the database is open (so the app URL contains the `pdb_` id). No CORS headers ("Do not call PloyDB from browser JavaScript").
| Method | Path (relative to base) | Purpose | Notes |
|---|---|---|---|
| GET | `/tables` | list tables + fields in key's read scope | returns `{ ok, tables: [{ tableId: "tbl_...", tableName, schemaVersion, fields: [{ fieldId: "fld_...", label, columnType | semanticType }] }] }` |
| POST | `/tables/{tableId}/query` | query rows | body `{ filters: [{ field, op: "eq", value }], sort: [{ field: "created_at", dir: "desc" }], limit }`; cursor pagination; max 50 filters, 10 sort fields, 500 rows/page |
| POST | `/tables/{tableId}/rows` | create row | body `{ values: { fld_...: v }, mutationId }`; returns `201 Created` + `{ row }`; `mutationId` = idempotency |
| PATCH | `/tables/{tableId}/rows/{rowId}` | update row | body `{ values, mutationId }`; `rowId` like `row_...` |
| DELETE | `/tables/{tableId}/rows/{rowId}?mutationId=...` | delete row | |
- Rows: `id`, timestamps, version, `values` keyed by field ID. IDs `tbl_`, `fld_`, `row_` are immutable across renames.
- Write-only keys: insert returns only ID/timestamps/version; update/delete return no body.
- Errors: JSON `{ error }`; limits: 128 KB per string, 2 MB single-row body; `429` rate limit; retry `5xx`.
- Key lifecycle: **Roll** (old value retired immediately), **Revoke**, **Edit access** (applies next request).
- Other filter operators besides `eq`: not documented on this page.

### CMS & Blogging (docs.ploy.ai/cms)
- Recommended: database-backed blog (index at `/blog`, post pages, tag pages `/blog/tag/<tag>`), Status column draft/published; SEO per post (titles, meta descriptions, Open Graph images, structured data); drafts excluded from index, tag pages, sitemap.
- "Any page can be a draft": content saved as a database record with publish flag off; drafts show in in-app preview but not on live site or Preview environment; publishing a draft is a record change, no republish.
- Alternatives: native file content (requires republish), webhooks -> Ploybook, reverse proxy a `/blog` path, external headless CMS with keys as Secrets.
- Bulk rewrite flow: agent researches, shows a finished sample, waits for yes.

### Forms (docs.ploy.ai/form-submissions, /database, /hosting/launch-checklist)
- "Forms built into a Ploy site capture submissions automatically." Review at **Sites -> your site -> Dashboard -> Submissions**; per-site **Notifications** email list.
- Reply-to: if the form has a field for the submitter's own email (Email, Email address, Your email, Work email), the notification uses it as reply-to.
- Submissions can also land in a PloyDB table ("every submission lands straight in a table") using a write-only access key; "Submissions ... can trigger webhooks to your CRM or marketing stack."
- Agent can analyze all submissions in a date range.
- Form endpoint path / spam protection details: not documented (Ploybook example mentions "filter spam").

---

## 10. Ploybooks and Projects

### Ploybook basics (docs.ploy.ai/core-concepts)
- Plain markdown "phases, steps, and instructions"; author manually or "save this as a Ploybook" from a chat ("it'll generalize the steps and tag the inputs that should be parameterized").
- Triggers: **Manually** from chat; **recurring schedule** in plain language ("every Monday at 9am, first of the month, weekdays at 6pm"), any IANA timezone, enable/disable without losing config, "A new schedule ends after 90 days unless you change or clear its end date"; **webhook** (payload as context).
- Example categories: recurring marketing ops, content production, lifecycle automations, site maintenance, onboarding playbooks.
- Tips: run manually first; start daily rather than "every 15 minutes" (/tips-and-tricks #10).

### Projects (docs.ploy.ai/projects)
- "A project collects the chats, pages, documents, databases, and Ploybooks that serve one goal."
- Created only on request (sidebar **New Project**, Suggested Projects card, or chat). Planning options: **Let's build the plan together**, **Iterate on the dashboard first**, **Let Ploy create the plan**.
- Structure: Outcome (one-sentence goal + charts), For you cards, Work log, Plan board (tasks with brief/steps/outputs, **Run**), Chats, Outputs, Dashboard tiles, Context (memory + linked Ploybooks + check-in).
- **Memory**: "Ploy's Agent writes decisions and constraints to memory as it works, and every chat started from the project reads them." Memory documents live in Docs and survive project deletion.
- **Daily check-in**: "Every active project has a check-in Ploybook that runs once a day, early in the morning in your workspace's timezone. It reviews progress and puts recommendations in For you." Recommendations are initiatives with steps; optionally pre-built as private draft pages (Draft tag, **Review and publish**); can diff draft vs live page. Cards persist until acted on; updated/removed by later check-ins. Check-in chats hidden from sidebar recents but shown on project page and **Run History**. Uses AI credits. Editable like any Ploybook schedule.

### Ploybooks in depth (docs.ploy.ai/ploybooks)
- "Every Ploybook is a plain-language guide, broken into phases and checklist steps". Properties: Reusable, Adaptable ("a guide, not a rigid macro"), Schedulable, Triggerable. Has title, description, tags, requirements (required integrations).
- Creation: from a chat ("Save this as a Ploybook" -> generalizes, replaces concrete details with placeholders); agent often offers; from scratch by description; **Customize** a library template into an editable copy.
- Running: on demand ("Each run happens in its own chat"), on schedule, on webhook trigger. Runs use the current version of the guide.
- Scheduling: plain language, no cron; multiple schedules per Ploybook; fields Timezone, Starts, Ends, Enable schedule. "A new schedule ends 90 days after it starts, at midnight in the schedule's timezone"; reminder notification 3 days before end to creator (or workspace owner). The schedule runs under a person's account ("the person whose account runs the schedule") and needs their integrations.
- **Working memory**: optional shared working document reused across recurring runs; off by default for custom Ploybooks.
- Publishing from a scheduled run requires Production automatic publishing in **Site -> Advanced**.
- Guidance: keep human in the loop; drafts rather than auto-send.

### Named Ploybooks found in docs
| Name | Where | What it does |
|---|---|---|
| Website health and usability audit | /ploybooks | Crawls every public page desktop + mobile; report in Docs; read-only; always runs on Ploy Agent |
| Build a Content Library | /ploybooks | Finds interviews, podcasts, articles, posts from company people; approvals; saves to a database with transcripts; reviews to Slack channel or doc |
| ABM Page for a Named Account | /ploybooks | Researches one company + buyer; builds private outreach page; "Proposed page" mockup label when no customer story fits |
| ABM Page for an Audience Segment | /ploybooks | Page for industry/role/company type; kept out of search |
| Enhance an Existing Website | /ploybooks | Restyles current site, homepage first |
| Add an Effect (`ploy-effects`) | /ploybooks, /effects | Paper Shaders effect install |
| Rebuild your site on Ploy | /site-builder, /migrate/framer | Whole-site migration |
| Track Your AI Visibility | /ai-search-visibility | Project + dashboard asking tracked questions daily |
| Agent readiness audit (`agent-readiness-audit`) | /ai-search-visibility | 0-5 readiness score, fixes, optional llms.txt |
| WebMCP (`add-webmcp-to-website`) | /ai-search-visibility | Adds WebMCP to site |
- Library categories named: SEO, Content, Conversion (others not listed). Public Ploybook pages exist at `ploy.ai/ploybooks/<slug>`.

### Webhook-triggered Ploybooks (docs.ploy.ai/webhooks)
- Endpoint (workspace-scoped) -> **Trigger ploybook**; "Every accepted event runs the Ploybook with the payload injected as prompt context"; runs in background; only workspace Ploybooks listed. Endpoint can also write to a PloyDB table (upsert on stable `event_id` recommended).
- Canonical example: Clay HTTP API action -> Ploybook `Generate ABM page for prospect` (clone ABM template, rewrite hero/value props/social proof, publish at `/for/{company-slug}`, return URL) -> "Pages publish within a couple of minutes".
- Failure checklist: trigger set, required integrations connected, org has AI credits; see **Run History**.

---

## 11. Integrations

### Custom MCP servers as integrations (docs.ploy.ai/cli/reference#integrations-mcp)
- Users can connect their own MCP servers so "Ploy's Agent can use their tools. Ploy only calls tools you allow." Auth modes: `auto`, `oauth`, `bearer`. Server saved turned off until tools approved and enabled; per-tool allow/deny pinned to a tool `revision`; `reconnect` clears approvals; servers can be shared with the workspace.

### Mechanism (docs.ploy.ai/integrations, /security)
- "Connections use **OAuth 2.0** with scoped permissions." "Most services connect through OAuth." Some import sources (Webflow, Framer, Wix, Sanity) use a pasted API token, stored encrypted, never shown to the agent. OAuth broker / integration vendor (e.g. a third-party connector platform): **not documented**; some integrations connect "through MCP" (La Growth Machine).
- Catalog UI: **Integrations** sidebar page with search + categories; card buttons **Connect**, **Upgrade**, **Request**, **Contact us**; status **Connected**, **Reconnect** / **Needs reconnect**, **Requested**; **Personal** badge; **MCP** tab.
- Connection actions: **Reconnect**, **Allow write access** ("Write access is off until you turn it on"), **Change account**, **Disconnect**.
- **Workspace connection** (shared by authorized members) vs **personal connection** (each member's own account); switch flow **About personal connections** -> **Review switch** -> **Switch to personal connections** (type integration ID). Scheduled runs use the account of the member they run as.
- In chat: cards **Connect**, **Reconnect**, **Choose account**, **Allow Writes** -> **Enable Writes**.
- **Request something else** with "What would you use it for?".

### Catalog (docs.ploy.ai/integrations)
- Design & Brand: Figma (extract tokens, export frames, design reference), Canva, Miro.
- Analytics & SEO: Google Analytics 4, Google Search Console, Amplitude, Semrush, PostHog, ClickHouse.
- Site development: Code Sync (via GitHub).
- CRM & Sales: HubSpot (two-way sync contacts/companies/deals), Salesforce (Enterprise), Attio (upsert companies by domain, people by email), Zoho Bigin, Zoho Invoice, Intercom, Stripe (read), Square (read), Clay (uses your Clay credits).
- Email & Outreach: Gmail (drafts/send), Mailchimp, Customer.io, Outlook, Klaviyo, Brevo, Instantly, La Growth Machine (via MCP).
- Advertising: Google Ads, Meta Ads (read + create campaigns/ads/creatives), Reddit Ads.
- Content & Productivity: Notion, Google Docs, Google Sheets, Google Slides, Airtable, Google Drive, Dropbox, Linear, Supabase.
- Social: LinkedIn, Facebook, Instagram, Reddit.
- Collaboration & Scheduling: Slack, Google Calendar, Google Meet, Zoom, Calendly, Granola, Microsoft Teams.

### Custom MCP servers (docs.ploy.ai/integrations#custom-mcp) — rolling out
- **Integrations** -> **MCP** tab -> **Add MCP server**: **Name**, **Server URL**, sign-in **Sign in with the server (OAuth)** or **API key**, optional **Client ID** / **Client secret** -> **Continue to sign in** -> "Signed in. Review and approve tools, then enable the server." -> per-tool **Approve** (Approved / Not approved) -> **Enable**. Actions: **Refresh tools**, **Disable**, **Reconnect** ("Reconnect needed"), **Revoke**. "Requested by the agent" label. Tool list paged 100 at a time (**Show more**), search box if > 20 tools; error "MCP server exceeds discovery size limit".

### Notifications and email triggers (docs.ploy.ai/notifications)
- Bell at bottom of sidebar; account **Settings -> Notifications**: **Browser notifications** (**Send test**), **Email notifications** ("Reply to an email to send a message to Ploy's Agent"), switches for **Form submissions**, **Onboarding**, **Marketing**. Workspace **Settings -> Notifications**: **Reports and recommendations** (workspace digests and assessment reports), **Accept email triggers** (owners/admins; "gives the workspace a private email address. Email it from your verified account to start a chat"; off by default).

### Ploy in Slack (docs.ploy.ai/slack) — rolling out (marketing name "Ployee", tag @Ployee; ploy.ai/llms.txt)
- **Account settings -> Slack** (`https://ploy.ai/account/slack`): **Add Ploy to Slack**, **Connect another Slack workspace**, cards listing **Connected Ploy workspaces**, **Add Ploy workspace**, **Reconnect**, **Disconnect workspaces**. Account link via DM (link valid 10 minutes).
- DM: top-level message = new chat; thread reply = same chat. Channel: mention the app in a thread; then it listens to the thread, stays quiet for human-to-human chatter (may react), first reply starts with **Working in** <workspace>. Status shown while working; stop from Slack; screenshots shared in thread.
- Handoff: "Continued in Ploy. Replies show there until you write here."; **Enable in Ploy**.
- Questions/approvals in Slack: **Approve** / **Request changes**; yes/no and choice buttons; custom answer form; **Answer 3 questions** wizard (**Next**, **Back**, **Submit**); **Answer in Ploy** -> **Answered in Ploy**.
- Publish card: addresses with **Live** / **Not published**, auto-publish state; choose **Preview**, **Production**, **Both** -> **Publish**; **Set up in Ploy** if never published.
- **Request access** from Slack (one open request per org; 7-day wait after decline).

---

## 12. AI Gateway

### Ploy AI Gateway (docs.ploy.ai/ai-gateway)
- "Use AI models from OpenAI, Anthropic, ElevenLabs and other providers on your website and in Ploy's Agent's work. You don't need an API key or a provider account. Every call uses your Ploy credits."
- Two uses: (1) on the published site (spend shows as **Website AI** on the Usage screen); (2) in the agent's own scripts ("Ploy's Agent writes and runs a script that calls models directly").
- Model types: Text; Decisions (classification/scoring with fixed answers, "Faster and cheaper than a text model"); Embeddings and reranking; Images (generate/edit with reference); Speech and music (voiceover, instrumental music); Transcription (word timings, speaker labels). "Video generation and realtime (live voice) models are not available through Ploy AI Gateway."
- Developer surface: file `ploy.ai.mjs` at project root exporting `createPloyAi` (returns an AI SDK provider) and `SiteAiUnavailableInPreview`. Used with Vercel AI SDK functions `generateText`, `streamText`, `embed`, `generateImage`, `generateSpeech`, `transcribe`; "Sites need the `ai` package, version 7 or later."
- Rules: "Put every route that calls a model under `/ploy-ai/`. Calls from any other path are refused."; server code only; env vars `PLOY_AI_URL` and `PLOY_AI_KEY` injected at publish on Preview and Production (reserved names); model IDs `provider/model`, e.g. `openai/gpt-6-luna-fast`; never take model/instructions/history from the request body.
- Example route `src/pages/ploy-ai/answer.ts` imports `env` from `"cloudflare:workers"`, `export const prerender = false`, `createPloyAi({ request, env })`, `ai.languageModel("openai/gpt-6-luna-fast")`.
- Gateway HTTP endpoint itself (value of `PLOY_AI_URL`) is not documented.
- Error statuses: `402` out of AI credits / Website AI limit reached; `429` too many calls in a minute; `403` site not published or Website AI paused; `401` site key out of date (republish); `503` briefly unavailable.
- Costs/limits: default cap "each workspace's published sites can use up to 10% of your plan's AI credits each period", editable via **Edit limit** under **Website AI** on the Usage screen (owners/admins). Works only on published Preview/Production ("The editor preview can't call models"). At the limit, site AI pauses, owners/admins emailed, visitors see fallback.
- Agent batch jobs: runs a small sample, shows results + cost estimate, waits for yes; a scheduled Ploybook counts as approval; resumable if credits run out.
- Cost anecdotes: 275 sales calls labeled + 34 accounts summarized "for under $1"; 1,038 profiles fact-checked for $1.78; video-ad audio $0.07; ~$1.70 for 284 blog header images.
- Reference implementation: "Ask Ploy, the chat on ploy.ai and these docs" (embeddings index of site pages + PloyDB, grounded answers, conversations saved to a PloyDB table).

---

## 13. MCP server

### Summary from /integrations (docs.ploy.ai/integrations#connect-your-ai-tools-with-mcp)
- Server URL `https://ploy.ai/api/mcp`; remote MCP with OAuth sign-in; no API key ("Workspace API tokens do not work with the MCP server"). At sign-in choose one workspace, or an organization (any workspace in it), then choose permissions.
| Permission | What it allows (verbatim) |
|---|---|
| **Chat with agents** | "Start and manage chats. Ploy's Agent can change data, use credits, and use connected services." |
| **Read workspace data** | "Read sites, forms, documents, visitors, conversations, and artifacts." |
| **Write workspace data** | "Create, edit, and delete databases, tables, columns, and rows. Needs Read workspace data." |
| **Publish sites to production** | "Publish saved site changes to your live site. Needs Read workspace data." |
- Manage: **Integrations** -> **MCP** tab -> **Ploy MCP server** (copy **Server URL**) -> **Manage connected clients** -> **Revoke access**.

### Ploy MCP server (docs.ploy.ai/mcp)
- URL `https://ploy.ai/api/mcp`; "remote MCP server (Streamable HTTP)"; OAuth; no API key.
- Consent screen: **All my workspaces in an organization** or **One workspace** (searchable); buttons **Authorize organization** / **Authorize workspace**; permission toggles (the four groups in the table above).
- Individual MCP tool names: **not listed in docs.ploy.ai** (docs describe capabilities only). Capabilities described, mapped to permission group:
  - Chat with agents: start and continue chats with Ploy's Agent; continues the site's existing chat ("it continues that site's existing chat with Ploy's Agent"); check progress of long-running work; upload/share files (public link, attached file in ChatGPT, text files, one-time upload link valid 10 minutes; up to 10 MB).
  - Read workspace data: list workspaces; list sites; read forms/submissions, documents, visitors, conversations, artifacts; page screenshots (shown as images in Claude); whether a site is published and at which address; list available/connected integrations; answer how-to questions from docs.ploy.ai; onboarding "what to do next" guidance.
  - Write workspace data: create/edit/delete databases, tables, columns, rows; create a workspace (organization-scoped connection with data changes allowed; created with a first site).
  - Publish sites to production: publish saved site changes.
- Claude-specific: three starters (MCP prompts) in the + menu: **Build my website**, **Move my site to Ploy**, **Check Ploy's progress**.
- Long-running: "from a few minutes to about an hour"; client polls every few minutes.
- Out of credits: tool reports refresh time and billing link.
- Client setup commands: Claude Code `claude mcp add --transport http ploy https://ploy.ai/api/mcp` then `/mcp` -> **Authenticate**; Codex CLI `codex mcp add ploy --url https://ploy.ai/api/mcp` (`codex mcp login ploy`, `codex mcp list`); Cursor `~/.cursor/mcp.json` `{ "mcpServers": { "ploy": { "url": "https://ploy.ai/api/mcp" } } }`; Claude Desktop/claude.ai **Add custom connector**; ChatGPT `chatgpt.com/plugins` -> **Add custom MCP server** (OAuth, empty client ID/secret); Grok `grok.com/connectors`; Grok Bot; Meta Muse.
- claude.ai file sharing requires adding ploy.ai under "Additional allowed domains".
- Revoke: **Integrations** -> **MCP** -> **Manage connected clients** -> **Revoke access**; to change scopes, remove and reconnect.
- Machine-readable: server card `https://ploy.ai/.well-known/mcp/server-card.json` (ploy.ai/llms.txt).

### OAuth scopes and endpoints (from on-disk machine-readable files, not docs.ploy.ai: `recon/f_.well-known_mcp.json`, `recon/d_ploy.ai_.well-known_oauth-authorization-server_api_auth`, `recon/f_.well-known_api-catalog`)
| OAuth scope | Consent label (docs.ploy.ai/mcp) | Covers |
|---|---|---|
| `ploy:chat` | Chat with agents | start/continue/manage chats with Ploy's Agent |
| `ploy:data:read` | Read workspace data | sites, forms, documents, visitors, conversations, artifacts |
| `ploy:data:write` | Write workspace data | databases, tables, columns, rows (and workspace creation) |
| `ploy:site:publish` | Publish sites to production | publish saved site changes |
| `offline_access` | (refresh tokens) | long-lived session |
- Scope-to-label mapping is inferred from matching order and names; the docs show only the labels.
- Server card: name `ploy`, title "Ploy MCP", version `2026-10-15`, transport `streamable-http`, `capabilities: { tools: {} }`, `dynamicClientRegistration: true`, `apiKey: false`.
- Authorization server issuer `https://ploy.ai/api/auth`; endpoints `/api/auth/oauth2/authorize`, `/oauth2/token`, `/oauth2/register` (dynamic client registration), `/oauth2/introspect`, `/oauth2/revoke`; `response_types_supported: ["code"]`; grants `authorization_code`, `refresh_token`; PKCE `S256`; token endpoint auth `none`, `client_secret_basic`, `client_secret_post`, `private_key_jwt`; DPoP algs advertised. Protected resource metadata at `https://ploy.ai/.well-known/oauth-protected-resource/api/mcp`.
- **Tool names: not available.** Neither docs.ploy.ai/mcp nor the server card enumerates tools (the card's `tools` object is empty); listing them requires an authenticated `tools/list` call, which is out of scope for this read-only recon. The only tool name in public text is the browser WebMCP tool `search_ploy` on ploy.ai (site search), which is not part of the Ploy MCP server.

---

## 14. CLI

### Install, update, help (docs.ploy.ai/cli, /cli/install)
- Standalone binary `ploy`; "does not require Bun, Node.js, or npm"; macOS and Linux on arm64 and x64 (no Windows documented).
- Install: `curl -fsSL https://ploy.ai/install.sh | sh` -> `$HOME/.local/bin` (adds to PATH in shell profile).
- Completions: `ploy completions zsh|bash|fish`.
- `ploy --version`, `ploy help`, `ploy help site`, `ploy site publish --help`.
- `ploy update` (atomic self-replace; daily best-effort update check; disable with `PLOY_NO_UPDATE_CHECK=1`).
- Installer analytics: one anonymous event; disable with `DO_NOT_TRACK=1` or `PLOY_INSTALL_NO_ANALYTICS=1`.
- Agent skill: `npx skills add Ploy-AI/ploy-tools` (public repo github.com/Ploy-AI/ploy-tools, skill `ploy-site`, reference `skills/ploy-site/references/workspace-transfer.md`). `ploy skills init` installs "a different, site-specific skill bundle".
- Quick start: `ploy login`; `ploy workspace use`; `ploy site use`; `ploy site status`.

### Auth (docs.ploy.ai/cli/authentication)
- `ploy login` (browser; MFA in browser; re-login stores new credential then revokes previous; no `--dry-run`).
- `ploy login --with-device` (OAuth device flow; prints verification URL + code; **Authorize CLI** button).
- Headless: `PLOY_API_TOKEN=sk_ploy_pat_...` created at workspace **Settings -> Developer -> API tokens**; "There is no `--token` flag"; takes precedence over stored login. Token pinned to one workspace; expiry 30, 90 (default), or 365 days; no refresh; shown once. Any member can create own tokens; owners/admins can view and revoke all.
- API token can additionally "read your site's analytics overview, events, and dashboards", "read and update site settings: title, description, favicon, and share image", "read dashboard and project artifacts". Cannot do cross-workspace copy/delete.
- `ploy whoami` (email, optional name, user ID; with token shows pinned workspace + days remaining).
- `ploy logout` (`ploy --dry-run logout`).
- `ploy tokens` (lists up to 100 active CLI refresh credentials).
- `ploy token revoke <target>` (`current`, id, or exact name; supports `--dry-run`).
- `logout`, `tokens`, `token revoke` unavailable with `PLOY_API_TOKEN` (exit `2`).
- Rate limit: "Each CLI credential ... is limited to 60 requests per minute"; rate-limited exits `1`; `--json` error includes `retryAfterSeconds`.
- Exit code `3` = auth required/expired; messages `PLOY_API_TOKEN is invalid or expired...`, `PLOY_API_TOKEN is not workspace-scoped.`, `This API token is scoped to a different workspace`.

### Workspace / organization / site selection (docs.ploy.ai/cli/workspaces-sites)
- `ploy workspace list` (`--json` -> `{ "workspaces": [...] }`; non-frozen workspaces), `ploy workspace use [--id <workspace-id>]`, `ploy workspace current` (source `flag`, `env`, `stored`), `ploy workspace create` (also creates starter site named `My Site`; CLI cannot delete it).
- Resolution order: `--workspace <id>` > `PLOY_WORKSPACE_ID` > saved > none. Inside a site checkout, uses checkout's workspace and reads the site from checkout Git settings (CLI 0.18.0+ semantics).
- `ploy organization list`, `ploy organization use [--id <organization-id> | --all]` (unavailable with API token).
- `ploy site list` (up to 100 sites; `--json` -> `{ "sites": [...] }`), `ploy site use [--id <site-id>]`; override per command with `--site <site-id>` or `PLOY_SITE_ID`.

### Site lifecycle
- `ploy site init [--name <title>] [--from <path>] [--prompt <message> | --prompt-file <path>] [--wait] [--json]`. `--from` = "Create a site from a compatible local Ploy Astro repository"; `--prompt` = "Start a Ploy with an initial request on the new blank site"; `--wait` = "Wait for provisioning, or follow the prompted Ploy until its turn completes." (Here "a Ploy" = an agent chat.) Removed option: `--slurp` (URL import; older versions).
- `ploy site status [--id <site-id>] [--json]`: state `pending`, `ready`, `failed`, `status-unavailable`.
- `ploy site visitors` (one page of identified people and companies; see /cli/reference#site-visitors).
- `ploy site publish [--target staging] [--wait] [--json]`: production by default; `--target staging` = Preview (CLI 0.18.0+); "There is no unpublish command." Response `{ operationId, reused, workflowStarted }` (+ `reuseReason: "operation_key" | "active_site"`). `--wait` polls up to nine minutes; exit `1` terminal failure, `5` polling timed out, `6` API contact lost. `ploy --dry-run site publish` -> `{ dryRun, target, workspaceId, siteId }`.
- `ploy site publish-status <operation-id> [--json]`: operation `status` `in_progress | succeeded | failed`; `deployments[]` with `target`, `status` (`queued | building | ready | error | cancelled`), `currentStep` (e.g. "Building site"), `url`, `error`. Build log truncated to ~1 KB; full log in dashboard **Deploys** -> failed deployment.

### Domains
- `ploy domain list [--json]` -> `{ "domains": [...] }` with `id`, `hostname`, `state`, `sslStatus`, `dnsVerified`, `kvSynced`, `lastError`.
- `ploy domain add <hostname> [--json]` (repeatable; phases `dns_pending`, `provisioning`, `connected`; needs admin/owner + custom-domain capability).
- `ploy domain status <hostname> [--json]`.
- `ploy domain remove <hostname> [--json]` -> `{ "removed": true, "hostname": "..." }`; refuses live domains (needs step-up auth).

### Routing
- `ploy site routing get [--hostname <hostname>] [--json]` -> `{ "rules": [], "defaultFallback": {} }`.
- `ploy site routing set --file <path|-> [--hostname <hostname>] [--dry-run] [--json]`: full replacement; rule shape `{ "match": {}, "action": {} }`; redirect rule `{ "pathPrefix": "/old-path", "action": { "type": "redirect", "destination": "/new-path", "statusCode": 301 } }`; "maximum of 20 total rules"; dry-run output `{ dryRun, hostname, currentRuleCount, nextRuleCount }`; edge sync failure returns `kvSyncError`, retry same command.
- Routing rules belong to the site's default custom domain; other hostnames redirect to it.

### Code Sync
- "Code Sync is included with every paid plan." `ploy site code-sync init` (after GitHub OAuth in dashboard; creates repo when needed; prints HTTPS/SSH clone commands). `ploy site code-sync sync` ("Import GitHub main into Ploy"; prints imported GitHub commit and resulting "Ploy site-workspace commit"). No `--json`/`--dry-run`. Known issue: first sync can return `Internal server error`.

### Variables / Secrets (docs.ploy.ai/cli/variables-secrets)
- `ploy variable set NAME --env preview|production [--body <value>]`, `ploy variable get NAME --env ...`, `ploy variable delete`.
- `ploy secret set NAME --env ...` (stdin or masked prompt), `ploy secret get NAME --env ...` (existence + last update only), `ploy secret delete`.
- `ploy env set --env <env> --env-file <path>` (1-100 unique entries; `PUBLIC_` names -> Variables, others -> Secrets; atomic upsert), `ploy env list --env <env>`, `ploy env delete NAME... --env <env>` (CLI 0.19.0+; up to 100; all-or-nothing).
- Rules: names `[A-Z][A-Z0-9_]*`, max 128 chars, no reserved names; values non-empty, max 64 KiB.

### Workspace transfers (docs.ploy.ai/cli/workspace-transfers)
- CLI 0.12.0+; both workspaces in same org; admin/owner on both; browser login only; "Organizations requiring SSO are currently unsupported." "The Ploy agent inside a workspace cannot perform this transfer because it has access to one workspace."
- Copies: site code (no Git/deploy history), databases (FILE columns unsupported), assets, variables/secrets, forms (submissions + notification settings), documents (Markdown; not comments/history/attachments), custom domains. "There is no single atomic transfer."
- Cross-organization workspace move: done by Ploy support.

### PloyDB commands (docs.ploy.ai/cli/database)
- `ploy database list [--json]` -> `{ "databases": [...] }`.
- `ploy database create --name <name> [--from <databaseId>] [--operation-key <uuid>] [--json]` (async duplicate with `--from`).
- `ploy database rename <databaseId> --name <name> [--json]`.
- `ploy database archive <databaseId> [--json]`.
- `ploy database delete <databaseId> --from-workspace <workspaceId> --confirm-database <databaseId> [--json]` (permanent archive + revoke access tokens).
- `ploy database copy <id> --from-workspace <source> --to-workspace <destination> --operation-key <uuid> --json`.
- `ploy database operation <operationId> [--json]` (statuses `in_progress`, `succeeded`, `failed`).
- `ploy database table list <databaseId> [--json]`; `table create <databaseId> --name <name>` ("starter columns and placeholder rows"); `table duplicate <databaseId> <tableId> [--operation-key <uuid>] [--json]`; `table rename <databaseId> <tableId> --name <name>`; `table delete <databaseId> <tableId>`.
- `ploy database column list <databaseId> <tableId> [--json]`; `column add ... --name <name> [--type <type>] [--secret] [--json]`; `column rename ... <fieldId> --name <name>`; `column retype ... <fieldId> --type <type>`; `column secret ... <fieldId> on|off`; `column delete ... <fieldId>`.
- Column types (CLI): `TEXT`, `LONG_TEXT`, `NUMBER`, `CURRENCY`, `PERCENT`, `CHECKBOX`, `SELECT`, `MULTI_SELECT`, `STATUS`, `PEOPLE`, `DATE`, `URL`, `EMAIL` (Relation and FILE exist in the app but are not creatable types here).
- `ploy database row list <databaseId> <tableId> [--limit 1..500] [--search <text>] [--filter <fieldId>:<operator>[:<value>]]... [--sort <fieldId>:<asc|desc>]... [--cursor <cursor>] [--fields <ids>] [--json]` -> `{ rows, nextCursor, hasMore }`; page max 8 MiB; up to 50 filters, 10 sorts, 1-97 fields.
- Filter operators: text/long text/URL/email: `contains`, `eq`, `neq`, `is_null`, `is_not_null`; number/currency/percent/date: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `is_null`, `is_not_null`; select/status/checkbox: `eq`, `neq`, `is_null`, `is_not_null`; multi-select/people: `list_contains`, `list_not_contains`, `is_null`, `is_not_null`.
- `ploy database row add <databaseId> <tableId> [--values <json> | --file <path|->] [--idempotency-key <key>] [--json]` (batch up to 100, atomic; batch output `{ "rows": [...], "inserted": <n> }`).
- `ploy database row update <databaseId> <tableId> <rowId> (--values <json> | --file <path>)`.
- `ploy database row upsert <databaseId> <tableId> --match <fieldId>=<value> (--values | --file) [--json]`.
- `ploy database row delete <databaseId> <tableId> <rowId> [--json]`.
- `ploy database export <databaseId> <tableId> [--file <path>] [--search] [--filter] [--sort] [--json]` (up to 10,000 rows).
- `ploy database import <databaseId> (--table-name <name> | --table-id <tableId>) [--file <path>] [--idempotency-key <key>] [--dry-run] [--json]`.

### Documents and Ploybooks (docs.ploy.ai/cli/documents-ploybooks)
- `ploy documents list [--limit <n>] [--cursor <cursor>] [--json]` (50 default, max 100); `ploy documents get (--id <id> | --path <path>) [--json]`; `ploy documents set <path> [--title <title>] [--json]` (Markdown from stdin; response `document` + `operation: "created" | "updated"`).
- Document object: `{ id, title, path, content, tags, createdBy, createdAt, updatedAt }`; paths start with `/` (e.g. `/briefs/launch.md`); title <= 200 chars; content <= 1,000,000 chars.
- `ploy ploybooks list` -> `{ "ploybooks": [...] }`; `ploy ploybook get <id> [--offset 0] [--limit 500]`; `ploy ploybook read <id>` (alias); `ploy ploybook outline <id>` (heading tree with stable section paths); `ploy ploybook read-section <id> <path>` (e.g. `phase-1/setup`).
- `ploy ploybook create --title <t> --content-file <path> [--description <d>] [--tag <tag>]...`; `ploy ploybook update <id> [--content-file <path|->] [--clear-tags]`; `ploy ploybook edit <id> (--edits-file <file> | --edits '<json>')` (1-10 exact replacements `[{ "old_string", "new_string" }]`); `ploy ploybook delete <id>`.
- Limits: title 1-200 chars; description <= 1,000; tags <= 20, each <= 50 chars; content <= 500,000 chars.
- `ploy ploybook schedule list <ploybook-id>`; `schedule create <ploybook-id> --cron "0 9 * * 1-5" --timezone America/New_York [--disabled]`; `schedule update <ploybook-id> <schedule-id> --disabled`; `schedule delete <ploybook-id> <schedule-id>`. Cron = five-field expression <= 200 chars; timezone IANA, default UTC. (So schedules are stored as cron; the app converts plain language to cron.)

### Local development and skills (docs.ploy.ai/cli/local-development)
- Flow: `ploy site use` -> `ploy site code-sync init` -> clone -> `ploy skills init` -> agent edits -> push to GitHub `main` -> `ploy site code-sync sync` -> `ploy site publish --wait`.
- `ploy skills init`, `ploy skills sync`, `ploy skills sync --check` (exit `1` on drift). Requires site repo whose `package.json` `name` is exactly `ploy-web` (else `Run this command from a Ploy site`). Installs to `.agents/skills/<id>/SKILL.md` and `.claude/skills/<id>/SKILL.md`; ownership in `.ploy/skills.json`; lock `.ploy/.skills.lock`. Catalog includes a "Migrate Site" skill.
- `ploy design-system list-components [--path <glob>] [--limit 1..200] [--cursor] [--include-deprecated] [--cwd <dir>]` (example glob `src/components/sections/**/*.tsx`); `ploy design-system get-theme-colors`. Need `src/pages` in checkout, `bash`, and `node` or `bun`. No login required.

### Remote/CI (docs.ploy.ai/cli/remote-development)
- Use `PLOY_API_TOKEN` + `PLOY_NO_UPDATE_CHECK=1`; allowlist outbound `https://ploy.ai`; pass `--workspace`, `--site` / `PLOY_SITE_ID`; config normally at `~/.config/ploy/config.json`. Mentions "Claude Cowork or another remote coding agent".

### Reference (docs.ploy.ai/cli/reference)
- Syntax: `ploy [global options] <command> [command options]`. Global options: `-v, --version`, `-h, --help`, `--dry-run`, `--workspace <id>`, `--site <id>`.
- Env: `PLOY_API_TOKEN`, `PLOY_WORKSPACE_ID`, `PLOY_SITE_ID`, `PLOY_NO_UPDATE_CHECK=1`, `XDG_CONFIG_HOME`. Config `~/.config/ploy/config.json` (mode `0600`).
- Exit codes: `0` success; `1` runtime/API/validation/terminal failure; `2` usage error; `3` auth required/expired; `4` "Plan upgrade required after an API `402` response"; `5` `site publish --wait`, `ploy chat --wait`, or `ploy chat wait` timed out; `6` `site publish --wait` lost API contact.
- Full command index (verbatim groups):
  - Lifecycle: `ploy update`, `ploy help [command]`, `ploy --version`, `ploy completions zsh|bash|fish`.
  - Auth: `ploy login`, `ploy logout`, `ploy whoami`, `ploy tokens`, `ploy token revoke <target>`.
  - Workspaces/sites: `ploy workspace list|use|current|create`; `ploy organization list|use|create`; `ploy site list|use|init|status|publish|delete|pages|versions|check`; `ploy site runtime pull`; `ploy site visitors`; `ploy site publish-status <operation-id>`; `ploy domain list|add|status|remove|move`; `ploy site routing get|set`; `ploy site code-sync init|sync`; `ploy site git clone|sync`.
  - Integrations: `ploy integrations mcp add|list|inspect|update|enable|disable|remove|reconnect|share|unshare`; `ploy integrations mcp auth-status|auth-cancel`; `ploy integrations mcp tools list|refresh|allow|deny`.
  - Projects: `ploy project recommendations <project-id>` (CLI 0.19.0+; `--json`).
  - Configuration: `ploy variable set|get|delete`; `ploy secret set|get|delete`; `ploy env set|copy|list|delete`.
  - Databases: `ploy database list|create|rename|archive|copy|delete|operation`; `ploy database table list|create|duplicate|rename|delete`; `ploy database column list|add|rename|retype|secret|delete`; `ploy database row list|add|upsert|update|delete`; `ploy database import` (and `export`).
  - Assets and forms: `ploy asset list|copy|upload|delete`; `ploy form list|get|copy|delete`; `ploy form notifications get|set`.
  - Content/workflows: `ploy documents list|get|set`; `ploy ploybooks list`; `ploy ploybook get|read|outline|read-section`; `ploy ploybook create|update|edit|delete`; `ploy ploybook schedule list|create|update|delete`; `ploy chat start|send|answer|questions|stop|list|read|wait|get|rename|delete|mark-read|upload`.
  - Local dev: `ploy skills init|sync`; `ploy design-system list-components|get-theme-colors`.
  - Listed but not further documented: `ploy site pages`, `ploy site versions`, `ploy site check`, `ploy site runtime pull`, `ploy organization create`, `ploy asset upload`.
- `ploy site visitors [--id <site-id>] [--type person|company] [--search <text>] [--sort lastSeen|visits] [--limit 1..100 (default 25)] [--offset <n>] [--json]` ("It does not start a Ploy.").
- `ploy site git clone <directory>` (remote named `ployspace`); `ploy site git sync`; flow `git pull --rebase ployspace main` -> `git push ployspace HEAD:main` -> `ploy site git sync`. Paid plans only; Member role or higher; "Syncing does not publish."
- `ploy integrations mcp add <name> --url <url> [--auth auto|oauth|bearer] [--token-stdin] [--no-browser] [--json]` (CLI 0.15.0+; OAuth 0.16.0+); `list`; `inspect <conn>`; `update <conn> --name <name>`; `enable <conn>`; `disable <conn>`; `remove <conn>`; `reconnect <conn>` (clears tool approvals); `share <conn>` (0.18.0+); `unshare <conn>`; `auth-status <operation-id>`; `auth-cancel <operation-id>`; `tools list <conn>`; `tools refresh <conn>`; `tools allow <conn> <tool> --revision <revision>`; `tools deny <conn> <tool> --revision <revision>`.
- Transfer commands (CLI 0.12.0): `asset list --from-workspace <id> --limit <n> --offset <n> --json`; `asset copy <id> --from-workspace <source> --to-workspace <destination> --json`; `env copy --from-workspace <s> --to-workspace <d> --from-site <ss> --to-site <ds> --env production --json`; `form list --from-workspace <id> --site <id> --json [--include-data]`; `form copy --from-workspace ... --to-workspace ... --from-site ... --to-site ... --json [--copy-settings]`; `form notifications get|set --from-workspace <id> --site <id> --json` (`set --emails '[]'`, `set --owner-default`); `form delete <id> --from-workspace <id> --site <id> --json`; `domain move <hostname> --from-workspace ... --to-workspace ... --from-site ... --to-site ... --json`; `site delete <id> --from-workspace <id> --confirm-site <id> --json`.

### Chats from the CLI (docs.ploy.ai/cli/chats)
- `ploy chat start "<message>" [--site <site-id>] [--title <title>] [--agent ploy|lite] [--file-id <ids...>] [--wait] [--timeout <seconds>] [--json]` (`-` reads stdin; timeout 1-3600 s, default 300; timeout exits `5`).
- `ploy chat send <chat-id> "<message>" [--wait] [--steer <turn-id>]` ("tries to redirect the turn that is running").
- `ploy chat list`; `ploy chat read <chat-id>`; `ploy chat wait <chat-id>`; `ploy chat get <chat-id>` ("shows the chat and its dashboard link").
- `ploy chat questions <chat-id>`; `ploy chat answer <chat-id> [answer] [--choice <numbers>] [--decision] [--boolean yes|no]`.
- `ploy chat stop <chat-id>`; `ploy chat rename <chat-id>`; `ploy chat delete <chat-id>`; `ploy chat mark-read <chat-id>`; `ploy chat upload <path>` (private file <= 10 MB, prints File ID).
- Implied chat data model: chat -> turns (turn-id) -> questions (types: free answer, numbered choice, decision/approval, boolean), read/unread state, attached file IDs, agent profile `ploy|lite`.

---

## 15. HTTP API endpoints, webhooks, embeds, SDKs, script tags, env vars

### Collected so far
| Surface | Method / form | Path or name | Auth | Source |
|---|---|---|---|---|
| PloyDB external API | GET | `https://ploydb-do-production.ploy.workers.dev/site/v1/ploydbs/{pdb_id}/tables` | `Authorization: Bearer {access_key}` | /database/external-apps |
| PloyDB external API | POST | `.../tables/{tableId}/query` | Bearer access key | same |
| PloyDB external API | POST | `.../tables/{tableId}/rows` | Bearer access key | same |
| PloyDB external API | PATCH | `.../tables/{tableId}/rows/{rowId}` | Bearer access key | same |
| PloyDB external API | DELETE | `.../tables/{tableId}/rows/{rowId}?mutationId=` | Bearer access key | same |
| Site AI routes | any | site routes under `/ploy-ai/` (e.g. `src/pages/ploy-ai/answer.ts`) call the gateway using `PLOY_AI_URL` + `PLOY_AI_KEY` | injected site key | /ai-gateway |
| Analytics browser SDK | JS | `window.ploy.track(name, props)`, `window.ploy.identify(...)`, `window.ploy.consent(...)` | n/a | /analytics |
| Analytics external snippet | script tag | "Create a snippet... paste the snippet on every page" (snippet text/URL not in docs) | domain allow-list | /analytics |
| Analytics server-side | HTTP | "track and identify endpoints shown in Instructions" (URLs not in docs) | secret key | /analytics |
| Cookies | - | `ploy_anon_id` (1 year), `ploy_consent` (180 days) | - | /analytics |
| Geo headers | request headers | `cf-ipcountry`, `cf-region-code`, `cf-region`, `cf-ipcity`, `cf-postal-code`, `cf-metro-code`, `cf-ipcontinent`, `cf-iplatitude`, `cf-iplongitude`, `cf-timezone` | - | /visitor-location |
| Generated files | - | `/sitemap-index.xml`, `/robots.txt`, optional `/llms.txt` | - | /hosting/* |
| CLI installer | GET | `https://ploy.ai/install.sh` | none | /cli/install |
| Docs/site search | GET | `https://ploy.ai/agent-tools/search?q=...` (returns 5 best sections as JSON: title, heading, url, snippet, score); also WebMCP tool `search_ploy` | none | docs llms.txt |
| Migration estimate API | OpenAPI | `https://ploy.ai/agent-tools/openapi.json` | none | ploy.ai/llms.txt |
| MCP server | Streamable HTTP | `https://ploy.ai/api/mcp`; server card `https://ploy.ai/.well-known/mcp/server-card.json` | OAuth | ploy.ai/llms.txt |
| Markdown content negotiation | GET with `Accept: text/markdown` | any docs/site URL | none | docs llms.txt |

### Environment variables (CLI and site)
- CLI: `PLOY_API_TOKEN` (`sk_ploy_pat_...`), `PLOY_WORKSPACE_ID`, `PLOY_SITE_ID`, `PLOY_NO_UPDATE_CHECK=1`, `PLOY_INSTALL_NO_ANALYTICS=1`, `DO_NOT_TRACK=1`.
- Site runtime (reserved): `PLOY_AI_URL`, `PLOY_AI_KEY`. User-defined Variables/Secrets (e.g. `JOBS_READ_TOKEN`, `PLOYDB_ID`, `PLOYDB_KEY` in examples).
- ID prefixes seen: `pdb_` (database), `tbl_` (table), `fld_` (field), `row_` (row), `sk_ploy_pat_` (API token).

### Hosted-site reserved paths and DNS targets
| Item | Value | Source |
|---|---|---|
| Static assets path | `/_ploy_static/` | /custom-domains/behind-your-own-proxy |
| Forms + analytics ingest path | `/_ploy/` (POSTs validated against `Origin`) | same |
| Analytics script path | `/_p/` | same |
| Site AI routes | `/ploy-ai/*` | /ai-gateway |
| Astro assets dir | `_astro` (`build.assets`) | /cli/bring-your-own-repo |
| Private pages prefix | `/private` | /site-builder |
| Apex A record | `207.207.209.209` | /custom-domains/dns-setup |
| CNAME target | `proxy.runploy.com` | same |
| DCV CNAME suffix | `<host>.a93c3620a44f1490.dcv.cloudflare.com` | same |
| Default hostnames | `<name>.ploy.build`, `staging-<name>.ploy.build` | /publishing |
| Git remote name | `ployspace` | /cli/reference |
| DNS reference deep link | `docs.ploy.ai/custom-domains/dns-setup?domain=your-domain.com` | checklist |
| WordPress manifest endpoint (site-defined) | GET `https://<site>.ploy.build/.well-known/ploy-manifest.json` with `Authorization: Bearer <PLOY_MANIFEST_SECRET>` | /hosting/ploy-connect-wordpress-plugin |
| WordPress plugin admin | `/wp-admin/options-general.php?page=ploy-connect` | same |
| Migration cost calculator | `https://ploy.ai/migration-cost-calculator` (API described by `https://ploy.ai/agent-tools/openapi.json`) | /migration-cost-calculator, ploy.ai/llms.txt |

### Inbound webhooks (docs.ploy.ai/webhooks) — the only documented first-party HTTP ingest API besides PloyDB
- Endpoint: `POST https://ploy.ai/api/v1/webhook/{endpointSlug}`; auth `Authorization: Bearer {apiKey}` (key scoped to one endpoint); `Content-Type: application/json` only.
- Payload: any JSON object, stored verbatim; max 1 MB, or 128 KB if the endpoint writes to a table. Invalid JSON still stored (200) but unusable by Ploybooks/tables.
- Responses: `200 OK` `{"event_id": "..."}`; `401` missing/invalid/rotated key; `403` key belongs to a different endpoint; `404` endpoint missing/deleted/disabled; `413`; `415`; `429` (> 60 requests/minute per key).
- No retries by Ploy (sender-driven). Ploybook execution happens after the 200.
- Webhooks are inbound only; outbound webhooks are not documented (forms "can trigger webhooks to your CRM" is stated once in /hosting/launch-checklist without detail).
- Create at **Workspace Settings -> Webhooks** -> **Create webhook** (optional description) -> **Create**; URL + key shown once (**I've copied the key**); **Rotate key**; **Trigger ploybook** selector / **No ploybook trigger**; destination PloyDB instance; **Events** tab (filter by endpoint, time range, substring search; expand JSON); pause/disable, resume, delete. Runs started by webhook show a **Webhook** label in the Ploybook's **Run History**.
- App URL pattern revealed: `https://ploy.ai/workspaces/{workspace-uuid}/settings/webhooks` (example uses UUID `8afd506c-4d9c-4226-8e5c-c225943bca94`).
- Example event names: `lead.enriched`, `lead.created`, `clay.account_enriched`. Example ABM slug `/for/{company-slug}`.
- Email trigger: workspace private email address (**Accept email triggers**) starts a chat (/notifications).

### Public agent-tools API and OAuth endpoints (on-disk `recon/f_agent-tools_openapi.json`, OAuth metadata)
| Method | Path | Operation | Params | Auth |
|---|---|---|---|---|
| GET | `https://ploy.ai/agent-tools/search` | `searchPloy` "Search the Ploy website and docs" | `q` | none |
| GET | `https://ploy.ai/agent-tools/migration-estimate` | `estimateMigrationCost` "Estimate website migration cost and time" | `url` | none |
| GET | `https://ploy.ai/.well-known/mcp/server-card.json` | MCP server card | - | none |
| GET | `https://ploy.ai/.well-known/oauth-protected-resource/api/mcp` | protected resource metadata | - | none |
| - | `https://ploy.ai/api/auth/oauth2/{authorize,token,register,introspect,revoke}` | OAuth 2.1-style AS for MCP clients | PKCE S256 | - |
| - | `https://ploy.ai/api/auth/sso/callback/sso-<random>` | per-org OIDC SSO callback | - | - |
| - | `https://ploy.ai/auth/login` (`?reason=logged_out&return_to=`) | login page | - | - |
| POST | `https://ploy.ai/api/v1/webhook/{endpointSlug}` | inbound webhook | JSON body | Bearer endpoint key |
| MCP | `https://ploy.ai/api/mcp` | Streamable HTTP MCP | - | OAuth |

### SDKs / embeds
- No public REST API for sites/chats/publishing is documented; programmatic control is via the CLI (which calls undocumented `ploy.ai` APIs with `PLOY_API_TOKEN`), the MCP server, PloyDB gateway, and inbound webhooks.
- No JS/TS SDK package is documented other than the in-repo `ploy.ai.mjs` (AI gateway provider) and the browser global `window.ploy`.
- Embeds: no embeddable widget/script for third-party sites other than the analytics snippet for "External sites"; iframing Ploy pages needs custom CSP (see section 5).
- Outbound webhooks/event subscriptions: not documented.

---

## 16. Team, roles and permissions, SSO, security and compliance

### Roles (docs.ploy.ai/working-with-a-team)
| Role | Verified scope (verbatim) |
|---|---|
| Owner | "Owns the organization and has organization-level control, including People and billing." |
| Admin | "Has elevated administrative permissions without being the organization owner, including deleting workspaces." |
| Member | "Has the standard collaboration permission level and does not receive organization ownership." |
- Inviting collaborators "is not included on Free. It is included on Starter, Pro, and Enterprise."
- Owner/Admin-only: delete workspace, change workspace settings (Members can view), manage custom domains, publishing/domain/workspace-settings changes via the agent.
- Workspace-level access: only Members can be limited; per-account flag via sales@ploy.ai.
- Domain-based join: "Anyone with an @yourdomain email can join"; otherwise access requests approved by owners/admins.
- Deleting a workspace with a Production-published site requires passkey confirmation if org requires enhanced sign-in.
- Slack users not in org can request access from Slack.

### Security statements (docs.ploy.ai/security, /enhanced-security)
- In transit: "TLS 1.2+"; at rest: "AES-256 encryption for stored data"; SSL via ACME.
- "Site builds run in isolated environments. Each build is sandboxed and cannot access other workspaces or sites."
- "Ploy does not use your content to train AI models."
- Analytics "privacy-first and do not rely on third-party tracking scripts".
- Trust Center: `https://trust.ploy.ai` ("compliance documentation, security reports, and real-time subprocessor and status information"). Specific certifications (SOC 2, ISO, GDPR DPA): not named in docs.
- Role guidance: "reserve the **Admin** role for trusted members... Invite everyone else as **Members** - they can edit and publish content but cannot make changes to infrastructure."
- Enhanced security: passkeys (account) and org-level enforcement; see below.

### Account security (docs.ploy.ai/enhanced-security/account)
- Sign-in methods mentioned: email + password, Google sign-in, passkey (**Log in with a passkey**), email sign-in links (**Having trouble signing in?**), SSO.
- Passkeys: avatar (bottom of left sidebar) -> **Settings** -> **Security** -> **Passkeys** -> **Add a passkey**; rename (pencil), remove (trash; re-confirm unless signed in within last 5 minutes). With >= 1 passkey, passkey is required as second factor after email/password and SSO sign-ins (not for Google sign-in, passkey sign-in, email links).

### Organization security (docs.ploy.ai/enhanced-security/organization)
- **Organization -> Security** (owner only): require enhanced sign-in for **Only owners and admins** or **All members**, with a **Deadline**.
- Step-up authentication (remembered 5 minutes) for: removing a custom domain serving live traffic; deleting a workspace with a Production-published site; deleting a site associated with a live domain.
- **Audit log**: **Settings -> Organization -> Audit log**; Enterprise only; one year of history; owners/admins; records "what people and agents ... did, such as chats, publishes, membership changes, and integration activity"; filters time, workspace, action, actor, origin; **Export CSV** (up to 10,000 entries).

### Code Sync permissions (docs.ploy.ai/integrations/code-sync-github)
- Workspace Owners/Admins authorize the Ploy GitHub App (`github.com/apps/ploy-ai-github-integration`) from the `@ployspace` org. App permissions: "Create branch or tag", "Push to the repo". Collaborators added by GitHub username in **Site Settings -> Developer -> Source Control - Collaborators**.

### SSO (docs.ploy.ai/security/sso)
- Enterprise plans only; protocol **OpenID Connect (OIDC)** (no SAML documented). Only the organization **Owner** can configure; **Organization settings -> Security**; non-entitled orgs see **Talk to sales to enable SSO**.
- Steps: confirm **Email domain** -> add TXT DNS record (valid seven days) -> **Check DNS** -> create IdP OIDC "Web application" -> enter **OIDC issuer**, **Client ID**, **Client secret** -> **Token endpoint authentication** (default **Use discovery**) -> Advanced OIDC overrides (Authorization, Token, JWKS, UserInfo endpoints) -> **Save Provider** (requires a passkey) -> **Verify domain** (passkey) -> copy callback URL `https://ploy.ai/api/auth/sso/callback/sso-<random>` into IdP -> test at `https://ploy.ai/auth/login` via **Continue with SSO**. Setting **Require SSO**. IdP examples: Okta, Google, Microsoft Entra.
- Incompatibilities: Ploy in Slack "is not available for organizations that require single sign-on (SSO)"; CLI workspace transfers unsupported for SSO orgs.

### Slack-side permissions (docs.ploy.ai/slack)
- Publishing from Slack: "Anyone in the thread who is an owner, admin, or member of the Ploy workspace can publish this way, and the publish runs as them." Seats: "If your organization has no seats left, approving shows the admin an **Upgrade plan** link" (plans have seat limits; numbers not documented).
- Domain operations: "Only owners and admins can add domains"; moving a domain needs owner/admin + passkey confirmation if asked.

---

## 17. Plans, pricing, credits, limits, quotas

- Plans named: Free, Starter, Pro, Enterprise (docs index, /working-with-a-team). "Ploy for Startups program: 12 months of Starter free ($600 value)" (ploy.ai/llms.txt) => Starter list price implied $50/month.
- Attachment limit 10 MB per file; design upload 10 MB; paste > 4,000 chars becomes a file (/ploy-chat, /quick-start).
- Company summary max 500 characters.
- Auto-save snapshot "every 3 seconds" (/tips-and-tricks).
- AI credits (docs.ploy.ai/site-builder): "Free gives 500 a day up to 2,000 in total, Starter 4,000 a month and Pro 24,000 a month."
- Custom domains: "Starter includes 1 custom domain family per workspace and Pro includes 5."
- Source code access (git clone / Code Sync) requires paid plan, Starter or higher (/migrate/framer).
- Asset upload limits: raster images < 50 MB, other files up to 100 MB (/assets). Dashboard table card max 1,000 rows (/analytics).
- Website AI default cap: 10% of plan AI credits per period per workspace's published sites (/ai-gateway).
- PloyDB limits: 97 columns/table; 128 KB per text value; CSV import 32 MB; CSV export 10,000 rows; API 50 filters, 10 sorts, 500 rows/page, 2 MB row body; 30-day DB history (/database, /database/external-apps).
- Free plan: no custom domains; "Made by Ploy" badge on ploy.build addresses (/publishing).
- Site address 3-24 chars (/publishing).
- Contact lookups: fixed number per billing period per plan, org-shared (number not on that page) (/contact-tools).
- Visitor-enrichment credits: Starter 50/month, Pro 1,000/month, Enterprise custom, Free none (/visitor-identification).
- Experiments: plan-limited concurrent count (N not stated); 10-90% split; 1 guardrail in form, up to 3 via agent (/experiments).
- `ploy env delete`: up to 100 names per command (/environment-variables).
- Redirect rules: contact support if more than 20 rules needed (/hosting/migration-readiness).
- Ploybook schedules default end: 90 days (/ploybooks).
- CLI rate limit 60 requests/min per credential; API token expiry 30/90/365 days; site list up to 100; env names <= 128 chars, values <= 64 KiB, dotenv 1-100 entries; routing max 20 rules; publish wait up to nine minutes (/cli/*).
- "Code Sync is included with every paid plan." (/cli/workspaces-sites)
- CLI DB limits: row list limit 1-500, page max 8 MiB, batch add up to 100 rows, idempotency key 1-128 chars; documents content <= 1,000,000 chars; Ploybook content <= 500,000 chars, title <= 200, description <= 1,000, tags <= 20 (/cli/database, /cli/documents-ploybooks).
- `ploy site git` "available on paid plans only" (/cli/reference).

### Credits model (docs.ploy.ai/credits)
- Three separately metered credit types: **AI credits** ("Everything Ploy's Agent builds, writes, plans, or generates"), **Visitor enrichment credits**, **Contact credits**. Org-wide balance shared by all workspaces.
- Spends AI credits: chatting to build/edit, code generation and planning, image generation, document generation, Ploybook runs (incl. scheduled), AI fallback text edits, Website AI. Does not: direct text edits in preview (mostly), visitors browsing the published site, dictation.
- "Longer chats cost more than short ones, because the Agent carries more context as the conversation grows."
- Free: "500 AI credits a day, refilled at midnight UTC, up to 2,000 in total. After you have used 2,000, daily refills stop and you need a paid plan". Paid: allowance renews on billing date monthly; "Unused credits do not carry over."
- Starter 4,000/month, Pro 24,000/month base (/site-builder); "Starter and Pro each offer several credit tiers" (tier values and prices: not documented; see ploy.ai/pricing). Enterprise: custom, via **Talk with Sales**.
- Per-action credit prices (credits per message/build): not documented.
- Billing: monthly or annual for Starter/Pro (annual cheaper; credits still reset monthly); upgrades prorated immediately; downgrades at period end (**Undo**); cancel = **Downgrade to Free?** dialog; invoices via billing portal (**Manage** / **View invoices**).
- **Auto-reload** (if plan includes it): **When to reload**, **Amount per reload**, monthly spending limit; states **Paused**, **Resume auto-reload**.
- Referral: link `ploy.ai/r/<CODE>`; friend gets 500 credits on email confirm; referrer gets 1,500 credits when friend's org starts a paid plan; personal balance on **My Credits**.
- Website AI limit: default 10% of plan AI credits per period per workspace; **Edit limit** -> share, fixed number, or no limit.
- Visitor enrichment: org credits + per-workspace enrichment limit; more than plan -> email support.
- Usage analytics: date ranges (This billing cycle, Last billing cycle, Last 7/30/90 days, All time, custom; UTC); **Filter by user**; **Group usage by** Chat / User / Usage type; chart **Cumulative** / **Per day**; list **What used your credits**.
- Out-of-credits UX: **Upgrade to continue** dialog (owners/admins), notice above chat box; balance label changes to **Upgrade** or **Fix billing**; Enterprise gets approach alerts.
- Each active project's daily check-in consumes credits.

### Integration plan gating (docs.ploy.ai/integrations)
| Plan | Integrations included |
|---|---|
| All plans incl. Free | Figma, Miro, Google Analytics 4, Google Search Console, Meta Ads |
| Starter and above | Gmail, Outlook, Google Drive, Docs, Sheets, Slides, Calendar, Meet, Notion, Slack, Airtable, Dropbox, Calendly, Canva, Granola, Linear, LinkedIn, Facebook, Instagram, Reddit, PostHog, Zoom |
| Pro and above | HubSpot, Attio, Zoho Bigin, Zoho Invoice, Mailchimp, Klaviyo, Brevo, Customer.io, Instantly, Intercom, Google Ads, Reddit Ads, Amplitude, ClickHouse, Supabase, Semrush, Square, Stripe |
| Enterprise | Salesforce |
- Custom MCP servers: plan feature ("Upgrade to add an MCP server"); which plan: not documented.

---

## 18. Tech-stack evidence

| Vendor / tech | Evidence (quote) | Source |
|---|---|---|
| Astro, React, TypeScript, Tailwind CSS | "Every Ploy site runs on a modern web stack: Astro, React, TypeScript, and Tailwind CSS." | /site-builder |
| Tailwind theme tokens / CSS custom properties | "compiled into CSS custom properties (Tailwind theme tokens)" | /site-builder |
| Cloudflare Workers (site runtime) | example route `import { env } from "cloudflare:workers";`; "in an Astro/Cloudflare Workers site, server-side code reads them at request time" | /ai-gateway, /environment-variables |
| Cloudflare (SSL / edge) | "Ploy provisions SSL via Cloudflare automatically after DNS verification." | /hosting/launch-checklist |
| Cloudflare geo headers | `cf-ipcountry`, `cf-region-code`, `cf-ipcity` etc. passed to site | /visitor-location |
| Cloudflare Workers + Durable Objects (PloyDB) | gateway origin `https://ploydb-do-production.ploy.workers.dev` ("-do-" strongly suggests Durable Objects; inference from hostname) | /database/external-apps |
| Cloudflare KV (domain/routing edge config) | domain object field `kvSynced`; routing error field `kvSyncError` (inference from field names) | /cli/workspaces-sites |
| Google Trust Services (cert CA) | "If you use CAA records, allow Google Trust Services." | /hosting/migration-readiness |
| ACME | "Certificates are issued via ACME challenge"; `_acme-challenge` CNAME | /publishing |
| Entri (DNS automation) | "one-click via Entri where your DNS provider supports it" | /publishing |
| Vercel AI SDK | "`createPloyAi` function returns an AI SDK provider... `generateText`, `streamText`... `ai` package, version 7 or later" | /ai-gateway |
| Model providers: OpenAI, Anthropic, ElevenLabs | "Use AI models from OpenAI, Anthropic, ElevenLabs and other providers"; model id `openai/gpt-6-luna-fast` | /ai-gateway |
| Paper Shaders | npm `@paper-design/shaders-react`, Apache-2.0 | /effects |
| Pagefind | "We strongly recommend Pagefind for adding search to static Ploy sites." | /site-builder |
| Vite | "Vite inlines literal `PUBLIC_*` names into the client bundle." | /cli/variables-secrets |
| Git (per-site repo in a sandbox) | `ploy site git clone <directory>`; `git submodule` "available in the same sandbox"; "Sandbox out of storage" | /migrate/framer, /site-builder, /publishing |
| GitHub (Code Sync) | "Edits from Ploy's Agent then commit to the site's GitHub repository" | /migrate/framer |
| Lighthouse | "Ask Ploy's Agent to run a Lighthouse audit." | /publishing |
| GA4, GTM, Meta Pixel, Google Ads | forwarding destinations and post-publish tag check | /analytics, /publishing |
| CLI binary | "does not require Bun, Node.js, or npm" (mention of Bun first hints at Bun-compiled binary; inference) | /cli |
| `skills` CLI (npx skills add) | `npx skills add Ploy-AI/ploy-tools` | /cli |
| Astro 6 + `@astrojs/cloudflare` 13 + `@astrojs/react` 5 + `@astrojs/sitemap` 3 (+ `@astrojs/mdx` 5) | "Supported major" table | /cli/bring-your-own-repo |
| Bun (sandbox package manager) | "The sandbox install is a plain `bun install`. Ploy deletes `package-lock.json` before installing" | /cli/bring-your-own-repo |
| Wrangler / Workers static assets | "`bunx wrangler dev --local`"; `html_handling: "drop-trailing-slash"`; "Ploy forces `output: "server"` for the Workers build" | /cli/bring-your-own-repo |
| Cloudflare for SaaS (custom hostnames) | `_acme-challenge` CNAME -> `*.dcv.cloudflare.com`; `server: cloudflare` response header; A `207.207.209.209`; CNAME `proxy.runploy.com` | /custom-domains/dns-setup, checklist |
| IONOS (domain registrar affiliate) | "IONOS is Ploy's affiliate partner for domain purchases." | /custom-domains/buy-domain |
| Second brand domain `runploy.com` | `proxy.runploy.com` | /custom-domains/dns-setup |
| GitHub App + Ploy-owned GitHub org | "authorize the Ploy GitHub App from the `@ployspace` org"; repo `git@github.com:ployspace/<slug>.git` | /integrations/code-sync-github |
| App routing | `https://ploy.ai/workspaces/{uuid}/settings/webhooks`; API under `https://ploy.ai/api/v1/...` and `https://ploy.ai/api/mcp` | /webhooks, /mcp |
| MCP (Streamable HTTP + OAuth) | "It is a remote MCP server (Streamable HTTP)." | /mcp |
| WebAuthn passkeys | "Passkeys are a phishing-resistant alternative to passwords." | /enhanced-security/account |
| Cloudflare DNS resolvers | "Ploy uses Cloudflare's DNS resolvers" | /custom-domains |
| Cloudflare for SaaS conflicts | 1034 error: "another provider that also uses the Cloudflare platform"; link to cloudflare-for-saas provider guides | /custom-domains |
| Google Trust Services | "the default certificate issuer for the Ploy platform" | /custom-domains |
| OIDC SSO; auth routes | callback `https://ploy.ai/api/auth/sso/callback/...`; login `https://ploy.ai/auth/login` | /security/sso |
| Slack app | **Add Ploy to Slack**; `https://ploy.ai/account/slack` | /slack |

---

## 19. Notable gaps, limitations, known issues, troubleshooting themes

- "Agent silently stops mid-task" "came up many times in the past... it can still happen in the odd edge case"; workaround: send "continue" (/tips-and-tricks #7).
- "Failed JSON" error = expired session; refresh (/tips-and-tricks).
- Oversized public files block publishing ("publishing checks") (/tips-and-tricks).
- `_acme-challenge` CNAME must be DNS-only on Cloudflare or SSL "will never be issued" (/tips-and-tricks).
- Access boundaries are weak by default: all org members see all workspaces; workspace-level access is a gated per-account feature (/working-with-a-team).
- Team invites not on Free plan.
- Queued messages can't be edited or reordered; agent can't hear audio attachments; repeating reminders stop after 7 days; new Ploybook schedules end after 90 days by default.
- Setup blocked when org is out of AI credits ("Setup needs AI credits").
- Stop does not cancel background work, and the agent "may pick the task back up".
- Per-message credit burn risk: "Make sure you have enough credits so a large run doesn't stop halfway."
- Imports are rebuilds, "not an identical copy"; forms, animations, embeds, private pages, live data need separate work (/site-builder, /migrate/framer).
- Private pages "are not password protected" (no built-in page password protection documented).
- CMS re-import "is not a sync"; no incremental CMS sync (/database/cms-migration).
- Effects gated per workspace during rollout (/effects).
- Design-system build fails if the source site blocks automated visits (/site-builder).
- Outside repos on arbitrary frameworks not supported ("we cannot guarantee a successful conversion").
- AEO results are sampled and "can differ from the answers people see in each AI app" (/ai-search-visibility).
- Analytics forwarding is browser-only; no built-in cookie banner; dashboard card queries can hit a time limit (/analytics).
- Only one publish at a time; concurrent requests are not queued (/publishing).
- No one-click rollback of the live site: restore a version in editor, then republish (/publishing).
- "Sandbox out of storage" publish failure exists (/publishing).
- Site AI features cannot be tested in the editor preview; must publish to Preview (/ai-gateway). No video or realtime models in the gateway.
- PloyDB gateway sends no CORS headers; CSV export "is not a lossless backup"; DB restore window only 30 days (/database).
- Contact lookups hard-stop when allowance is exhausted (no overage purchase documented) (/contact-tools).
- Draft pages are visible in in-app preview only, not in the Preview environment (/cms).
- Experiments is "available on request" only (sales-gated), section-level only, one page section per experiment (/experiments).
- Env changes need a republish; Secrets unavailable at build time and in sandbox preview (/environment-variables).
- "Ploy is optimised for marketing sites"; e-commerce checkout and authenticated apps cannot move to Ploy (must be proxied) (/hosting/launch-checklist).
- Redirect rule count: more than 20 needs support contact (/hosting/migration-readiness).
- `ploy.build` URLs cannot be iframed; CSP requires hand-built middleware and server rendering (/publishing/content-security-policy).
- Geo headers unavailable on prerendered pages and in local dev (/visitor-location).
- Visitor ID unavailable on Free; consent-refusing visitors never identified (/visitor-identification).
- Ploybook schedule requires the scheduling person's integrations; schedules silently end after 90 days unless extended (/ploybooks).
- CLI: no Windows binary documented; "There is no unpublish command"; `publish-status` build log truncated to ~1 KB; routing limited to 20 rules total and requires a connected custom domain even for dry-run; `routing set` is whole-document replace; edge sync can fail after DB write (`kvSyncError`) (/cli/workspaces-sites).
- Code Sync: first sync after connecting GitHub "can return `Internal server error`" (/cli/workspaces-sites).
- Workspace transfer is a manual multi-step copy ("no single atomic transfer"), loses Git and deployment history, FILE columns unsupported, SSO orgs unsupported; cross-org move requires support (/cli/workspace-transfers).
- API tokens: workspace-pinned, max 365 days, 60 requests/min per credential (/cli/authentication).
- `ploy workspace create` leaves an undeletable-from-CLI starter site `My Site`.
- CLI design-system inspection needs `node` or `bun` despite the "no runtime" binary; `ploy skills init` hard-requires `package.json` name `ploy-web` (/cli/local-development).
- Documents list "is not sorted by most recent update" and pages can shift (/cli/documents-ploybooks).
- Several CLI commands appear in the index without documentation (`site pages`, `site versions`, `site check`, `site runtime pull`) (/cli/reference).
- Restricted remote sandboxes must allowlist `https://ploy.ai` (/cli/remote-development).
- Bring-your-own-repo is brittle: exact package name `ploy-web`, pinned majors (Astro 6 only; "A repository on Astro 7 ... can therefore fail with an unrelated-looking `module not found` error"), AST-patched config must use literals, `node:fs` shimmed, lockfile deleted; no public starter template yet (/cli/bring-your-own-repo).
- Behind-your-own-proxy failure modes are silent (forms "show success, but nothing is saved"); bot classification when proxying via custom domain (/custom-domains/behind-your-own-proxy).
- Domain purchase is outsourced to IONOS; Ploy not responsible for renewals (/custom-domains/buy-domain).
- Proxy recipes are provider-specific and fragile (Vercel `DEPLOYMENT_NOT_FOUND` with Host header on; Webflow needs `www2` and default-domain removal; Lovable path-prefix proxying "We don't recommend this method"); "Ploy support can't configure other vendors' projects for you" (/custom-domains/proxy-to-origins/*).
- WordPress plugin cannot serve the homepage; requires a hand-built manifest endpoint and shared secret; paid plan required (/hosting/ploy-connect-wordpress-plugin).
- Credits: unused credits never roll over; Free plan hard-stops after 2,000 lifetime credits; long chats cost more; background schedules and daily project check-ins silently consume credits; per-action credit cost is undocumented (/credits).
- Most CRM/ads/email integrations are Pro-only; Salesforce Enterprise-only; writes are off by default and need owner/admin enablement (/integrations).
- Custom MCP servers "rolling out gradually"; discovery size limit error (/integrations).
- Microsoft Teams: "You chat with Ploy's Agent in Ploy, not inside Teams."
- Webhooks: inbound only, 60 req/min, no Ploy-side retries, JSON only, 128 KB when writing to a table; no signature verification scheme (bearer key only) (/webhooks).
- Audit log is Enterprise-only (/enhanced-security/organization).
- Code Sync repos are Ploy-owned (`ployspace` org) and block third-party GitHub integrations; conflicts between agent edits and external pushes cause "Publishing paused because storage holds newer changes"; "Sandbox is starting" delays (/integrations/code-sync-github).
- MCP: docs do not enumerate tools; changing scopes requires disconnect/reconnect; ChatGPT Pro read-only; workspace API tokens rejected (/mcp).
- SSO is OIDC-only and Enterprise-only; saving the provider requires a passkey; SSO orgs cannot use Ploy in Slack or CLI transfers (/security/sso, /slack).
- Slack app is "rolling out" (/slack).
- Domains: propagation up to 24 hours; Cloudflare 1001/1034 error pages during cutover; removing a domain causes immediate downtime and deletes path routing; non-primary domains lose their routing; desktop browser recommended for setup (/custom-domains).
- Path routing: edge sync can lag or fail ("do not assume visitors are already seeing the new routing"); order-sensitive rules; asset paths must be routed by hand (/routing-rules).
- No self-serve account deletion; workspace cross-org move needs support (/faq).
- Translations are machine-made; CMS content not translated unless asked (/faq).
- Preview connectivity errors ("We're having trouble connecting to your preview") (/faq).
- Documentation gaps relevant to cloning: no documented REST API, no MCP tool list, no credit price list, no description of the chat `view=` modes, analytics endpoints/snippet text hidden behind in-app "Instructions", plan prices only on ploy.ai/pricing.

---

## 20. Complete list of docs page slugs

All slugs are under `https://docs.ploy.ai`. "Last updated" dates are as printed in the dump (all 2026).

| Slug | Section | One-line summary |
|---|---|---|
| /introduction | Getting Started | What Ploy is, building blocks (Agent, Site Builder, Design System, Analytics, Integrations), 5-minute quick start |
| /quick-start | Getting Started | Onboarding wizard questions, goals, design choice, welcome tour, goal chats, first publish, Overview and For you |
| /core-concepts | Getting Started | Glossary, chats, Ploybooks and triggers, hierarchy diagram |
| /agencies | Getting Started | One org + workspace per client vs org per client, parent/child orgs, workspace transfer |
| /tips-and-tricks | Getting Started | 13 prompting/operating habits, 2 gotchas (oversized files, `_acme-challenge`) |
| /working-with-a-team | Getting Started | Org vs workspace, Owner/Admin/Member, invites, workspace-level access, delete workspace, multi-user chats |
| /ploy-chat | Platform | Agent capabilities, site picker, agent profiles, dictation, queueing, Stop, check-backs, attachments |
| /projects | Platform | Projects: tabs, For you, plan board, memory, daily check-in |
| /site-builder | Platform | Stack, design system, voice rules, private pages, compare, page status dots, import, preview editing, versions |
| /effects | Platform | Paper Shaders effects catalog (30), Add an Effect Ploybook |
| /assets | Platform | Library Assets: categories, upload types/limits, sharing |
| /migrate/framer | Platform | 5-step Framer migration, keep the code, what transfers |
| /database/cms-migration | Platform | CMS import into PloyDB: sources, mapping, caveats |
| /analytics | Platform | First-party analytics, dashboards, sources, forwarding, consent/cookies, GA4/GSC, AI answer checks |
| /ai-search-visibility | Platform | AEO: engines checked, tracking Ploybook, agent readiness audit, llms.txt, WebMCP |
| /publishing | Platform | Publish flow, targets, site address, badge, failures, automatic publishing, versions, domains, SSL |
| /ai-gateway | Platform | Model gateway for sites and agent scripts, `ploy.ai.mjs`, `/ploy-ai/` routes, errors, limits |
| /audience | Platform | Overview of Contact Tools + Visitor Identification; email preference categories |
| /cms | Platform | Database-backed blogging, draft/published, other content options |
| /contact-tools | Platform | Email/phone lookup, verification, enrichment, prospect/company search, lookup allowance |
| /database | Platform | PloyDB: concepts, column types, views, CSV, access keys, history/restore, secret columns, limits |
| /database/external-apps | Platform | PloyDB HTTP API for external backends |
| /documents | Platform | Library Docs: search, folders, Reports, @-mention |
| /environment-variables | Platform | Variables vs Secrets, Preview vs Production, .env import, apply on publish |
| /experiments | Platform | Section-level A/B tests: fields, statuses, guardrails, promote/publish, plan limits (gated) |
| /form-submissions | Platform | Submissions tab, notification emails, reply-to behavior |
| /hosting/launch-checklist | Platform | SEO + operations checklist for cutover |
| /hosting/migration-readiness | Platform | Pre-migration checklist: sitemap, redirects, robots, llms.txt, DNS/SSL, alt text |
| /ploy-lite | Platform | When to use Ploy Lite vs Ploy Agent; delegation |
| /ploybooks | Platform | Ploybooks: creation, library templates, scheduling, working memory, webhooks |
| /publishing/content-security-policy | Platform | Allow iframe embedding via `frame-ancestors` middleware on custom domain |
| /visitor-identification | Platform | Visitor ID fields, enrichment credits, workspace limits, consent |
| /visitor-location | Platform | `cf-*` geo headers for personalization, limits |
| /cli | Ploy CLI | CLI overview, quick start, skill install |
| /cli/install | Ploy CLI | Installer, completions, update, analytics opt-out |
| /cli/authentication | Ploy CLI | login, device flow, API tokens, whoami, logout, tokens, rate limits |
| /cli/workspaces-sites | Ploy CLI | workspace/org/site selection, site init/status/publish, domains, routing, Code Sync |
| /cli/workspace-transfers | Ploy CLI | Copying a site between workspaces; cross-org moves via support |
| /cli/variables-secrets | Ploy CLI | variable/secret/env commands and rules |
| /cli/database | Ploy CLI | database/table/column/row commands, filters, CSV export/import |
| /cli/documents-ploybooks | Ploy CLI | documents, ploybook CRUD/edit, schedules (cron) |
| /cli/local-development | Ploy CLI | Code Sync + skills + design-system inspection workflow |
| /cli/remote-development | Ploy CLI | Remote agents and CI with API tokens |
| /cli/reference | Ploy CLI | Global options, env vars, exit codes, command index, visitors, git, MCP, transfer commands |
| /cli/bring-your-own-repo | Ploy CLI | Astro repo/publish contract, Workers runtime rules, migration path |
| /cli/chats | Ploy CLI | `ploy chat` commands |
| /custom-domains/advanced-setup | Hosting | Staged zero-downtime cutover |
| /custom-domains/advanced-setup/checklist | Hosting | 25-step checkable cutover checklist with record values |
| /custom-domains/behind-your-own-proxy | Hosting | Serving Ploy paths behind your own proxy; required paths; Origin header |
| /custom-domains/buy-domain | Hosting | Buying a domain via IONOS from Ploy |
| /custom-domains/dns-setup | Hosting | Exact DNS records generator |
| /custom-domains/domain-visualizer | Hosting | Interactive diagram of traffic split |
| /custom-domains/proxy-to-origins | Hosting | Fallback origin recipes per provider |
| /custom-domains/proxy-to-origins/framer | Hosting | Framer origin URL and routing |
| /custom-domains/proxy-to-origins/lovable | Hosting | Lovable origin URL and routing caveats |
| /custom-domains/proxy-to-origins/webflow | Hosting | Webflow `www2` origin subdomain |
| /hosting/ploy-connect-wordpress-plugin | Hosting | WordPress reverse-proxy plugin and manifest schema |
| /migration-cost-calculator | Hosting | Public migration cost estimator |
| /credits | Account & Billing | Credit types, spend, balance, tiers, billing, auto-reload, referrals, resets |
| /notifications | Account & Billing | Bell, browser/email notifications, workspace emails, email triggers |
| /integrations | Integrations & Trust | Catalog, plan gating, connection management, Ploy MCP, custom MCP servers |
| /security | Integrations & Trust | Encryption, access, infrastructure, privacy, Trust Center |
| /enhanced-security | Integrations & Trust | Overview of account/org security controls |
| /webhooks | Integrations & Trust | Inbound webhooks: endpoint, auth, limits, Ploybook trigger, PloyDB writes |
| /enhanced-security/account | Integrations & Trust | Passkeys and MFA |
| /enhanced-security/organization | Integrations & Trust | Enhanced sign-in enforcement, step-up auth, audit log |
| /integrations/code-sync-github | Integrations & Trust | GitHub Code Sync: repo model, permissions, sync, troubleshooting |
| /mcp | Integrations & Trust | Ploy MCP server: URL, permissions, client setup guides |
| /security/sso | Integrations & Trust | OIDC SSO setup (Enterprise) |
| /slack | Integrations & Trust | Ploy in Slack: connect, chat, approvals, publish card |
| /custom-domains | Support | Domain allowances, Domains page, add/move/remove, SSL, troubleshooting |
| /routing-rules | Support | Reverse proxy and Path routing |
| /faq | Support | Help & support, access, domains, publishing, agent, integrations, migration FAQs |

Total: 73 pages (matches the docs index `d_docs.ploy.ai_llms.txt`). Marketing-site index `f_llms.txt` adds: product pages (`ploy.ai/pricing`, `/ploybooks`, `/features/answer-engine-optimization`, `/features/ai-website-builder`, `/features/analytics`, `/features/visitor-identification`, `/features/account-based-marketing`, `/features/ploy-ads`, `/features/ploy-grow`, `/features/hosting`), audience pages (`/for/startups`, `/startups`, `/for/agencies`, `/for/enterprise`), comparison pages (`/alternatives`, `/vs/framer`, `/vs/webflow`, `/vs/webflow-campaigns`, `/vs/vercel`, `/vs/sanity`, `/vs/v0`, `/vs/lovable`, `/vs/bolt`, `/vs/claude`), about 200 blog/library posts, and tools (`/agent-tools/search`, `/mcp`, `/cli`, `github.com/Ploy-AI/ploy-tools`, `/agent-tools/openapi.json`).
