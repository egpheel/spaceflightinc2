import { writable, derived, get } from 'svelte/store'
import { getLocation, travelDistance, bodyPosition, cometPositionDU, pointSegmentDist, comets, locations, GAME_TIME_SCALE } from '../data/locations.js'

// Converts a game-day speed (du/game-day) to real travel seconds
function realTravelSecs(dist, speedPerGameDay) {
  return Math.max(60, Math.round((dist / speedPerGameDay) * (86400 / GAME_TIME_SCALE)))
}

function formatETA(secs) {
  if (secs < 60) return secs + 's'
  const m = Math.round(secs / 60)
  if (m < 60) return m + 'm'
  const h = Math.floor(m / 60)
  const mins = m % 60
  return mins > 0 ? `${h}h ${mins}m` : `${h}h`
}
import { getShip } from '../data/ships.js'
import { generateMarketStock, stockPrice, getCommodity, commodities } from '../data/commodities.js'
import { rollEvent } from '../data/events.js'

// ─── Player state ────────────────────────────────────────────────────────────

export const player = writable({
  credits: 5000,
  shipId: 'dart-i',
  cargo: {},
  locationId: 'earth',
  status: 'docked',         // 'docked' | 'travelling' | 'docking' | 'event'
  travellingTo: null,
  arrivalTime: null,
  dockingUntil: null,
  statusMessage: 'Docked at Earth',
  departedFromId: null,     // for travel animation
  departedAt: null,
  mileage: 0,               // dunits traveled with current ship
  damage: 0,                // 0–100 damage %
  fleet: [],                // [{ shipId, locationId, mileage, damage }] — stored ships
})

// ─── Market stock ─────────────────────────────────────────────────────────────
// { [locationId]: { [commodityId]: { stock, stockCap, supplyRate, consumeRate, basePrice, isProducer, isConsumer } } }
export const marketStock = writable({})

// Derive live prices from stock levels
export const marketPrices = derived(marketStock, $ms => {
  const result = {}
  for (const [locId, locStock] of Object.entries($ms)) {
    result[locId] = {}
    for (const [commId, info] of Object.entries(locStock)) {
      result[locId][commId] = stockPrice(info)
    }
  }
  return result
})

// ─── NPC traders ─────────────────────────────────────────────────────────────

const NPC_DEFS = [
  { id: 'npc-rex',   name: 'Trader Rex',   shipId: 'relay-mk1',    startLoc: 'mars',     color: '#f97316', credits: 8000 },
  { id: 'npc-luna',  name: 'Luna Chen',    shipId: 'dart-ii',      startLoc: 'luna',     color: '#a855f7', credits: 5000 },
  { id: 'npc-iron',  name: 'Iron Mike',    shipId: 'cargo-king',   startLoc: 'ceres',    color: '#22c55e', credits: 15000 },
  { id: 'npc-void',  name: 'Void Walker',  shipId: 'wanderer',     startLoc: 'jupiter',  color: '#eab308', credits: 12000 },
  { id: 'npc-sable', name: 'Sable Ryn',    shipId: 'swift-arrow',  startLoc: 'earth',    color: '#ec4899', credits: 10000 },
  { id: 'npc-bjorn', name: 'Bjorn Astro',  shipId: 'iron-mule',    startLoc: 'venus',    color: '#06b6d4', credits: 7000 },
  { id: 'npc-kit',   name: 'Kit Varis',    shipId: 'phantom',      startLoc: 'titan',    color: '#f43f5e', credits: 9000 },
  { id: 'npc-otto',  name: 'Otto Flux',    shipId: 'relay-mk2',    startLoc: 'ganymede', color: '#84cc16', credits: 11000 },
]

export const npcs = writable(
  NPC_DEFS.map(d => ({
    id: d.id,
    name: d.name,
    shipId: d.shipId,
    color: d.color,
    credits: d.credits,
    locationId: d.startLoc,
    status: 'docked',
    travellingTo: null,
    departedFromId: null,
    departedAt: null,
    arrivalTime: null,
    cargo: {},
  }))
)

// ─── Misc stores ─────────────────────────────────────────────────────────────

export const logs = writable([])
export const pendingEvent = writable(null)
export const selectedLocationId = writable('earth')

// ─── Derived ─────────────────────────────────────────────────────────────────

export const currentLocation = derived(player, $p => getLocation($p.locationId))
export const currentShip     = derived(player, $p => getShip($p.shipId))

