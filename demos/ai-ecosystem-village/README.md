# Silicon Valley AI Ecosystem Village

A single-file, 32-bit style top-down village where fifteen autonomous agents carry data packets between three hubs: BidDeed.AI, zonewise.ai, and winnerdataai.com. Open `index.html` in a browser; there is no build step and no runtime dependency beyond two web fonts (the page falls back to Courier New offline).

## Checkpoint status

| Checkpoint | Status |
|---|---|
| 1. Canvas engine, 800x600 coordinate system, scalable | Done. The world renders at 400x300 and is scaled 2x with smoothing off, so every world pixel is a crisp 2x2 block. CSS scales the canvas to its container. |
| 1. Pixel-art tilemaps (grass, dirt paths, water) | Done. A seeded 40x30 tile map with grass variants, bordered dirt roads, a paved plaza, an animated pond with a sand rim, a dock, trees, bushes, flowers, and street lamps. |
| 3. Three hubs with labels | Done. |
| 3. Pixel-art tech-hub buildings and neon sign animations | Done. Each hub has a roof with a solar array, a brand glyph, rooftop units, a blinking antenna, windows that light as agents work inside, and a door that opens on entry and exit. The sign pulses, flickers, and blooms at dusk. |
| 4. Agents with a state machine | Done. IDLE, WALKING, WORKING, plus a wander trip between deliveries. |
| 4. A* pathfinding on paths, carrying animations | Done. Agents route over walkable tiles only, with a per-agent cost jitter that spreads traffic across the two-tile roads. A packet glows above the courier in the source hub's color and trails sparks. |
| 5. Chat bubbles from a mock-data layer | Done. `Ecosystem.say()` fills templates for pickups, deliveries, greetings, wandering, and closed deals. A future backend plugs in with `window.VILLAGE.Ecosystem.connectBackend(async ctx => "line")`; it is given `{ agent, role, home, kind, hub, cargo }` and gets 1.5 seconds before the page falls back to a template. |

## What the simulation does

- Each hub produces one packet type: bid recommendations, zoning overlays, winning metrics. An agent leaving a hub carries that hub's packet to another hub. Metrics and zoning flow mostly to BidDeed.AI; bids flow back out.
- When BidDeed.AI holds at least one zoning packet and one metrics packet, a deal closes: the building flares, the ticker logs the parcel and amount, and the courier announces it.
- A day lasts 150 seconds. The page pre-simulates about 50 seconds on load so the village is already busy, with dusk arriving roughly a minute in.
- Click an agent or a building to open the inspector window. Space pauses, N holds night, Escape deselects. The control deck toggles speed and an optional CRT scanline overlay.
- The exchange ledger and network log below the screen are the same data the HUD shows, laid out for reading.

All parcel IDs, counties, zoning codes, and dollar figures are synthetic demo data and the page says so.

## Design process

Built with the `impeccable` skill: PRODUCT.md records product truth (inferred from the brief, inferences labeled), `.impeccable/surfaces/index-html.md` holds the direction contract, and DESIGN.md records the shipped visual system. Screenshots used for review live under `.impeccable/review/` and are not tracked.
