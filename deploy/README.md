# Deploy (internal)

Prepared with AI assistance.

An internal tool that watches the websites we own and ships fixes as pull requests after approval. Specs live in `../docs/deploy/`. This folder is self-contained so it can move to its own private repository.

## What works today

| Piece | State |
| --- | --- |
| App shell: Home and Settings | Built, static, responsive, light and dark |
| `GET /api/sites` | Reads Supabase when connected, otherwise the seed list in `sites.config.json` |
| `POST /api/sites/{id}/verify` | Checks DNS TXT, file and meta tag proofs; needs Supabase |
| Cloudflare Access check on every `/api` request | Implemented, fails closed |
| Host gate `assertVerifiedHost` | Implemented; exact host match, https only |
| Migration `supabase/migrations/0001_foundation.sql` | Written, not applied |
| `jobs/uptime.mjs` | Written; skips unverified sites; not yet run against a database |
| Tests | 16 passing (`npm test`), typecheck clean, build clean |

Not built yet: everything from CP-14 onward in `../docs/deploy/CHECKPOINTS.md`.

## Run locally

```bash
npm install
npm test && npm run typecheck && npm run build
npx wrangler pages dev dist        # serves the shell and functions; add DEPLOY_DEV=1 in .dev.vars
```

## Put it on Cloudflare

No custom domain. One Pages project on its `pages.dev` hostname, behind Cloudflare Access.

1. Pages: create project `deploy-internal`. Build command `npm run build`, output `dist`, root directory `deploy` (or the repo root once this folder has its own repository).
2. Zero Trust, Access, Applications: add a self-hosted application for the project's hostname, including preview hostnames. Policy: allow only the listed emails. Copy the Application Audience (AUD) tag.
3. Pages project variables (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `ACCESS_TEAM_DOMAIN` | `<team>.cloudflareaccess.com` |
   | `ACCESS_AUD` | the AUD tag from step 2 |
   | `SUPABASE_URL` | project URL (after the migration is applied) |
   | `SUPABASE_SERVICE_ROLE_KEY` | as an encrypted secret |

4. Apply `supabase/migrations/0001_foundation.sql` to a Supabase project.
5. For each site, read its token from `sites.verify_token`, publish one proof (see Settings in the app), and press "Check now".

Without step 3 the API answers 401 for every request. That is intended.

## Rules in code

- Nothing fetches a site unless `assertVerifiedHost` passes. `verifyOwnership` is the one exception and reads three fixed locations.
- The database refuses checks and findings for unverified sites, refuses spend past the monthly cap, and refuses changes to the audit log.
- Never set `DEPLOY_DEV=1` on Cloudflare.