export const cargoUnits = derived(player, $p =>
  Object.values($p.cargo).reduce((s, q) => s + q, 0)
)

export const cargoValue = derived([player, marketPrices], ([$p, $mp]) => {
  const prices = $mp[$p.locationId]
  if (!prices) return 0
  return Object.entries($p.cargo).reduce((sum, [id, qty]) => {
    return sum + (prices[id]?.sellPrice ?? 0) * qty
  }, 0)
})

// ─── Internal helpers ─────────────────────────────────────────────────────────

let travelInterval  = null
let dockingInterval = null

function addLog(message, type = 'info') {
  logs.update(ls => [{ message, type, time: new Date().toLocaleTimeString() }, ...ls.slice(0, 49)])
}

function ensureMarketStock(locationId) {
  const ms = get(marketStock)
  if (!ms[locationId]) {
    const loc = getLocation(locationId)
    if (loc) {
      marketStock.update(m => ({ ...m, [locationId]: generateMarketStock(loc) }))
    }
  }
}

function trimCargo(cargo, capacity) {
  const newCargo = { ...cargo }
  let total = Object.values(newCargo).reduce((s, q) => s + q, 0)
  for (const id of Object.keys(newCargo)) {
    if (total <= capacity) break
    const excess  = total - capacity
    const remove  = Math.min(newCargo[id], excess)
    newCargo[id] -= remove
    if (newCargo[id] <= 0) delete newCargo[id]
    total -= remove
  }
  return newCargo
}

export function tradeInValue(ship, mileage, damage) {
  const mileageFactor = Math.max(0, 1 - (mileage / (ship.maxMileage ?? 100000)) * 0.30)
  const damageFactor  = Math.max(0, 1 - damage / 100)
  return Math.round(ship.price * 0.55 * mileageFactor * damageFactor)
}

// ─── Travel ──────────────────────────────────────────────────────────────────

export function startTravel(destinationId) {
  const $p    = get(player)
  const $ship = getShip($p.shipId)
  const from  = getLocation($p.locationId)
  const to    = getLocation(destinationId)

  if (!to || !$ship) return

  const dist = travelDistance(from, to)
  if (dist > $ship.jumpDistance) {
    addLog(`${to.name} is out of jump range (${dist.toFixed(1)} > ${$ship.jumpDistance} du)`, 'warning')
    return
  }

  const travelSecs  = realTravelSecs(dist, $ship.speed)
  const arrivalTime = Date.now() + travelSecs * 1000
  const departedAt  = Date.now()

  if (travelInterval) clearInterval(travelInterval)

  player.update(p => ({
    ...p,
    status: 'travelling',
    locationId: 'space',
    travellingTo: destinationId,
    arrivalTime,
    departedFromId: p.locationId,
    departedAt,
    statusMessage: `Travelling to ${to.name}`,
  }))

  addLog(`Departed for ${to.name} — ETA ${formatETA(travelSecs)}`, 'travel')

  // Check if any comet's current position lies within 2 du of our route
  const fromPos = bodyPosition(from)
  const toPos   = bodyPosition(to)
  let cometEvent = null
  for (const comet of comets) {
    const cp   = cometPositionDU(comet)
    const dist2 = pointSegmentDist(cp.x, cp.y, fromPos.x, fromPos.y, toPos.x, toPos.y)
    if (dist2 < 2) {
      cometEvent = {
        id: 'comet-encounter',
        name: `${comet.name} Encounter`,
        icon: '☄',
        severity: 'info',
        description: `Your route passes through ${comet.name}'s coma. Its tail is rich in harvestable material.`,
        flavour: 'Through the viewport, a glittering ribbon of ice crystals stretches for thousands of kilometres.',
        choices: [
          {
            label: 'Harvest the tail',
            description: 'Collect organics and water ice from the coma. 45-second delay, but free cargo.',
            effect: { type: 'comet_harvest', delay: 45 },
          },
          {
            label: 'Continue on course',
            description: 'No time for sightseeing.',
            effect: { type: 'none' },
          },
        ],
      }
      break
    }
  }

  const event = cometEvent ?? rollEvent()
  let eventFired = false
  const eventTriggerTime = event
    ? arrivalTime - travelSecs * 1000 * (0.3 + Math.random() * 0.5)
    : null

  travelInterval = setInterval(() => {
    const now = Date.now()
    const $cur = get(player)

    if (event && !eventFired && eventTriggerTime && now >= eventTriggerTime && $cur.status === 'travelling') {
      eventFired = true
      // Auto-resolve: pick a random affordable choice, apply immediately without pausing
      const affordable = event.choices.filter(c => !c.requiresCredits || get(player).credits >= c.requiresCredits)
      const pool   = affordable.length > 0 ? affordable : event.choices
      const choice = pool[Math.floor(Math.random() * pool.length)]
      addLog(`[${event.name}] ${choice.description}`, 'warning')
      const remaining = Math.max(0, $cur.arrivalTime - now)
      applyEffect(choice.effect, remaining, destinationId)
      return
    }

    if (now >= $cur.arrivalTime && $cur.status === 'travelling') {
      clearInterval(travelInterval)
      beginDocking(destinationId, dist)
    }
  }, 500)
}

