# Space Flight Inc 2 — Project Briefing

## Overview

Browser-based space trading game built with **Svelte 4 + Vite + Tailwind CSS**. The player pilots a ship between solar system bodies, buys/sells commodities, and encounters random events. NPCs operate autonomously on the same market. The solar system is animated in real time using an SVG canvas.

**Working directory:** `/home/user/spaceflightinc2`  
**Dev server:** `npm run dev`  
**Build:** `npm run build` → `dist/`

---

## Time & Distance System

```
GAME_TIME_SCALE = 365.25   // 1 IRL day = 1 game year
START_EPOCH_MS  = 1746662400000  // May 8 2026 00:00 UTC

DU_TO_PX = 14.4            // SVG pixels per dunits
AU_TO_DU = 10              // 1 AU = 10 du
// Earth = 10 du from sun → 144px in SVG

// Travel time (real seconds):
realTravelSecs(dist, speedPerGameDay) = max(60, round(dist/speed × 86400/365.25))
// Earth→Mars (~5 du) at 40 du/day ≈ 30s
// Earth→Jupiter (~42 du) at 40 du/day ≈ 4 min
```

Distances are **dynamically computed** from orbital positions — the same route is longer or shorter depending on where the planets are in their orbits at the moment of travel.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/data/locations.js` | All solar system bodies, orbital mechanics, distance functions |
| `src/lib/data/ships.js` | 20 ships across 5 classes with speed/cargo/sensorRange |
| `src/lib/data/commodities.js` | 10 commodities, market stock generation, price model |
| `src/lib/data/events.js` | ~8 random travel events (auto-resolve, no modal) |
| `src/lib/stores/gameStore.js` | All game state, NPC AI, market simulation (~845 lines) |
| `src/lib/components/SolarSystemMap.svelte` | Animated SVG map (~540 lines) |
| `src/lib/components/LocationPanel.svelte` | Navigate tab — destination/ETA/travel button |
| `src/lib/components/MarketPanel.svelte` | Buy/sell interface |
| `src/lib/components/StatsBar.svelte` | Top HUD bar |
| `src/App.svelte` | Root layout |

---

## locations.js — Core Functions

```js
export function angularVelocity(periodDays) {
  return 360 / (periodDays * 86400 * 1000 / GAME_TIME_SCALE)  // deg/ms
}

export function currentAngle(startAngle, periodDays, mult = 1) {
  const elapsed = Date.now() - START_EPOCH_MS
  return (startAngle + elapsed * angularVelocity(periodDays) * mult) % 360
}

export function orbitPosition(radiusPx, angleDeg) {
  const rad = angleDeg * Math.PI / 180
  return { x: radiusPx * Math.cos(rad), y: radiusPx * Math.sin(rad) }
}

// Physics position in dunits (for distance calculation)
export function bodyPosition(loc, nowMs = Date.now()) { ... }

// True 2D distance in dunits between two locations (calls Date.now() internally)
export function travelDistance(locA, locB) { ... }
```

Location entry shape:

```js
{
  id, name, type,           // type: 'planet' | 'moon' | 'station' | 'asteroid'
  solarDistance,            // dunits from sun — used for physics AND SVG rendering
  startAngle,               // degrees at START_EPOCH_MS
  orbitalPeriodDays,        // game-days for full orbit
  hasMarket, hasShipyard,
  produces: ['tech'],       // drives cheap supply at this location
  consumes: ['ore'],        // drives high demand at this location
  parentId,                 // moons only — parent planet id
  moonOrbitRadius,          // moons only — px radius around parent SVG position
  moonAngle,                // moons only — starting angle (degrees)
  faction,                  // 'alliance' | 'miners' | 'corp' | 'free'
}
```

---

## SolarSystemMap.svelte — Animation Pattern

**Critical:** Svelte's reactive dependency tracking only works for variables read *directly* inside `$:` blocks. Reading state through a function call chain silently breaks tracking.

The working pattern:

```js
let now = Date.now()
let animFrame

function updateOrbits() { now = Date.now(); animFrame = requestAnimationFrame(updateOrbits) }
onMount(() => { animFrame = requestAnimationFrame(updateOrbits) })
onDestroy(() => { if (animFrame) cancelAnimationFrame(animFrame) })

// `now` is the reactive anchor — re-evaluates every frame
$: planetAngles = now ? Object.fromEntries(
  topLevelLocations.map(loc => [
    loc.id,
    loc.orbitalPeriodDays ? currentAngle(loc.startAngle, loc.orbitalPeriodDays) : (loc.startAngle ?? 0)
  ])
) : {}

