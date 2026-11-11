# Deploy (internal)

Prepared with AI assistance.

An internal tool that watches the websites we own and ships fixes as pull requests after approval. It runs entirely on our Cloudflare account: one Worker with static assets, a D1 database and a cron trigger, behind Cloudflare Access. No custom domain. Specs live in `../docs/deploy/`. This folder is self-contained so it can move to its own private repository.

## State

| Piece | State |
| --- | --- |
| D1 database `deploy-internal` | Created on the account, schema applied, three sites seeded, none verified |
| Worker `deploy-internal` | Code complete; `wrangler deploy --dry-run` passes; **not deployed** |
| Cloudflare Access | Token check implemented and fails closed; **Access application not created** |
| App shell: Home and Settings | Built, responsive, light and dark |
| `GET /api/sites`, `GET /api/findings` | Working against D1 (local run) |
| `GET /api/sites/{id}/token`, `POST /api/sites/{id}/verify` | Working; DNS TXT, file and meta tag proofs |
| Uptime cron, every 5 minutes | Written; skips unverified sites; one deduplicated finding per outage |
| Tests | 22 passing, typecheck clean |

Not built yet: everything from the crawl job onward in `../docs/deploy/CHECKPOINTS.md`.

## Deploy it

```bash
npm install
npm test && npm run typecheck
npx wrangler login          # or set CLOUDFLARE_API_TOKEN
npm run deploy              # astro build && wrangler deploy
```

Then, in the Cloudflare dashboard:

1. Workers, `deploy-internal`, Settings, Domains and Routes: turn on **Cloudflare Access** for the `workers.dev` hostname. Set the policy to allow only our email addresses.
2. Copy the team domain and the application's AUD tag into the Worker's variables: `ACCESS_TEAM_DOMAIN` (`<team>.cloudflareaccess.com`) and `ACCESS_AUD`.
3. Open the app, go to Settings, press "Show proof" for a site, publish the proof (DNS TXT at `_deploy-verify.<hostname>`, a file at `/.well-known/deploy-verify.txt`, or a meta tag), then "Check now".

Until step 2 is done the API answers 401 to every request. That is intended.

## Run locally

```bash
echo 'DEPLOY_DEV=1' > .dev.vars
npx wrangler d1 execute deploy-internal --local --file migrations/0001_foundation.sql
npm run dev:worker
```

Never set `DEPLOY_DEV` on Cloudflare: it turns the Access check off.

## Rules in code

- Nothing fetches a site unless `assertVerifiedHost` passes (exact host, https only). `verifyOwnership` is the one exception and reads three fixed locations.
- The database refuses checks and findings for unverified sites, refuses spend past the monthly cap ($100 default), and refuses changes to the audit log.
- Proof tokens never appear in the site list; reading one is audited.