export function resumeAfterEvent(remainingMs) {
  const $p = get(player)
  const destinationId  = $p.travellingTo
  const newArrivalTime = Date.now() + remainingMs

  player.update(p => ({ ...p, status: 'travelling', arrivalTime: newArrivalTime }))

  travelInterval = setInterval(() => {
    const now  = Date.now()
    const $cur = get(player)
    if (now >= $cur.arrivalTime && $cur.status === 'travelling') {
      clearInterval(travelInterval)
      // Use the dist from current loc — we skip exact recalc for simplicity
      beginDocking(destinationId, 0)
    }
  }, 500)
}

function beginDocking(destinationId, dist) {
  const loc      = getLocation(destinationId)
  const dockSecs = 4
  const dockingUntil = Date.now() + dockSecs * 1000

  // Track mileage
  player.update(p => ({
    ...p,
    status: 'docking',
    locationId: destinationId,
    travellingTo: null,
    arrivalTime: null,
    dockingUntil,
    departedFromId: null,
    departedAt: null,
    statusMessage: `Docking at ${loc?.name}`,
    mileage: p.mileage + dist,
  }))

  addLog(`Arrived at ${loc?.name} — docking`, 'travel')

  dockingInterval = setInterval(() => {
    const now  = Date.now()
    const $cur = get(player)
    if (now >= $cur.dockingUntil) {
      clearInterval(dockingInterval)
      completeDocking(destinationId)
    }
  }, 500)
}

function completeDocking(locationId) {
  const loc = getLocation(locationId)
  ensureMarketStock(locationId)

  player.update(p => ({
    ...p,
    status: 'docked',
    locationId,
    dockingUntil: null,
    statusMessage: `Docked at ${loc?.name}`,
  }))

  selectedLocationId.set(locationId)
  addLog(`Docked at ${loc?.name}`, 'info')
}

// ─── Event resolution ─────────────────────────────────────────────────────────

export function resolveEvent(choiceIndex) {
  const event = get(pendingEvent)
  if (!event) return

  const choice     = event.choices[choiceIndex]
  const effect     = choice.effect
  const remainingMs = Math.max(0, event.originalArrivalTime - Date.now())

  pendingEvent.set(null)
  applyEffect(effect, remainingMs, event.destinationId)
}

