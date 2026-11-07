# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: single-file static HTML, CSS, and vanilla JavaScript on an HTML5 canvas, as the brief's foundational codebase prescribes. No bundler, no framework, deployable to Cloudflare Pages as a static asset.

## Users

(Inferred from the brief.) Ariel Shapira, solo founder of Everest Capital USA / BidDeed.AI, and the people he shows the ecosystem to: prospective partners, investors, and collaborators who need to grasp in under a minute that BidDeed.AI, zonewise.ai, and winnerdataai.com are one agentic AI ecosystem exchanging data, not three unrelated SaaS tools. The scene is a laptop or phone screen during a demo or embedded on a site, watched for one to three minutes.

## Product Purpose

A living, self-running simulation: a retro 32-bit top-down village where autonomous agents carry data packets between the three brand hubs. It exists to make the ecosystem thesis visible and memorable. Success is a viewer who can retell which hub produces what and who consumes it after watching.

## Positioning

The village dramatizes the real data flow of the ecosystem: winning-auction metrics and zoning intelligence feed bid decisions, and bid outcomes flow back as new data. The mechanism a neighboring demo could not copy is this specific three-way exchange rendered as a digital economy, with deals closing on screen when BidDeed.AI holds both inputs.

## Operating Context

Runs in any modern browser from a single `index.html`. 800x600 logical resolution, scaled to the container. No backend; a mock-data layer stands in for agent dialogue, with a documented hook for a future LLM backend (Checkpoint 5 of the brief).

## Capabilities and Constraints

- Three hubs with fixed identities: BidDeed.AI (real estate, bidding, transactions), zonewise.ai (zoning, mapping, spatial data), winnerdataai.com (data analytics, processing, winning metrics).
- Agents navigate only on paths (A* over a tile grid), carry visible glowing packets, pause to work inside hubs, and talk in short bubbles.
- Pixel-art tiles, buildings, and sprites are drawn procedurally in code; there are no external image assets and none may be fabricated as "real" brand assets.
- Undecided: whether the page is embedded in a brand site or stands alone; whether the future dialogue backend is an LLM or scripted.

## Brand Commitments

- Names are written exactly as the brief has them: `BidDeed.AI`, `zonewise.ai`, `winnerdataai.com`.
- The brief pins the visual world: 32-bit style top-down RPG village, lush green landscape, dirt paths, water features, neon sign animations on the hubs. Honor it; do not redirect toward another aesthetic.
- Hub hue families from the brief's codebase: blue for BidDeed.AI, teal/green for zonewise.ai, purple for winnerdataai.com.

## Evidence on Hand

Only the brief and its foundational `index.html`. No logos, screenshots, metrics, customer names, or pricing exist here. Dialogue, parcel IDs, counties, and dollar figures in the simulation are synthetic demonstration data and are labeled as such in the UI.

## Product Principles

1. The flow is the message: every visual choice should make "who sends what to whom" legible at a glance.
2. Alive, never busy: motion and chatter are paced so the eye can rest and read.
3. Honest demo data: synthetic values are labeled; no invented commercial claims.
4. Single file, zero dependencies at runtime beyond fonts; it must run from a local file open.
5. Extensible by contract: agents, hubs, and the dialogue source are plain data a future backend can replace.
