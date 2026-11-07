---
name: Silicon Valley AI Ecosystem Village
description: A dusk festival village on an arcade CRT, where three brand hubs trade lit packets under neon signs.
colors:
  cabinet: "#0b0c1e"
  cabinet-2: "#15173a"
  bezel: "#1c1e3f"
  bezel-edge: "#2c2f5c"
  bezel-dark: "#0a0b19"
  ink: "#eef0ff"
  ink-soft: "#a9afd6"
  ink-dim: "#9298c2"
  line: "#2a2d55"
  button-face: "#23264d"
  button-edge: "#3b3f78"
  log-well: "#0d0f26"
  window-fill: "rgba(12, 14, 40, 0.92)"
  biddeed: "#38bdf8"
  zonewise: "#34d399"
  winner: "#c084fc"
  amber: "#ffd166"
  marquee-ink: "#ffffff"
  screen-void: "#000000"
  button-edge-on: "#6a5a2a"
  grass: "#2f6b2a"
  dirt: "#8a6a45"
  sand: "#d8c38a"
  water: "#2d6fb3"
  plaza-stone: "#777f91"
  biddeed-wall: "#174b74"
  biddeed-roof: "#2a86c4"
  biddeed-trim: "#63b4ea"
  zonewise-wall: "#145c4e"
  zonewise-roof: "#2a9d8f"
  zonewise-trim: "#6fd3c3"
  winner-wall: "#4a1a78"
  winner-roof: "#7a2fb8"
  winner-trim: "#b57ae6"
typography:
  display:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "clamp(14px, 4.2vw, 22px)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1
  label:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.04em"
  label-small:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "8px"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "'VT323', 'Courier New', monospace"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.4
  body-small:
    fontFamily: "'VT323', 'Courier New', monospace"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "'VT323', 'Courier New', monospace"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
  body-phone:
    fontFamily: "'VT323', 'Courier New', monospace"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: "0px"
spacing:
  xs: "2px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "28px"
components:
  button-cabinet:
    backgroundColor: "{colors.button-face}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 14px 11px"
  button-cabinet-hover:
    backgroundColor: "#2b2f5e"
    textColor: "{colors.ink}"
  button-cabinet-pressed:
    backgroundColor: "#1b1d3e"
    textColor: "{colors.amber}"
  status-window:
    backgroundColor: "{colors.window-fill}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px"
  log-panel:
    backgroundColor: "{colors.log-well}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
  kbd-key:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "0 5px"
---

# Design System: Silicon Valley AI Ecosystem Village

## Overview

**Creative North Star: "The Dusk Festival Cabinet"**

One village, one economy, watched through an arcade cabinet at dusk. The page is a cabinet: a deep indigo body, a flat-banded bezel, and a 4:3 CRT inside it where a saturated 32-bit village runs on its own. Everything outside the screen recedes into cabinet furniture (marquee, control deck, ledger, log) so the living artifact leads. The world renders at 400x300 and is blown up 2x with smoothing off, so every world pixel is a crisp 2x2 block; the overlay layer (signs, status windows, bubbles) draws at full resolution on even pixel coordinates so its grid never fights the world's.

The neon signs are the hero. A 150-second day cycle exists so that dusk can arrive, ambient light fall, and the three hub signs ignite one after another with a short stutter before settling into a slow breathing glow. Day is a lush pastoral; night is lanterns, window light, and three neon names over a dimmed village. The interface never competes with that moment: pulse belongs to neon only, the HTML chrome never fades sections, and the one motion it owns is a new log row sliding into place.

Density is readable, not busy. The HTML deck uses a bitmap pixel face for anything that names or labels, and a tall terminal face for anything you read in sentences; both are monospaced, so numbers line up without effort. There are no rounded corners anywhere, no gradients on components, no icon glyph fonts: every icon is a 7x7 bitmap drawn in code.