function applyEffect(effect, remainingMs, destinationId) {
  const $p = get(player)

  switch (effect.type) {
    case 'none':
      resumeAfterEvent(remainingMs)
      addLog('Event resolved — continuing course.', 'info')
      break

    case 'delay':
      resumeAfterEvent(remainingMs * effect.multiplier)
      addLog(`Course delayed (×${effect.multiplier}).`, 'warning')
      break

    case 'credits': {
      player.update(p => ({ ...p, credits: Math.max(0, p.credits + effect.amount) }))
      resumeAfterEvent(effect.delay ? remainingMs + effect.delay * 1000 : remainingMs)
      if (effect.amount > 0) addLog(`Received ${effect.amount} ¢.`, 'info')
      else if (effect.amount < 0) addLog(`Spent ${Math.abs(effect.amount)} ¢.`, 'warning')
      break
    }

    case 'damage': {
      const dmgPct = effect.amount ?? 10
      player.update(p => ({ ...p, damage: Math.min(100, p.damage + dmgPct) }))
      resumeAfterEvent(remainingMs)
      addLog(`Ship took ${dmgPct}% damage!`, 'danger')
      break
    }

    case 'pirate_toll': {
      const toll = Math.round(get(cargoValue) * effect.percent)
      player.update(p => ({ ...p, credits: Math.max(0, p.credits - toll) }))
      resumeAfterEvent(remainingMs)
      addLog(`Paid pirate toll: ${toll} ¢.`, 'danger')
      break
    }

    case 'escape_attempt': {
      const ok = Math.random() > 0.5
      if (ok) {
        resumeAfterEvent(remainingMs)
        addLog('Escaped the pirates!', 'info')
      } else {
        applyEffect(effect.failEffect, remainingMs, destinationId)
      }
      break
    }

    case 'distress_rescue': {
      const ok = Math.random() < 0.4
      if (ok) {
        resumeAfterEvent(remainingMs)
        addLog('Alliance patrol arrived in time — pirates fled!', 'info')
      } else {
        applyEffect(effect.failEffect, remainingMs, destinationId)
      }
      break
    }

    case 'cargo_loss': {
      player.update(p => {
        const newCargo = { ...p.cargo }
        let toRemove = Math.ceil(Object.values(newCargo).reduce((s, q) => s + q, 0) * effect.percent)
        for (const id of Object.keys(newCargo)) {
          if (toRemove <= 0) break
          const remove = Math.min(newCargo[id], toRemove)
          newCargo[id] -= remove
          if (newCargo[id] <= 0) delete newCargo[id]
          toRemove -= remove
        }
        return { ...p, cargo: newCargo }
      })
      resumeAfterEvent(remainingMs)
      addLog(`Lost ${Math.round(effect.percent * 100)}% of cargo.`, 'danger')
      break
    }

    case 'salvage': {
      const value = Math.round(effect.minValue + Math.random() * (effect.maxValue - effect.minValue))
      const id    = commodities[Math.floor(Math.random() * commodities.length)].id
      const ship  = getShip($p.shipId)
      const space = (ship?.cargoCapacity ?? 50) - get(cargoUnits)
      const qty   = Math.max(1, Math.min(Math.floor(value / 50), space))
      if (qty > 0) {
        player.update(p => ({
          ...p,
          cargo: { ...p.cargo, [id]: (p.cargo[id] ?? 0) + qty },
        }))
        addLog(`Salvaged ${qty} tons of ${getCommodity(id)?.name}.`, 'info')
      }
      resumeAfterEvent(remainingMs + effect.delay * 1000)
      break
    }

    case 'rescue':
      player.update(p => ({ ...p, credits: p.credits + effect.credits }))
      resumeAfterEvent(remainingMs + effect.delay * 1000)
      addLog(`Rescued civilians — received ${effect.credits} ¢ gratitude payment.`, 'info')
      break

    case 'wormhole': {
      const topLevel = locations.filter(l => !l.parentId && l.id !== 'space')
      const dest     = topLevel[Math.floor(Math.random() * topLevel.length)]
      clearInterval(travelInterval)
      addLog(`Wormhole! Emerged near ${dest.name}.`, 'info')
      beginDocking(dest.id, 0)
      break
    }

    case 'risky_push': {
      if (Math.random() < effect.failChance) {
        applyEffect(effect.failEffect, remainingMs, destinationId)
      } else {
        resumeAfterEvent(remainingMs)
        addLog('Pushed through — no damage.', 'info')
      }
      break
    }

    case 'sell_premium': {
      const $mp  = get(marketPrices)
      const dest = getLocation($p.travellingTo ?? $p.locationId)
      const prices = $mp[dest?.id]
      if (prices) {
        let bestId = null, bestQty = 0
        for (const [id, qty] of Object.entries($p.cargo)) {
          if (qty > bestQty) { bestId = id; bestQty = qty }
        }
        if (bestId && prices[bestId]) {
          const income = Math.round(prices[bestId].sellPrice * effect.multiplier * bestQty)
          player.update(p => {
            const newCargo = { ...p.cargo }
            delete newCargo[bestId]
            return { ...p, cargo: newCargo, credits: p.credits + income }
          })
          addLog(`Sold ${bestQty}t ${getCommodity(bestId)?.name} to trader for ${income} ¢.`, 'info')
        }
      }
      resumeAfterEvent(remainingMs)
      break
    }

    case 'comet_harvest': {
      const ship  = getShip($p.shipId)
      const space = Math.min(15, (ship?.cargoCapacity ?? 50) - get(cargoUnits))
      if (space > 0) {
        const org   = Math.ceil(space * 0.6)
        const water = Math.floor(space * 0.4)
        player.update(p => ({
          ...p,
          cargo: {
            ...p.cargo,
            organics: (p.cargo.organics ?? 0) + org,
            water:    (p.cargo.water    ?? 0) + water,
          },
        }))
        addLog(`Harvested ${org}t organics and ${water}t water ice from comet.`, 'info')
      }
      resumeAfterEvent(remainingMs + effect.delay * 1000)
      break
    }

    default:
      resumeAfterEvent(remainingMs)
  }
}