function getPlanetPos(loc) {
  const angle = planetAngles[loc.id] ?? loc.startAngle ?? 0
  return orbitPosition(loc.solarDistance * DU_TO_PX, angle)  // ALWAYS solarDistance × DU_TO_PX
}
```

Moon orbital periods are defined in the component (not in location data):

```js
const MOON_PERIODS = {
  luna: 27.32, phobos: 0.319, deimos: 1.263,
  io: 1.769, europa: 3.551, ganymede: 7.155, callisto: 16.69, amalthea: 0.498,
  titan: 15.945, enceladus: 1.370, rhea: 4.518, dione: 2.737, tethys: 1.888,
  iapetus: 79.33, mimas: 0.942, hyperion: 21.28,
  miranda: 1.413, ariel: 2.520, umbriel: 4.144, titania: 8.706, oberon: 13.46,
  triton: 5.877, nereid: 360.14, proteus: 1.122, larissa: 0.555,
  charon: 6.387, nix: 24.85, hydra: 38.20,
}
```

Zoom bounds: `VB_MIN = 40, VB_MAX = 12000`. **Clamp `newW` before computing the new origin** — clamping after causes pan drift on hard zoom limits.

NPC visibility is filtered by `$currentShip.sensorRange` (dunits). NPCs beyond that radius are hidden from the map.

SVG layer order (top to bottom in template):

1. Background rect
2. Stars
3. Comet orbit ellipses (dashed)
4. Orbital rings
5. Comet bodies (animated with tails)
6. Planets (with Saturn rings, selection indicators, reachability rings)
7. Moon orbit rings + moon dots
8. NPC trajectory lines (dashed, NPC color)
9. NPC dots + labels
10. Player travel line (dashed cyan)
11. Player ship dot (pulsing SMIL animation)
12. Sun (center, glow)

---

## gameStore.js — State Shapes

```js
// Player
{
  credits, shipId, cargo: {},
  locationId, status,         // 'docked' | 'travelling' | 'docking' | 'event'
  travellingTo, arrivalTime, dockingUntil,
  departedFromId, departedAt,
  mileage, damage,            // damage: 0–100%
  fleet: [],                  // [{ shipId, locationId, mileage, damage }]
}

// NPC
{
  id, name, shipId, color, credits,
  locationId, status,         // 'docked' | 'travelling'
  travellingTo, departedFromId, departedAt, arrivalTime,
  cargo: {},
  dwellUntil,                 // timestamp — NPC won't trade until this passes
}
```

NPC tick runs every 10 seconds. On arrival, `dwellUntil` is set to `now + 60–240s` (staggered initial values of 30–120s prevent all NPCs departing simultaneously at load). Market stock replenishes every 30s via each location's `supplyRate` / `consumeRate`.

Events auto-resolve — the player sees the encounter name and outcome in the activity log, never a modal. The auto-resolver picks the cheapest affordable choice. Comet encounters are injected dynamically in `startTravel()` if the route passes within 2 du of a comet.

---

## Market Price Model

```
Producer:  buyPrice = 30–55% of basePrice  (cheapest when stock is full)
Consumer:  buyPrice = 150–280% of basePrice (most expensive when stock is empty)
Neutral:   buyPrice = 85–115% of basePrice

sellPrice = buyPrice × (0.72 / 1.08)       // fixed spread
```

The 10 commodities and their base prices:

| Commodity | Base Price |
|-----------|-----------|
| Food & Nutrients | 50 cr |
| Water & Ice | 80 cr |
| Metal Ore | 65 cr |
| Fuel Crystals | 130 cr |
| Tech Components | 220 cr |
| Medical Supplies | 190 cr |
| Rare Minerals | 380 cr |
| Exotic Gases | 160 cr |
| Luxury Goods | 450 cr |
| Organic Compounds | 110 cr |

---

## Ships

20 ships across 5 classes. Key stats: `speed` (du/game-day), `jumpDistance` (max single-hop du), `cargoCapacity` (tons), `sensorRange` (du), `price` (credits).

| Class | Ships | Speed range | Cargo range | Sensor range |
|-------|-------|-------------|-------------|--------------|
| Scout | Dart I → Eclipse | 40–80 | 10–18 | 60–115 |
| Courier | Relay MK1 → Falcon X | 28–56 | 55–90 | 55–110 |
| Freighter | Iron Mule → Star Ox | 16–24 | 150–330 | 45–80 |
| Heavy Freighter | Titan Hauler → Leviathan | 4–10 | 550–1300 | 40 |
| Explorer | Wanderer → Pioneer | 28–60 | 30–45 | 160–410 |

---

## Known Gotchas

- **Never use `loc.orbitRadius` for SVG rendering.** It's a legacy field. Always use `loc.solarDistance * DU_TO_PX`.
- **Svelte reactivity through functions is unreliable.** If a `$:` block reads state only through a function call, Svelte may not schedule re-evaluation. Read reactive variables directly in the `$:` expression.
- **`travelDistance()` is dynamic.** It calls `Date.now()` internally, so the same pair of locations returns different distances at different times as planets orbit.
- **Travel time must use `GAME_TIME_SCALE`.** Never compute `dist / speed` as real seconds directly.
- **The navigate panel uses a 3-second `setInterval`** to bump a `now` variable so that distance and ETA stay live as planets move.

---

## Potential Next Work

- **Ship upgrades** — sensor range, cargo expansion, speed modules. StatsBar shows these stats but there's no upgrade mechanic yet.
- **Faction reputation** — factions are defined (`alliance`, `miners`, `corp`, `free`) and locations have a `faction` field, but there's no reputation tracking or effect on prices/access.
- **Persistent save** — all state is in-memory; a browser refresh resets the game.
- **Fleet management** — the player can own multiple ships (`fleet` array in player state) but there's no UI to command or route them.
- **Piracy / combat** — events reference pirates but there's no PvP or combat resolution system.
- **Shipyard UI** — buying ships works in `gameStore.js` (`buyShip`) but the interface is minimal.