**Key Characteristics:**
- Cabinet-around-CRT composition: indigo body, flat 4px/8px bezel bands, square corners throughout.
- Three brand neons (sky blue, mint, violet) carry identity on canvas and in HTML alike; amber is the only non-brand accent and means "state" (pressed, selected, deals, paused).
- Press Start 2P for every name and label; VT323 for every sentence; nothing else.
- JRPG status windows (navy fill, 2px light border, 2px highlight line) for every in-canvas readout and bubble.
- Motion is scarce and diegetic: neon ignition and breathing, bobbing packets, a 350ms log-row entry. No section fades, no parallax, no hover lifts.

## Colors

A deep indigo cabinet holds a saturated daylight village; three brand neons and one amber are the only voices allowed to glow.

### Primary
- **BidDeed Sky** (`{colors.biddeed}`): BidDeed.AI's neon, its bid-packet color, its brand span in the marquee, the `::selection` highlight and the marquee's tube glow. The first hub to ignite at dusk.
- **Zonewise Mint** (`{colors.zonewise}`): zonewise.ai's neon and zoning-packet color; the garden-roof hub's sign and its row in the ledger.
- **Winner Violet** (`{colors.winner}`): winnerdataai.com's neon and metrics-packet color; the server-roof hub's sign and its ledger row.

Each hub has a matching building family: a dark **wall**, a brighter **roof**, and a pale **trim** (`biddeed-wall/roof/trim`, `zonewise-wall/roof/trim`, `winner-wall/roof/trim`). The neon is always the lightest, most saturated member of the family, so the sign reads above its own building.

### Secondary
- **Cabinet Amber** (`{colors.amber}`): the state color. Pressed cabinet buttons, the focus ring, the "Inside" counts, deal counters, the `PAUSED` window, the selected-agent outline, the daytime sun glyph, and lit window spill on hub roofs at night. Never a brand color, never decoration.

### Neutral
- **Cabinet** (`{colors.cabinet}`) and **Cabinet Upper** (`{colors.cabinet-2}`): page body, running as a vertical gradient from the upper tone to the lower one over the first 480px.
- **Bezel** (`{colors.bezel}`), **Bezel Edge** (`{colors.bezel-edge}`), **Bezel Dark** (`{colors.bezel-dark}`): the three flat bands framing the screen.
- **Ink** (`{colors.ink}`): primary text, counters, body copy in windows.
- **Ink Soft** (`{colors.ink-soft}`): secondary text, section headings, marquee subtitle, `kbd` keys, inspector detail lines.
- **Ink Dim** (`{colors.ink-dim}`): tertiary text, table headers, timestamps, hints, the synthetic-data note.
- **Line** (`{colors.line}`): 1px table rules, the 2px log border, `kbd` borders.
- **Button Face** (`{colors.button-face}`) and **Button Edge** (`{colors.button-edge}`): the cabinet button body and its border; the edge tone also serves as the log scrollbar thumb.
- **Log Well** (`{colors.log-well}`): the network log's recessed background and scrollbar track.
- **Window Fill** (`{colors.window-fill}`): the translucent navy behind every in-canvas status window and bubble.

### World palette (canvas)
- **Grass** (`{colors.grass}`): the ground, dithered between three near tones (`#327030`, `#2b6427`) with light and dark speckle (`#3c7f36`, `#255a20`); also the canvas CSS background so the frame never flashes black.
- **Dirt** (`{colors.dirt}`): roads, with an edge shade (`#73573a`) and pebble highlight (`#a68a60`); grass creeps over the outermost pixel row of every road edge.
- **Sand** (`{colors.sand}`): the pond shore, with a wet rim (`#c4ad73`), ragged on the grass side.
- **Water** (`{colors.water}`): the pond, alternating with `#2b6aad` and rimmed in `#1e4f8c`.
- **Plaza Stone** (`{colors.plaza-stone}`): cobbles with gap (`#5b6273`) and highlight (`#9aa3b5`) tones; the core around the monument is one step darker (`#646c7e`).
- Night is a single wash: `rgba(10, 12, 48, night * 0.62)` over the world before lights draw on top.