// ─── Trading ─────────────────────────────────────────────────────────────────

export function buyItem(commodityId, quantity) {
  const $p    = get(player)
  const $mp   = get(marketPrices)
  const $ms   = get(marketStock)
  const ship  = getShip($p.shipId)
  const prices = $mp[$p.locationId]

  if (!prices || $p.status !== 'docked') return

  const available = $ms[$p.locationId]?.[commodityId]?.stock ?? 0
  const actualQty = Math.min(quantity, available)
  if (actualQty <= 0) { addLog('None in stock.', 'warning'); return }

  const price    = prices[commodityId]?.buyPrice ?? 0
  const totalCost = price * actualQty
  const space    = (ship?.cargoCapacity ?? 0) - get(cargoUnits)

  if (actualQty > space) { addLog('Not enough cargo space.', 'warning'); return }
  if ($p.credits < totalCost) { addLog('Not enough credits.', 'warning'); return }

  player.update(p => ({
    ...p,
    credits: p.credits - totalCost,
    cargo: { ...p.cargo, [commodityId]: (p.cargo[commodityId] ?? 0) + actualQty },
  }))

  marketStock.update(ms => {
    const locStock = { ...ms[$p.locationId] }
    locStock[commodityId] = { ...locStock[commodityId], stock: Math.max(0, locStock[commodityId].stock - actualQty) }
    return { ...ms, [$p.locationId]: locStock }
  })

  addLog(`Bought ${actualQty}t ${getCommodity(commodityId)?.name} for ${totalCost} ¢.`, 'trade')
}

export function sellItem(commodityId, quantity) {
  const $p    = get(player)
  const $mp   = get(marketPrices)
  const $ms   = get(marketStock)
  const prices = $mp[$p.locationId]

  if (!prices || $p.status !== 'docked') return

  const inCargo  = $p.cargo[commodityId] ?? 0
  const actualQty = Math.min(quantity, inCargo)
  if (actualQty <= 0) return

  const price  = prices[commodityId]?.sellPrice ?? 0
  const income = price * actualQty

  player.update(p => {
    const newCargo = { ...p.cargo }
    newCargo[commodityId] = (newCargo[commodityId] ?? 0) - actualQty
    if (newCargo[commodityId] <= 0) delete newCargo[commodityId]
    return { ...p, credits: p.credits + income, cargo: newCargo }
  })

  if ($ms[$p.locationId]?.[commodityId]) {
    marketStock.update(ms => {
      const locStock = { ...ms[$p.locationId] }
      const info = locStock[commodityId]
      locStock[commodityId] = { ...info, stock: Math.min(info.stockCap, info.stock + actualQty) }
      return { ...ms, [$p.locationId]: locStock }
    })
  }

  addLog(`Sold ${actualQty}t ${getCommodity(commodityId)?.name} for ${income} ¢.`, 'trade')
}

// ─── Ship fleet ──────────────────────────────────────────────────────────────

export function buyShip(newShipId, action) {
  // action: 'tradein' | 'store'
  const $p        = get(player)
  const curShip   = getShip($p.shipId)
  const newShipData = getShip(newShipId)
  const loc       = getLocation($p.locationId)

  if (!newShipData || !loc?.hasShipyard || $p.status !== 'docked') return
  if (newShipId === $p.shipId) return

  const tiv    = tradeInValue(curShip, $p.mileage, $p.damage)
  const credit = action === 'tradein' ? tiv : 0
  const netCost = newShipData.price - credit

  if ($p.credits < netCost) {
    addLog(`Need ${netCost.toLocaleString()} ¢ (after ${credit.toLocaleString()} ¢ trade-in).`, 'warning')
    return
  }

  const newCargo = trimCargo($p.cargo, newShipData.cargoCapacity)
  let newFleet   = [...$p.fleet]

  if (action === 'store') {
    newFleet.push({
      shipId:     $p.shipId,
      locationId: $p.locationId,
      mileage:    $p.mileage,
      damage:     $p.damage,
    })
  }

  player.update(p => ({
    ...p,
    credits: p.credits - netCost,
    shipId:  newShipId,
    cargo:   newCargo,
    mileage: 0,
    damage:  0,
    fleet:   newFleet,
  }))

  const verb = action === 'tradein'
    ? `Traded in ${curShip?.name} (${tiv.toLocaleString()} ¢), bought ${newShipData.name}.`
    : `Stored ${curShip?.name} here, boarded ${newShipData.name}.`
  addLog(verb, 'info')
}

