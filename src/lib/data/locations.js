// solarDistance: orbital radius in DUNITS (1 dunit = 0.1 AU, so Earth = 10 du, Jupiter = 52 du)
// orbitRadius: SVG display radius in pixels (artistic scale, not proportional to solarDistance)
// startAngle: heliocentric ecliptic longitude as of May 8, 2026 (degrees, from positive x-axis)
// orbitalPeriodDays: real orbital period in days (planets/stations only)

export const locations = [
  // ─── Inner Planets ─────────────────────────────────────────────────────────
  {
    id: 'mercury', name: 'Mercury', type: 'planet', parentId: null,
    solarDistance: 3.87, orbitRadius: 68, startAngle: 182, orbitalPeriodDays: 87.969,
    color: '#a8a8a8', radius: 5,
    description: 'The closest planet to the Sun. Extreme temperatures make mining lucrative but dangerous.',
    produces: ['minerals', 'ore'], consumes: ['food', 'water', 'medicine', 'tech'],
    faction: 'inner-alliance', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'venus', name: 'Venus', type: 'planet', parentId: null,
    solarDistance: 7.23, orbitRadius: 104, startAngle: 172, orbitalPeriodDays: 224.701,
    color: '#e8cda2', radius: 6,
    description: 'Shrouded in toxic clouds. Atmospheric mining stations extract exotic compounds.',
    produces: ['gases', 'minerals'], consumes: ['tech', 'food', 'medicine', 'water'],
    faction: 'inner-alliance', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'earth', name: 'Earth', type: 'planet', parentId: null,
    solarDistance: 10.0, orbitRadius: 144, startAngle: 258, orbitalPeriodDays: 365.256,
    color: '#4ba3e3', radius: 7,
    description: 'Cradle of humanity. The economic and political heart of the inner system.',
    produces: ['food', 'medicine', 'tech', 'luxury'], consumes: ['ore', 'fuel', 'minerals', 'gases'],
    faction: 'inner-alliance', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'luna', name: 'Luna', type: 'moon', parentId: 'earth',
    solarDistance: 10.03, orbitRadius: 144, angle: 185,
    moonOrbitRadius: 24, moonAngle: 60,
    color: '#c8c8c8', radius: 4,
    description: "Earth's moon. Helium-3 mining fuels the fusion economy. First permanent off-world colony.",
    produces: ['fuel', 'minerals'], consumes: ['food', 'water', 'medicine', 'luxury', 'tech'],
    faction: 'inner-alliance', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'mars', name: 'Mars', type: 'planet', parentId: null,
    solarDistance: 15.24, orbitRadius: 182, startAngle: 15, orbitalPeriodDays: 686.971,
    color: '#c1440e', radius: 6,
    description: 'The Red Planet. Terraforming is underway, but it remains a harsh frontier world.',
    produces: ['ore', 'minerals', 'food'], consumes: ['tech', 'medicine', 'luxury', 'water', 'gases'],
    faction: 'inner-alliance', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'phobos', name: 'Phobos', type: 'moon', parentId: 'mars',
    solarDistance: 15.26, orbitRadius: 182, angle: 295,
    moonOrbitRadius: 20, moonAngle: 30,
    color: '#9c7a6a', radius: 3,
    description: "Mars' inner moon. A key transit hub and ore processing station.",
    produces: ['ore'], consumes: ['food', 'tech', 'medicine', 'water', 'fuel'],
    faction: 'inner-alliance', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'deimos', name: 'Deimos', type: 'moon', parentId: 'mars',
    solarDistance: 15.27, orbitRadius: 182, angle: 295,
    moonOrbitRadius: 32, moonAngle: 200,
    color: '#8a6a5a', radius: 3,
    description: "Mars' outer moon. Small research outpost with a modest trading post.",
    produces: ['ore', 'minerals'], consumes: ['food', 'tech', 'medicine', 'water'],
    faction: 'inner-alliance', hasShipyard: false, hasMarket: true,
  },

  // ─── Asteroid Belt ─────────────────────────────────────────────────────────
  {
    id: 'ceres', name: 'Ceres Station', type: 'station', parentId: null,
    solarDistance: 27.7, orbitRadius: 224, startAngle: 50, orbitalPeriodDays: 1682,
    color: '#7a6a5a', radius: 5,
    description: "The largest body in the asteroid belt. A major trade and resupply hub.",
    produces: ['ore', 'minerals'], consumes: ['food', 'water', 'medicine', 'tech', 'luxury', 'fuel'],
    faction: 'independent', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'vesta', name: 'Vesta Outpost', type: 'station', parentId: null,
    solarDistance: 26.1, orbitRadius: 224, startAngle: 140, orbitalPeriodDays: 1325,
    color: '#6a5a4a', radius: 4,
    description: 'Rich in metallic ore. Run by independent mining guilds.',
    produces: ['ore', 'minerals'], consumes: ['food', 'tech', 'fuel', 'water'],
    faction: 'independent', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'pallas', name: 'Pallas Depot', type: 'station', parentId: null,
    solarDistance: 27.0, orbitRadius: 224, startAngle: 290, orbitalPeriodDays: 1686,
    color: '#5a6a5a', radius: 4,
    description: "An unusual carbonaceous asteroid turned refueling depot.",
    produces: ['ore', 'fuel'], consumes: ['food', 'tech', 'medicine'],
    faction: 'independent', hasShipyard: false, hasMarket: true,
  },

  // ─── Jupiter System ────────────────────────────────────────────────────────
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet', parentId: null,
    solarDistance: 52.0, orbitRadius: 266, startAngle: 117, orbitalPeriodDays: 4332.589,
    color: '#c88b3a', radius: 14,
    description: 'King of planets. Hydrogen fuel extracted from its atmosphere powers the outer system.',
    produces: ['fuel', 'gases'], consumes: ['tech', 'food', 'medicine', 'luxury'],
    faction: 'outer-coalition', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'io', name: 'Io', type: 'moon', parentId: 'jupiter',
    solarDistance: 52.1, orbitRadius: 266, angle: 340,
    moonOrbitRadius: 28, moonAngle: 45,
    color: '#f4e04a', radius: 4,
    description: "Jupiter's volcanic moon. Rare sulfur compounds and exotic minerals in abundance.",
    produces: ['minerals', 'gases', 'organics'], consumes: ['food', 'water', 'medicine', 'tech'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'europa', name: 'Europa', type: 'moon', parentId: 'jupiter',
    solarDistance: 52.2, orbitRadius: 266, angle: 340,
    moonOrbitRadius: 38, moonAngle: 160,
    color: '#b8d4e8', radius: 4,
    description: 'Beneath the ice lies a vast ocean. Organic compounds and water ice are exported.',
    produces: ['water', 'organics'], consumes: ['tech', 'food', 'medicine', 'minerals'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'ganymede', name: 'Ganymede', type: 'moon', parentId: 'jupiter',
    solarDistance: 52.35, orbitRadius: 266, angle: 340,
    moonOrbitRadius: 52, moonAngle: 270,
    color: '#a09080', radius: 5,
    description: "Largest moon in the solar system. A major outer system settlement with full shipyard.",
    produces: ['water', 'ore', 'minerals'], consumes: ['food', 'tech', 'luxury', 'medicine'],
    faction: 'outer-coalition', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'callisto', name: 'Callisto', type: 'moon', parentId: 'jupiter',
    solarDistance: 52.6, orbitRadius: 266, angle: 340,
    moonOrbitRadius: 70, moonAngle: 20,
    color: '#8a7a6a', radius: 5,
    description: 'Low radiation environment. A stable, well-established colony and waypoint.',
    produces: ['water', 'ore'], consumes: ['food', 'tech', 'luxury', 'medicine', 'fuel'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'amalthea', name: 'Amalthea', type: 'moon', parentId: 'jupiter',
    solarDistance: 52.04, orbitRadius: 266, angle: 340,
    moonOrbitRadius: 16, moonAngle: 310,
    color: '#c06040', radius: 3,
    description: 'Inner shepherd moon. Emergency fuel cache and minor relay station.',
    produces: ['fuel'], consumes: ['food', 'ore', 'tech'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'himalia', name: 'Himalia', type: 'moon', parentId: 'jupiter',
    solarDistance: 52.8, orbitRadius: 266, angle: 340,
    moonOrbitRadius: 90, moonAngle: 130,
    color: '#707070', radius: 3,
    description: 'Distant irregular moon. Pirate-adjacent trading post, lax customs enforcement.',
    produces: ['ore', 'minerals'], consumes: ['food', 'tech', 'fuel', 'luxury'],
    faction: 'independent', hasShipyard: false, hasMarket: true,
  },

  // ─── Saturn System ─────────────────────────────────────────────────────────
  {
    id: 'saturn', name: 'Saturn', type: 'planet', parentId: null,
    solarDistance: 95.8, orbitRadius: 318, startAngle: 13, orbitalPeriodDays: 10759.22,
    color: '#e4d191', radius: 12,
    description: 'The ringed giant. Ring material is harvested for water ice and silicates.',
    produces: ['fuel', 'gases', 'water'], consumes: ['tech', 'food', 'luxury', 'medicine'],
    faction: 'outer-coalition', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'titan', name: 'Titan', type: 'moon', parentId: 'saturn',
    solarDistance: 96.1, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 55, moonAngle: 80,
    color: '#e8a840', radius: 6,
    description: "Saturn's largest moon. Methane lakes, thick atmosphere, the most hospitable outer world.",
    produces: ['fuel', 'gases', 'organics'], consumes: ['tech', 'food', 'medicine', 'luxury', 'water'],
    faction: 'outer-coalition', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'enceladus', name: 'Enceladus', type: 'moon', parentId: 'saturn',
    solarDistance: 95.88, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 28, moonAngle: 210,
    color: '#ddeeff', radius: 3,
    description: 'Geysers of water ice erupt from the south pole. Prime water ice export.',
    produces: ['water', 'organics'], consumes: ['food', 'tech', 'medicine', 'fuel'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'rhea', name: 'Rhea', type: 'moon', parentId: 'saturn',
    solarDistance: 95.95, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 40, moonAngle: 320,
    color: '#c8c0b8', radius: 4,
    description: "Saturn's second largest moon. Ice and rock mining with a reliable trading post.",
    produces: ['water', 'minerals'], consumes: ['food', 'tech', 'medicine', 'fuel'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'dione', name: 'Dione', type: 'moon', parentId: 'saturn',
    solarDistance: 95.92, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 34, moonAngle: 140,
    color: '#b8b0a8', radius: 4,
    description: 'Heavily cratered ice world. Small but established colony focused on minerals.',
    produces: ['minerals', 'water'], consumes: ['food', 'tech', 'medicine'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'tethys', name: 'Tethys', type: 'moon', parentId: 'saturn',
    solarDistance: 95.9, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 22, moonAngle: 50,
    color: '#a8a8b8', radius: 3,
    description: 'Almost entirely water ice. Pristine and quiet — a research station.',
    produces: ['water', 'organics'], consumes: ['food', 'tech', 'medicine', 'fuel'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'iapetus', name: 'Iapetus', type: 'moon', parentId: 'saturn',
    solarDistance: 96.35, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 70, moonAngle: 260,
    color: '#806040', radius: 4,
    description: 'Two-toned moon far out from Saturn. Independent outpost, good prices for rare goods.',
    produces: ['minerals', 'organics'], consumes: ['food', 'tech', 'luxury', 'medicine', 'fuel'],
    faction: 'independent', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'mimas', name: 'Mimas', type: 'moon', parentId: 'saturn',
    solarDistance: 95.85, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 18, moonAngle: 170,
    color: '#b0b0b8', radius: 3,
    description: 'Death Star look-alike. Small mining outpost near Saturn.',
    produces: ['ore', 'minerals'], consumes: ['food', 'tech', 'fuel'],
    faction: 'outer-coalition', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'hyperion', name: 'Hyperion', type: 'moon', parentId: 'saturn',
    solarDistance: 96.15, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 58, moonAngle: 350,
    color: '#988070', radius: 3,
    description: 'Irregularly shaped, chaotic rotation. Unique mineral deposits draw specialist miners.',
    produces: ['minerals', 'ore'], consumes: ['food', 'tech', 'medicine'],
    faction: 'independent', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'phoebe', name: 'Phoebe', type: 'moon', parentId: 'saturn',
    solarDistance: 96.5, orbitRadius: 318, angle: 130,
    moonOrbitRadius: 95, moonAngle: 100,
    color: '#505050', radius: 3,
    description: 'Captured asteroid moon, retrograde orbit. Frontier trading post, no questions asked.',
    produces: ['ore', 'minerals', 'organics'], consumes: ['fuel', 'food', 'tech'],
    faction: 'independent', hasShipyard: false, hasMarket: true,
  },

  // ─── Uranus System ─────────────────────────────────────────────────────────
  {
    id: 'uranus', name: 'Uranus', type: 'planet', parentId: null,
    solarDistance: 191.8, orbitRadius: 368, startAngle: 67, orbitalPeriodDays: 30688.5,
    color: '#7de8e8', radius: 10,
    description: 'The ice giant tilted on its side. Methane gives it a distinctive cyan hue.',
    produces: ['gases', 'fuel'], consumes: ['tech', 'food', 'luxury', 'medicine'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'miranda', name: 'Miranda', type: 'moon', parentId: 'uranus',
    solarDistance: 191.82, orbitRadius: 368, angle: 230,
    moonOrbitRadius: 18, moonAngle: 60,
    color: '#c0b090', radius: 3,
    description: 'Wild terrain of cliffs and canyons. Small expedition base.',
    produces: ['minerals', 'ore'], consumes: ['food', 'tech', 'medicine', 'fuel'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'ariel', name: 'Ariel', type: 'moon', parentId: 'uranus',
    solarDistance: 191.85, orbitRadius: 368, angle: 230,
    moonOrbitRadius: 28, moonAngle: 180,
    color: '#b0c0c8', radius: 3,
    description: 'Bright and active surface. Reasonable-sized outpost with growing population.',
    produces: ['water', 'minerals'], consumes: ['food', 'tech', 'medicine', 'luxury'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'umbriel', name: 'Umbriel', type: 'moon', parentId: 'uranus',
    solarDistance: 191.9, orbitRadius: 368, angle: 230,
    moonOrbitRadius: 38, moonAngle: 300,
    color: '#707878', radius: 3,
    description: 'Dark and ancient. Rare mineral deposits draw long-haul traders.',
    produces: ['minerals', 'ore'], consumes: ['food', 'tech', 'fuel'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'titania', name: 'Titania', type: 'moon', parentId: 'uranus',
    solarDistance: 192.0, orbitRadius: 368, angle: 230,
    moonOrbitRadius: 50, moonAngle: 90,
    color: '#a0b8c0', radius: 4,
    description: "Uranus' largest moon. The Frontier's best-developed outpost in the Uranian system.",
    produces: ['water', 'minerals', 'ore'], consumes: ['tech', 'food', 'medicine', 'luxury', 'fuel'],
    faction: 'frontier', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'oberon', name: 'Oberon', type: 'moon', parentId: 'uranus',
    solarDistance: 192.1, orbitRadius: 368, angle: 230,
    moonOrbitRadius: 62, moonAngle: 220,
    color: '#908880', radius: 4,
    description: 'Outermost major Uranian moon. Quiet and remote — attracts independent operators.',
    produces: ['minerals', 'ore'], consumes: ['food', 'tech', 'fuel', 'luxury'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },

  // ─── Neptune System ─────────────────────────────────────────────────────────
  {
    id: 'neptune', name: 'Neptune', type: 'planet', parentId: null,
    solarDistance: 300.5, orbitRadius: 416, startAngle: 2, orbitalPeriodDays: 60195.0,
    color: '#4b70dd', radius: 10,
    description: 'Windiest planet. Exotic gas extraction at the edge of the known system.',
    produces: ['gases', 'fuel'], consumes: ['tech', 'food', 'medicine', 'luxury'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'triton', name: 'Triton', type: 'moon', parentId: 'neptune',
    solarDistance: 300.6, orbitRadius: 416, angle: 30,
    moonOrbitRadius: 35, moonAngle: 140,
    color: '#c0e0f0', radius: 5,
    description: 'Retrograde orbit moon with geysers of nitrogen. Most important outer system outpost.',
    produces: ['gases', 'minerals', 'organics'], consumes: ['food', 'tech', 'medicine', 'luxury', 'water'],
    faction: 'frontier', hasShipyard: true, hasMarket: true,
  },
  {
    id: 'nereid', name: 'Nereid', type: 'moon', parentId: 'neptune',
    solarDistance: 300.7, orbitRadius: 416, angle: 30,
    moonOrbitRadius: 65, moonAngle: 290,
    color: '#8090a0', radius: 3,
    description: 'Highly eccentric orbit. A remote waypoint used by deep-space explorers.',
    produces: ['ore', 'minerals'], consumes: ['food', 'fuel', 'tech'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'proteus', name: 'Proteus', type: 'moon', parentId: 'neptune',
    solarDistance: 300.52, orbitRadius: 416, angle: 30,
    moonOrbitRadius: 20, moonAngle: 50,
    color: '#606870', radius: 3,
    description: 'Dark and irregular. Small but strategically placed relay station.',
    produces: ['ore'], consumes: ['food', 'fuel', 'tech', 'medicine'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'larissa', name: 'Larissa', type: 'moon', parentId: 'neptune',
    solarDistance: 300.53, orbitRadius: 416, angle: 30,
    moonOrbitRadius: 26, moonAngle: 180,
    color: '#707880', radius: 3,
    description: 'Irregularly shaped Neptunian moon. Emergency resupply stop.',
    produces: ['ore'], consumes: ['food', 'fuel', 'tech'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },

  // ─── Pluto System ──────────────────────────────────────────────────────────
  {
    id: 'pluto', name: 'Pluto', type: 'planet', parentId: null,
    solarDistance: 394.6, orbitRadius: 452, startAngle: 277, orbitalPeriodDays: 90560.0,
    color: '#a68b5b', radius: 5,
    description: 'The last outpost of the solar system. Exotic frozen compounds and total frontier law.',
    produces: ['minerals', 'organics', 'luxury'], consumes: ['food', 'water', 'tech', 'medicine', 'fuel'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'charon', name: 'Charon', type: 'moon', parentId: 'pluto',
    solarDistance: 394.62, orbitRadius: 452, angle: 170,
    moonOrbitRadius: 22, moonAngle: 90,
    color: '#8a7a6a', radius: 4,
    description: "Half the size of Pluto itself. The binary system's relay hub.",
    produces: ['ore', 'minerals'], consumes: ['food', 'tech', 'fuel', 'medicine'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'nix', name: 'Nix', type: 'moon', parentId: 'pluto',
    solarDistance: 394.65, orbitRadius: 452, angle: 170,
    moonOrbitRadius: 38, moonAngle: 200,
    color: '#b0a090', radius: 2,
    description: 'Tiny Plutonian moon. Unmanned mining drone base.',
    produces: ['ore'], consumes: ['tech', 'fuel'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
  {
    id: 'hydra', name: 'Hydra', type: 'moon', parentId: 'pluto',
    solarDistance: 394.7, orbitRadius: 452, angle: 170,
    moonOrbitRadius: 50, moonAngle: 330,
    color: '#a09080', radius: 2,
    description: 'Outermost known Plutonian moon. True edge-of-system waypoint.',
    produces: ['minerals'], consumes: ['food', 'tech', 'fuel'],
    faction: 'frontier', hasShipyard: false, hasMarket: true,
  },
]

// ─── Orbital animation ────────────────────────────────────────────────────────
// 1 game year = 14 IRL days. Scale: 365.25 / 14 ≈ 26.09 game-days per IRL day
export const GAME_TIME_SCALE = 365.25 / 14
// Reference epoch: May 8, 2026 00:00 UTC
export const START_EPOCH_MS = 1746662400000

export function angularVelocity(periodDays) {
  return 360 / (periodDays * 86400 * 1000 / GAME_TIME_SCALE)  // deg/ms
}

export function currentAngle(startAngle, periodDays, mult = 1) {
  const elapsed = Date.now() - START_EPOCH_MS
  return (startAngle + elapsed * angularVelocity(periodDays) * mult) % 360
}

// SVG x,y from display orbital radius and angle (degrees)
export function orbitPosition(radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) }
}

// 2D position in dunits for a body (uses parent planet for moons)
export function bodyPosition(loc, nowMs = Date.now()) {
  // Climb to parent for moons
  let target = loc
  while (target.parentId) {
    target = locations.find(l => l.id === target.parentId) ?? target
  }
  if (!target.orbitalPeriodDays) return { x: 0, y: 0 }
  const angle = currentAngle(target.startAngle, target.orbitalPeriodDays)
  const rad   = (angle * Math.PI) / 180
  return {
    x: target.solarDistance * Math.cos(rad),
    y: target.solarDistance * Math.sin(rad),
  }
}

// Actual 2D travel distance in dunits between two locations
export function travelDistance(locA, locB) {
  const a  = bodyPosition(locA)
  const b  = bodyPosition(locB)
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Kepler solver
export function solveKepler(M, e, iterations = 8) {
  let E = M
  for (let i = 0; i < iterations; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  }
  return E
}

// ─── Comets ────────────────────────────────────────────────────────────────────
// 1 AU = 10 dunits.  SVG scale: Earth orbitRadius=144px = solarDistance=10 du → 14.4 px/du
export const AU_TO_DU = 10      // dunits per AU
export const AU_TO_PX = 144     // SVG pixels per AU (matches Earth's orbitRadius)
export const DU_TO_PX = AU_TO_PX / AU_TO_DU  // 14.4 px/du

export const comets = [
  {
    id: 'halley',
    name: "Halley's Comet",
    semiMajorAxisAU: 17.834,
    eccentricity: 0.96714,
    argPeriapsisDeg: 111.3,
    orbitalPeriodDays: 27506,
    daysSincePerihelion: 14698,
    color: '#a0d8ef',
    tailColor: 'rgba(160,216,239,0.4)',
    description: 'The most famous comet. Currently far from the inner system on its long elliptical orbit.',
    encounterReward: { minerals: 15, organics: 20, water: 10 },
  },
  {
    id: 'encke',
    name: "Encke's Comet",
    semiMajorAxisAU: 2.217,
    eccentricity: 0.8483,
    argPeriapsisDeg: 186.5,
    orbitalPeriodDays: 1205,
    daysSincePerihelion: 929,
    color: '#c8e8c0',
    tailColor: 'rgba(200,232,192,0.35)',
    description: "Short-period comet crossing the inner system regularly.",
    encounterReward: { organics: 10, ore: 5 },
  },
  {
    id: '67p',
    name: '67P/C-G',
    semiMajorAxisAU: 3.463,
    eccentricity: 0.6410,
    argPeriapsisDeg: 12.0,
    orbitalPeriodDays: 2351,
    daysSincePerihelion: 1648,
    color: '#e8d8a0',
    tailColor: 'rgba(232,216,160,0.35)',
    description: 'The Rosetta comet. Active outgassing in the inner system.',
    encounterReward: { minerals: 8, organics: 12 },
  },
]

// Comet position in SVG pixels
export function cometSVGPosition(comet, nowMs = Date.now()) {
  const elapsedDays = comet.daysSincePerihelion + (nowMs - START_EPOCH_MS) / 86400000 * GAME_TIME_SCALE
  const meanAnomaly = ((elapsedDays % comet.orbitalPeriodDays) / comet.orbitalPeriodDays) * 2 * Math.PI
  const E = solveKepler(meanAnomaly, comet.eccentricity)
  const a = comet.semiMajorAxisAU * AU_TO_PX
  const b = a * Math.sqrt(1 - comet.eccentricity ** 2)
  const xOrbit = a * (Math.cos(E) - comet.eccentricity)
  const yOrbit = b * Math.sin(E)
  const omega  = (comet.argPeriapsisDeg * Math.PI) / 180
  return {
    x: xOrbit * Math.cos(omega) - yOrbit * Math.sin(omega),
    y: xOrbit * Math.sin(omega) + yOrbit * Math.cos(omega),
  }
}

// Comet position in dunits (for proximity calculations)
export function cometPositionDU(comet, nowMs = Date.now()) {
  const px = cometSVGPosition(comet, nowMs)
  return { x: px.x / DU_TO_PX, y: px.y / DU_TO_PX }
}

// Comet SVG ellipse params (for orbit path drawing)
export function cometOrbitEllipse(comet) {
  const a  = comet.semiMajorAxisAU * AU_TO_PX
  const b  = a * Math.sqrt(1 - comet.eccentricity ** 2)
  const cx = -a * comet.eccentricity
  return { a, b, cx, cy: 0, rotate: comet.argPeriapsisDeg }
}

// Point-to-segment distance (2D), for comet proximity checking
export function pointSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export const factions = {
  'inner-alliance': { name: 'Inner Alliance', color: '#22d3ee', description: 'Governing body of the inner planets' },
  'outer-coalition': { name: 'Outer Coalition', color: '#fb923c', description: 'Jupiter and Saturn systems' },
  'frontier': { name: 'Frontier', color: '#a78bfa', description: 'The outer reaches — loose governance' },
  'independent': { name: 'Independent', color: '#4ade80', description: 'No allegiance — free traders and miners' },
}

export function getLocation(id) {
  return locations.find(l => l.id === id)
}

export function getMoons(planetId) {
  return locations.filter(l => l.parentId === planetId)
}

export function getPlanets() {
  return locations.filter(l => l.type === 'planet' || (l.type === 'station' && !l.parentId))
}
