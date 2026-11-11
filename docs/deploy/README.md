# Deploy: Ploy teardown and build pack

Prepared with AI assistance, 2026-11-11.

Deploy is our internal counterpart of Ploy (ploy.ai): an agent that watches the websites we own, reports what changed and ships fixes as pull requests after approval. This folder holds the reverse engineering of Ploy and everything needed to start the build.

| Read | For |
| --- | --- |
| [REVERSE-ENGINEERING-REPORT-V7.md](REVERSE-ENGINEERING-REPORT-V7.md) | What Ploy is, battle card, sitemap, API endpoints, technology stack, design system, open items |
| [PRD.md](PRD.md) | What Deploy must do and why |
| [PRS.md](PRS.md) | How: architecture, schema, API, jobs, agent graph, security, tests |
| [CHECKPOINTS.md](CHECKPOINTS.md) | The build in 41 checkpoints with exit tests and four gates |
| [META-PROMPT.md](META-PROMPT.md) | The prompt that drives the build session by session |
| [replica/recon.md](replica/recon.md) | Recon map in replica-skill format: screens, flows, components, data model |
| [replica/features.csv](replica/features.csv) | Feature matrix, the parity contract (99 rows) |
| [replica/SCREENS.md](replica/SCREENS.md) | Index of 129 Playwright screenshots of Ploy's public pages and tab states |
| [wireframes/](wireframes/) | 11 low-fidelity Deploy wireframes (SVG) and their generator |
| [evidence/](evidence/) | Raw captures: sitemap URLs, MCP card, OAuth metadata, OpenAPI, per-page capture, docs digest, capture scripts |

## What is and is not covered

- Covered: Ploy's whole public site and docs, its published machine interfaces, and the logged-in app as its docs describe it.
- Not covered: screenshots of the logged-in app, including the gallery view. That needs the owner's session; `META-PROMPT.md` step 0 explains how to add it.
- REA was applied as a method (passive observation, evidence per claim). Its CLI did not run in the capture environment. replica-skill's recon rules and `parity.py` were used directly.

## Rules that carry into the build

1. Deploy monitors only sites that pass ownership verification.
2. Clean room: behaviour is rebuilt, nothing Ploy owns is copied. `replica/screens/` is reference only.
3. Publishing is a separate permission and needs a human approval.

## Regenerating

```bash
python3 docs/deploy/wireframes/generate.py                 # wireframes
node docs/deploy/evidence/shoot.js <urls.txt> <shots> <text> <meta.json>   # screenshots (needs Playwright + Chromium)
python3 <replica-skill>/replica-diff/parity.py docs/deploy/replica/features.csv
```