export function retrieveShip(fleetShipId) {
  const $p  = get(player)
  const loc = getLocation($p.locationId)
  if (!loc?.hasShipyard || $p.status !== 'docked') return

  const idx = $p.fleet.findIndex(f => f.shipId === fleetShipId && f.locationId === $p.locationId)
  if (idx === -1) return

  const stored    = $p.fleet[idx]
  const newFleet  = $p.fleet.filter((_, i) => i !== idx)
  const newShipData = getShip(fleetShipId)
  const newCargo  = trimCargo($p.cargo, newShipData?.cargoCapacity ?? 50)

  // Put current ship into fleet at this location
  newFleet.push({
    shipId:     $p.shipId,
    locationId: $p.locationId,
    mileage:    $p.mileage,
    damage:     $p.damage,
  })

  player.update(p => ({
    ...p,
    shipId:  fleetShipId,
    cargo:   newCargo,
    mileage: stored.mileage,
    damage:  stored.damage,
    fleet:   newFleet,
  }))

  const curName = getShip($p.shipId)?.name
  addLog(`Swapped to ${newShipData?.name}. Stored ${curName} at ${loc.name}.`, 'info')
}

// ─── NPC AI ───────────────────────────────────────────────────────────────────

// Inline price calculation mirroring stockPrice() to avoid import cycles
function npcBuyPrice(info) {
  const ratio = info.stockCap > 0 ? Math.min(1, info.stock / info.stockCap) : 0.5
  const mult  = info.isProducer ? 0.30 + (1-ratio)*0.25
              : info.isConsumer ? 1.50 + (1-ratio)*1.30
              : 0.85 + (1-ratio)*0.30
  return Math.round(info.basePrice * Math.max(0.1, mult) * 1.08)
}
function npcSellPrice(info) {
  const ratio = info.stockCap > 0 ? Math.min(1, info.stock / info.stockCap) : 0.5
  const mult  = info.isProducer ? 0.30 + (1-ratio)*0.25
              : info.isConsumer ? 1.50 + (1-ratio)*1.30
              : 0.85 + (1-ratio)*0.30
  return Math.round(info.basePrice * Math.max(0.1, mult) * 0.72)
}

