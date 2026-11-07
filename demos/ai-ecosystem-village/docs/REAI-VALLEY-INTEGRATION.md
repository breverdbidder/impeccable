# REAI Valley: joining the two builds

Written 2026-11-07 for the two Claude sessions and the owner. Two builds exist:

| Build | Where | What it is | State |
|---|---|---|---|
| Playable game | Claude Project, saved under `reai-valley/` (23 files); target repo `breverdbidder/reai-valley` | Phaser 4 16-bit village, custom turn engine, 24-square board walking The Everest Ascent, 12 real Brevard lots from `multi_county_auctions`, two bot bidders, Deed narration, SIGNAL$ report link | Playable, 6 rules tests pass, 200 bot games finish, blocked on repo creation |
| Ecosystem village | this repo, `demos/ai-ecosystem-village/` | Vanilla canvas 32-bit village: three brand hubs, A* couriers carrying data packets, mock dialogue layer, day and night, ledger and log; impeccable design system (PRODUCT.md, DESIGN.md, surface brief) | Shipped on branch `ccr-300d527f-6yr3hp`, reviewed |

Decision: **the Phaser game is the engine.** It has rules, tests, real data and a revenue hook. The canvas village stops growing as a separate product. It contributes three things to the game, listed below, and then stays as the one-minute explainer for investors.

## What the canvas build hands over

1. **The industry chain as the map.** Four districts along a deal-timeline boulevard, each anchored by the brand that owns that stage, each holding leased trade plots. `registry/trades.json` defines the 16 trades, their stage, their Everest Ascent stage numbers, and the sign glyph. In the game this is the second layer of the board: the 24 squares stay, and the village around them gains the districts and plots.
2. **The vendor marketplace.** County-scoped plots, one vendor per trade per county, lit when leased and dark with a "For lease" board when not. `registry/vendors.json` holds synthetic Brevard and Orange vendors, labeled synthetic. The data model in `registry/supabase-schema.sql` is the proposed home in the shared Supabase project once the owner approves new tables.
3. **The buyer journey.** When a player or bot wins a lot, a buyer walks the chain and is matched to one vendor per needed trade, chosen from the lot's own columns (`is_vacant_land`, `property_type`, `year_built`, `beds`, `baths`). Trades with no vendor count as unmet demand, which is the sales list for plot leases. Rules in `registry/journey.json`.

Also handed over: the design system. `DESIGN.md` and `.impeccable/design.json` in this directory record the pixel grid, the two faces (Press Start 2P and VT323, embedded), the JRPG status window, the cabinet button, the three brand neons, amber as the one state color. The game's HUD and dialogue windows should take these tokens so both builds read as one product. Brand sites keep their own identity: zonewise-web is `#1B2737` / `#1A90FF` / Inter and that stays untouched.

## Where zonewise.ai Studio and Explorer plug in

zonewise-web today ships, under `app/(dashboard)/`: **Explorer** (parcel map with zoning overlay, the land-scouting surface), **Feasibility**, **Floor Plans**, **Studio Design** (upload a plan, redesign it in conversation, live drawing, room schedule, FF&E), **Massing** (isometric 3D), **Pro Forma**. The Studio AI already reaches two MCP servers through the API connector: zonewise's own (zoning, parcels, ArchLang floor plans) and BidDeed's "Ask Deed" specialists (property data, title, rehab, insurance, financing), with money and outbound actions blocked by name pattern (`lib/studio/mcp.ts`).

So the valley is wider than auctions in exactly this way: a visitor can **scout** land (Explorer), **design** the home for it (Studio), and **buy** it (BidDeed auctions), and every trade that serves those three steps is a plot. In the game:

- The Due Diligence district's zonewise.ai hub opens Explorer for the current lot: `https://zonewise.ai/explorer?parcel=<parcel_id>` (confirm the query key against `components/explorer/ExplorerLoader.tsx` before shipping; the parcel route is `app/(dashboard)/parcel/[id]`).
- The Build district's architect plot opens Studio: `https://zonewise.ai/studio` carrying the lot's footprint when the Studio plan schema (`lib/studio/types.ts`, inches, envelope plus spaces plus openings) can accept a seed; until then a plain link.
- The Acquisition district's BidDeed.AI hub keeps the SIGNAL$ link the game already has.
- winnerdataai.com anchors Hold and Exit with the ML score and clearing-price prediction (stages 7 and 9).

These are reads, never transactions, matching the Studio tool policy.

## Data

One Supabase project for everything, as zonewise-web's INFRASTRUCTURE.md already rules: `mocerqjnksmhcjzxrewo`. `multi_county_auctions` is the lot source and is read-only (the other session already respected this, including the "SATALITE BEACH" spelling defect left as recorded). The real columns to use are the ones declared at the bottom of `types/auctions.ts` in zonewise-web: `sale_type`, `latitude`, `longitude`, `living_area_sqft`, `lot_size`, `beds`, `baths`, `sqft`, `city`, `zip`, `property_type`, `auction_status`, `auction_url`, plus `case_number`, `parcel_id`, `county`, `auction_date`, `assessed_value`, `opening_bid`, `is_vacant_land`, `year_built`. Several legacy fields in that type are not columns and come back undefined.

Five tables now exist on that project (migration `reai_valley_marketplace`, applied 2026-11-07 under the owner's standing rule that non-destructive CREATE TABLE needs no sign-off): `valley_vendors`, `valley_plots`, `valley_leases`, `valley_buyers`, `valley_matches`, all with row-level security and public read policies; writes go through the service role. `registry/seed.sql` loaded 32 plots (16 trades times two counties), 21 synthetic vendors flagged `synthetic = true`, and 21 leases. The game reads leases from these tables instead of `vendors.json`.

Verified against the live table on the same day: `multi_county_auctions.id` is a uuid; there is no `is_vacant_land` column; `property_type` is null on 332,463 rows; `county` is stored lowercase (`brevard`, `orange`); `sale_type` is `foreclosure` or `tax_deed`; `auction_status` values are lowercase (`sold`, `upcoming`, `redeemed`, and others). `journey.json` version 2 is written against those facts and tags each rule VERIFIED or INFERRED.

## Owner actions, in order

1. Create the private repo `breverdbidder/reai-valley` (both sessions get 403 on repo creation; this session is also barred from the create-repository tool). The game session then pushes its 23 files and connects Cloudflare Workers Builds, which needs one Cloudflare login.
2. Done without you, per your Supabase rules: the valley tables are live and seeded. Reversing it is a DROP, which does need you.
3. Allow `zonewise.ai` and `biddeed.ai` in this session's network settings if this session should verify live routes; they do not resolve here today.
4. Pick the marketing connector: the MCP registry lists an official "TikTok for Business" connector (campaign create, manage, analyze) plus Supermetrics, Adspirer Social Ads and AdWhispr. It is connected from claude.ai connector settings, not from a session.

## Merge plan for the game session

1. Copy `registry/` from this directory into `reai-valley/data/` and `DESIGN.md` plus `.impeccable/design.json` into the repo root.
2. Add the four districts around the existing board; place plots from `trades.json`; read leases from `valley_leases` joined to `valley_vendors` and `valley_plots` (anon key, read policies are on), with `vendors.json` as the offline fallback.
3. On lot purchase, run `journey.json` against the lot row to produce the buyer's needs; walk the buyer; record matches and unmet demand; show both in the end screen next to the SIGNAL$ link.
4. Deep-link the zonewise.ai hubs as above.
5. Keep this canvas page as `docs/explainer/` or link to it from the game's About screen.