### Named Rules
**The Three Neons Rule.** Only the three hub colors and amber may glow, pulse, or cast light. Everything else in the palette is flat and matte, including the cabinet, the bezel, and every HTML control.

**The Amber Means State Rule.** Amber is never a brand and never decoration. If something is amber, it is pressed, selected, paused, focused, or a closed deal.

**The Family Reads Upward Rule.** For each hub, wall is darkest, roof brighter, trim pale, neon brightest. A new hub-colored element picks from that family and keeps that order.

## Typography

**Display Font:** Press Start 2P (with Courier New, monospace)
**Body Font:** VT323 (with Courier New, monospace)

Both fonts ship embedded as base64 woff2 latin subsets so the page keeps its voice from a local file open. Both are monospaced bitmap-era faces, so tabular numbers come free and nothing needs kerning.

**Character:** A pixel marquee face for anything that names or labels, and a tall CRT terminal face for anything you read. The pairing is loud at 8 to 22px and quiet by never using weight: there is one weight (400) in the whole system; hierarchy comes from face, size, and color.

### Hierarchy
- **Display** (Press Start 2P, `clamp(14px, 4.2vw, 22px)`, line-height 1.6, 0.02em tracking): the marquee `h1` only, white with a sky-blue tube glow, capped at 24ch and balanced.
- **Headline** (Press Start 2P, 16px, line-height 1): on-canvas counters, the clock, hub neon signs, the `PAUSED` word. Pixel-grid aligned (16px is 2x the font's native 8px).
- **Title** (Press Start 2P, 14px): the deal totals (`Deals closed`, `Volume`, `In transit`) in the ledger footer.
- **Label** (Press Start 2P, 12px, 0.04em tracking on headings): cabinet button text, section headings (`Exchange ledger`, `Network log`), hub names in the ledger (line-height 1.5).
- **Label Small** (Press Start 2P, 8px, uppercase): on-canvas HUD captions (`IN TRANSIT`, `DEALS`). Native pixel size of the face; never scale it to 9, 10 or 11.
- **Body** (VT323, 20px, line-height 1.4): page body, marquee subtitle, ledger cells, log rows, canvas bubbles and inspector lines. Drops to 19px under 760px. The marquee subtitle is capped at 70ch.
- **Body Small** (VT323, 18px): hub "produces" lines, the keyboard hint.
- **Caption** (VT323, 17px): table headers, `kbd` keys, the synthetic-data note.

### Named Rules
**The Two Faces Rule.** Press Start 2P names and labels; VT323 reads. No third face, no bold, no italic. A new label is 8, 12, 14 or 16px pixel face; a new sentence is 17, 18 or 20px terminal face.

**The Pixel Grid Rule.** On canvas, the pixel face is drawn only at 8px or 16px (times the `ui` multiplier) and windows snap to even coordinates, so the font's grid lands on whole 2x2 world pixels.

## Layout

A single centered column, `min(1080px, 100%)` wide, with the screen capped at `min(800px, 100%)` inside it. Body padding is 28px 16px 56px on desktop and 18px 12px 40px under 760px. Vertical order is fixed by the cabinet metaphor: marquee (22px below), screen (8px above), control deck (30px above), ticker.

The canvas is 800x600 logical pixels at a locked 4:3 aspect, scaled to the container width, rendered at up to 2x device pixel ratio with image smoothing off (`image-rendering: pixelated`). Inside it, the world grid is 40x30 tiles of 10 world pixels each.

The control deck is a two-column grid, `minmax(220px, 300px) 1fr`, with an 18px row gap and 28px column gap: controls left, ledger right, the ticker spanning both columns beneath. Under 760px the deck collapses to a single column with a 16px gap, the ledger hides its "Produces" column, and numeric columns tighten from 72px to 60px.

On-canvas layout: clock window top-left at 10px inset, economy window top-right, inspector window bottom-left, `PAUSED` centered. When the rendered canvas is narrower than 560px, every overlay dimension and font doubles (`ui = 2`) so the HUD stays legible on a phone, and the economy window drops to the bottom-right and yields to the inspector when something is selected.

Spacing steps observed: 2px (highlight lines, borders), 8px (heading margin, screen top margin), 10px (control gap, inset), 12px (button and window padding), 14px (log padding), 18px (grid row gap, deals gap), 28px (grid column gap, body padding), 30px (deck top margin).

## Elevation & Depth

Depth is structural, not atmospheric. The bezel is three flat concentric bands (`0 0 0 4px bezel-edge, 0 0 0 8px bezel-dark`) with one deep drop shadow beneath the whole cabinet screen (`0 26px 40px -14px rgba(0,0,0,.9)`, tightening to `0 18px 30px -12px` under 760px). No HTML component other than the screen casts a shadow. Buttons convey depth with a thicker lower border (5px at rest, 2px when pressed, with a 3px translateY), the way a cabinet button physically travels. The log is a recessed well: a darker fill inside a 2px `line` border. On canvas, status windows are translucent navy with a 2px border and a 2px white highlight under the top edge; they sit above the world without shadows.

Glow is the one soft effect and it is reserved for neon: the marquee title's tube shadow and the hub signs' `shadowBlur` halo, plus radial light pools from lamps, windows and carried packets at night.

### Shadow Vocabulary
- **Bezel bands** (`box-shadow: 0 0 0 4px #2c2f5c, 0 0 0 8px #0a0b19, 0 26px 40px -14px rgba(0,0,0,.9)`): the screen frame only.
- **Marquee tube** (`text-shadow: 0 0 2px #fff, 0 0 10px rgba(56,189,248,.85), 0 0 24px rgba(56,189,248,.45)`): the `h1` only, breathing to 14px/36px at the midpoint of a 6s cycle.

### Named Rules
**The Flat Cabinet Rule.** Surfaces are flat bands and recessed wells. Nothing lifts on hover, nothing floats; depth is cut, not cast.

**The Glow Is Neon Rule.** A glow or blur belongs to a neon tube or a light source in the world. HTML controls, tables and windows never glow.

## Shapes

Everything is square. `border-radius` is 0 on every element, including buttons, the log well, `kbd` keys and canvas windows; the only curves in the system are drawn in the world (pond corners softened by one tile, the packet pulse ring, tree canopies). Borders are 2px solid on components (buttons, windows, the log) and 1px on text rules (table lines, `kbd`). The signature silhouette is the window frame: a 2px solid border with a 2px lighter highlight line inset under the top edge. Icons are 7x7 bitmaps (house, pin, chart, sun, moon) drawn at 3px per cell on the overlay and 1px per cell in the world, never font glyphs or SVG.

## Components

### Buttons (cabinet buttons)
Flat pixel rectangles that physically travel when pressed.
- **Shape:** square (0px radius), 2px solid `button-edge` border with a 5px lower edge.
- **Default:** `button-face` fill, `ink` text, Press Start 2P 12px, padding 12px 14px 11px.
- **Hover:** fill lightens to `#2b2f5e`; nothing moves.
- **Pressed / Toggled on (`aria-pressed="true"`):** moves down 3px, lower edge shrinks to 2px, fill deepens to `#1b1d3e`; a toggled-on button also turns its text amber and its border `#6a5a2a`. Transitions are 80ms ease-out on travel and 150ms on fill, and are removed under `prefers-reduced-motion`.
- **Focus:** the global 3px amber outline with 3px offset.

### Status windows (JRPG windows, canvas)
Every in-canvas readout, bubble and inspector shares one frame.
- **Fill:** `window-fill` (navy at 92% opacity).
- **Border:** 2px solid, colored by context: `rgba(238,240,255,0.8)` for the HUD, the hub neon for its agents' bubbles and the inspector, amber for `PAUSED`.
- **Highlight:** a 2px `rgba(255,255,255,0.35)` line inset at the top.
- **Padding:** 10px in bubbles, 12px in the inspector; all dimensions snapped to even pixels and multiplied by `ui`.
- **Text:** VT323 20px for sentences, Press Start 2P 16px for numbers, 8px uppercase for captions; bubble text wraps at 200px to at most 3 lines.

### Ledger table
A flat, tabular-numeral table. Header cells are VT323 17px in `ink-dim`, no weight, with a 1px `line` rule; body cells are 20px with 9px/8px vertical padding and 1px rules between rows (none after the last). Hub names are Press Start 2P 12px in the hub's neon; the "produces" line beneath is 18px `ink-soft`. Numeric columns are right-aligned at 72px (60px under 760px); the "Inside" column is amber. A selected hub's row tints `rgba(255,255,255,.04)`.

### Network log (ticker)
A recessed well: `log-well` fill, 2px `line` border, 12px 14px padding, 220px max height with a thin `button-edge` scrollbar. Each row is a two-column grid (56px timestamp in `ink-dim`, then the message colored by the hub neon it concerns; deal lines are amber). The newest row enters over 350ms with `cubic-bezier(.16,1,.3,1)` from 20% opacity and 6px above. The list is `aria-live="polite"`.

### Keyboard hints
`kbd` is VT323 17px in `ink-soft`, inside a 1px `line` border with a 2px lower edge and 0 5px padding: a miniature of the cabinet button.

### Neon signage (signature)
The marquee `h1` is white Press Start 2P with a sky-blue tube glow breathing over 6s. On canvas, each hub name is drawn in 16px Press Start 2P centered over its building: at `level > 0.5` it draws in the hub neon with an 8 to 24px `shadowBlur` halo and a white core at 35 to 95% opacity; unlit it draws as tinted glass over the dark board. Ignition thresholds stagger per hub (night 0.55, 0.60, 0.65), stutter for 1.2s, then hold until dawn (night < 0.35).

### Screen and bezel (signature)
`.screen` is 12px of `bezel` padding (8px under 760px) around a black `.screen-inner` with `overflow: hidden`; the bezel bands come from the box-shadow stack above. A `.scanlines` overlay (`repeating-linear-gradient` of 22% black every third pixel) sits over the canvas at 0 opacity and fades in over 400ms when the Scanlines toggle is on. Off by default.

## Do's and Don'ts

### Do:
- **Do** keep every corner square; `border-radius: 0` is the system.
- **Do** color by hub: any element that belongs to BidDeed.AI, zonewise.ai or winnerdataai.com takes that hub's neon, and the hub's wall/roof/trim family for solid fills.
- **Do** use amber only to mean a state: pressed, selected, focused, paused, or a closed deal.
- **Do** draw new on-canvas readouts with `windowBox` (navy fill, 2px border, 2px highlight) and snap them to even pixels.
- **Do** set the pixel face at 8, 12, 14 or 16px and the terminal face at 17, 18 or 20px; no sizes between.
- **Do** make a new control a cabinet button: 2px border, 5px lower edge at rest, 3px travel when pressed, 80ms ease-out.
- **Do** keep icons as 7x7 bitmaps drawn in code.
- **Do** honor `prefers-reduced-motion` by removing the tube breath, the log-row entry and button transitions.

### Don't:
- **Don't** glow, blur or pulse anything that is not a neon sign or a light source in the world.
- **Don't** fade sections, lift cards on hover, or add parallax; the only HTML motion is the log row entering and the button travelling.
- **Don't** introduce a third typeface, a bold weight, or an italic.
- **Don't** use gradients on components; the one gradient is the page background from `cabinet-2` to `cabinet`.
- **Don't** add icon fonts, SVG icon packs or emoji; the world's own bitmap glyphs are the icon set.
- **Don't** turn the scanlines on by default; they are an opt-in toggle.
- **Don't** put a drop shadow on anything but the screen bezel.