function npcTick() {
  const $ms   = get(marketStock)
  const $npcs = get(npcs)
  const now   = Date.now()

  // Collect all stock changes as deltas, apply once at end
  const stockDeltas = {}  // { locId: { commId: delta } }
  function addDelta(locId, commId, delta) {
    if (!stockDeltas[locId]) stockDeltas[locId] = {}
    stockDeltas[locId][commId] = (stockDeltas[locId][commId] ?? 0) + delta
  }
  function effectiveStock(locId, commId) {
    const base  = $ms[locId]?.[commId]?.stock ?? 0
    const delta = stockDeltas[locId]?.[commId] ?? 0
    return Math.max(0, base + delta)
  }

  const updated = $npcs.map(npc => {
    // Arrived?
    if (npc.status === 'travelling' && now >= npc.arrivalTime) {
      const destStock = $ms[npc.travellingTo]
      let income = 0
      if (destStock) {
        for (const [commId, qty] of Object.entries(npc.cargo)) {
          const info = destStock[commId]
          if (info) {
            income += npcSellPrice(info) * qty
            addDelta(npc.travellingTo, commId, qty)
          }
        }
      }
      return {
        ...npc,
        status: 'docked',
        locationId: npc.travellingTo,
        travellingTo: null,
        departedFromId: null,
        departedAt: null,
        arrivalTime: null,
        cargo: {},
        credits: npc.credits + income,
      }
    }

    // Find a trade route
    if (npc.status === 'docked') {
      const ship    = getShip(npc.shipId)
      const srcLoc  = getLocation(npc.locationId)
      const srcStock = $ms[npc.locationId]
      if (!ship || !srcLoc || !srcStock) return npc

      let bestProfit = 100  // minimum to be worth moving
      let bestCommId = null
      let bestDestId = null
      let bestQty    = 0

      for (const destLoc of locations) {
        if (destLoc.id === npc.locationId || destLoc.id === 'space' || destLoc.parentId) continue
        const dist = travelDistance(srcLoc, destLoc)
        if (dist > ship.jumpDistance) continue
        const destStock = $ms[destLoc.id]
        if (!destStock) continue

        for (const comm of commodities) {
          const srcInfo  = srcStock[comm.id]
          const destInfo = destStock[comm.id]
          if (!srcInfo || !destInfo) continue

          const avail = effectiveStock(npc.locationId, comm.id)
          if (avail < 1) continue

          const buyP  = npcBuyPrice(srcInfo)
          const sellP = npcSellPrice(destInfo)
          if (sellP <= buyP) continue

          const profitPerUnit = sellP - buyP
          const canAfford = buyP > 0 ? Math.floor(npc.credits / buyP) : 0
          const qty = Math.min(canAfford, ship.cargoCapacity, avail)
          const totalProfit = profitPerUnit * qty

          if (totalProfit > bestProfit) {
            bestProfit = totalProfit
            bestCommId = comm.id
            bestDestId = destLoc.id
            bestQty    = qty
          }
        }
      }

      if (bestCommId && bestDestId && bestQty > 0) {
        const srcInfo = srcStock[bestCommId]
        const cost    = npcBuyPrice(srcInfo) * bestQty
        addDelta(npc.locationId, bestCommId, -bestQty)

        const toLoc = getLocation(bestDestId)
        const dist  = travelDistance(srcLoc, toLoc)
        const secs  = realTravelSecs(dist, ship.speed)

        return {
          ...npc,
          status: 'travelling',
          travellingTo: bestDestId,
          departedFromId: npc.locationId,
          departedAt: now,
          arrivalTime: now + secs * 1000,
          cargo: { [bestCommId]: bestQty },
          credits: npc.credits - cost,
        }
      }
    }

    return npc
  })

  // Apply accumulated stock deltas
  if (Object.keys(stockDeltas).length > 0) {
    marketStock.update(ms => {
      const result = { ...ms }
      for (const [locId, changes] of Object.entries(stockDeltas)) {
        if (!result[locId]) continue
        const locStock = { ...result[locId] }
        for (const [commId, delta] of Object.entries(changes)) {
          if (locStock[commId]) {
            locStock[commId] = {
              ...locStock[commId],
              stock: Math.max(0, Math.min(locStock[commId].stockCap, locStock[commId].stock + delta)),
            }
          }
        }
        result[locId] = locStock
      }
      return result
    })
  }

  npcs.set(updated)
}

// ─── Stock replenishment ──────────────────────────────────────────────────────

function replenishStock() {
  marketStock.update(ms => {
    const result = {}
    for (const [locId, locStock] of Object.entries(ms)) {
      const updated = {}
      for (const [commId, info] of Object.entries(locStock)) {
        let newStock = info.stock
        // Producers generate supply
        if (info.isProducer) newStock += info.supplyRate
        // Small passive trickle for all (prevents total lock-out)
        else newStock += Math.ceil(info.supplyRate * 0.15)
        // Consumers slowly drain (simulating local usage)
        if (info.isConsumer) newStock -= Math.ceil(info.consumeRate * 0.25)
        // Floor at 5% of capacity so markets never fully dry up
        const floor = Math.max(1, Math.round(info.stockCap * 0.05))
        newStock = Math.max(floor, Math.min(info.stockCap, Math.round(newStock)))
        updated[commId] = { ...info, stock: newStock }
      }
      result[locId] = updated
    }
    return result
  })
}

// ─── Init ─────────────────────────────────────────────────────────────────────

// Pre-seed stock for all locations that have a market (planets, moons, stations)
for (const loc of locations) {
  if (loc.hasMarket) ensureMarketStock(loc.id)
}

addLog('Welcome to Space Flight Inc. Docked at Earth. Good luck, Commander.', 'info')

// NPC AI — runs every 10 seconds
setInterval(npcTick, 10000)

// Stock replenishment — runs every 30 seconds
setInterval(replenishStock, 30000)
