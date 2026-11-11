# Deploy (internal)

Prepared with AI assistance.

An internal tool that watches the websites we own and ships fixes as pull requests after approval. It runs entirely on our Cloudflare account: one Worker with static assets, a D1 database and a cron trigger, behind Cloudflare Access. No custom domain. Specs live in `../docs/deploy/`. This folder is self-contained so it can move to its own private repository.

## State

| Piece | State |
| --- | --- |
| D1 database `deploy-internal` | Created on the account, schema applied, three sites seeded, none verified |
| Worker `deploy-internal` | Deployed 2026-11-11 from `api-upload/worker.js` at `https://deploy-internal.brevardbidderai.workers.dev`, cron every 5 minutes |
| Cloudflare Access | Application "Deploy (internal)" in front of the hostname, policy "Owner only". An unauthenticated request to `/` and to `/api/sites` lands on the Access sign-in page. The signed-in experience has not been checked yet |
| App shell: Home and Settings | Built, responsive, light and dark |
| `GET /api/sites`, `GET /api/findings` | Working against D1 in a local run; not yet exercised on the deployed Worker behind Access |
| `GET /api/sites/{id}/token`, `POST /api/sites/{id}/verify` | Working; DNS TXT, file and meta tag proofs |
| Uptime cron, every 5 minutes | Written; skips unverified sites; one deduplicated finding per outage |
| Tests | 22 passing, typecheck clean |

Not built yet: everything from the crawl job onward in `../docs/deploy/CHECKPOINTS.md`.

## Deploy it

With wrangler (assets served separately, the normal path):

```bash
npm install
npm test && npm run typecheck
npx wrangler login          # or set CLOUDFLARE_API_TOKEN
npm run deploy              # astro build && wrangler deploy
```

Through the Cloudflare API without wrangler: `npm run bundle` writes `api-upload/worker.js`, a single module with both pages embedded, which can be uploaded as the Worker script with the `DB` binding and the two Access variables.

Sign-in is the Cloudflare Access application "Deploy (internal)" on `deploy-internal.brevardbidderai.workers.dev`, policy "Owner only". Add people by editing that policy in Zero Trust, Access, Applications. Its team domain and AUD tag are in `wrangler.jsonc`; neither is a secret.

To verify a site: open Settings in the app, press "Show proof", publish the proof (DNS TXT at `_deploy-verify.<hostname>`, a file at `/.well-known/deploy-verify.txt`, or a meta tag), then "Check now".

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
