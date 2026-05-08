import { writable, derived, get } from 'svelte/store'
import { getLocation, travelDistance, locations } from '../data/locations.js'
import { getShip } from '../data/ships.js'
import { generateMarketPrices, getCommodity, commodities } from '../data/commodities.js'
import { rollEvent } from '../data/events.js'

// ─── State ──────────────────────────────────────────────────────────────────

export const player = writable({
  credits: 5000,
  shipId: 'dart-i',
  cargo: {},           // { commodityId: quantity }
  locationId: 'earth',
  status: 'docked',    // 'docked' | 'travelling' | 'docking' | 'event'
  travellingTo: null,
  arrivalTime: null,
  dockingUntil: null,
  statusMessage: 'Docked at Earth',
})

export const logs = writable([])
export const pendingEvent = writable(null)
export const selectedLocationId = writable('earth')
export const marketPrices = writable({})

// ─── Derived ────────────────────────────────────────────────────────────────

export const currentLocation = derived(player, $p => getLocation($p.locationId))
export const currentShip = derived(player, $p => getShip($p.shipId))

export const cargoUnits = derived(player, $p =>
  Object.values($p.cargo).reduce((sum, q) => sum + q, 0)
)

export const cargoValue = derived([player, marketPrices], ([$p, $mp]) => {
  const locId = $p.locationId
  const prices = $mp[locId]
  if (!prices) return 0
  return Object.entries($p.cargo).reduce((sum, [id, qty]) => {
    return sum + (prices[id]?.sellPrice ?? 0) * qty
  }, 0)
})

// ─── Internal helpers ────────────────────────────────────────────────────────

let travelInterval = null
let dockingInterval = null

function addLog(message, type = 'info') {
  logs.update(ls => [{ message, type, time: new Date().toLocaleTimeString() }, ...ls.slice(0, 49)])
}

function ensureMarketPrices(locationId) {
  const mp = get(marketPrices)
  if (!mp[locationId]) {
    const loc = getLocation(locationId)
    if (loc) {
      marketPrices.update(m => ({ ...m, [locationId]: generateMarketPrices(loc) }))
    }
  }
}

// ─── Travel ─────────────────────────────────────────────────────────────────

export function startTravel(destinationId) {
  const $player = get(player)
  const $ship = getShip($player.shipId)
  const fromLoc = getLocation($player.locationId)
  const toLoc = getLocation(destinationId)

  if (!toLoc || !$ship) return

  const dist = travelDistance(fromLoc, toLoc)
  if (dist > $ship.jumpDistance) {
    addLog(`${toLoc.name} is out of jump range (${dist.toFixed(1)} > ${$ship.jumpDistance} dunits)`, 'warning')
    return
  }

  const travelSecs = Math.max(3, Math.round(dist / $ship.speed))
  const arrivalTime = Date.now() + travelSecs * 1000

  if (travelInterval) clearInterval(travelInterval)

  player.update(p => ({
    ...p,
    status: 'travelling',
    locationId: 'space',
    travellingTo: destinationId,
    arrivalTime,
    statusMessage: `Travelling to ${toLoc.name}`,
  }))

  addLog(`Departed for ${toLoc.name} — ETA ${travelSecs}s`, 'travel')

  // Roll for a random event partway through
  const event = rollEvent()
  let eventFired = false
  const eventTriggerTime = event ? arrivalTime - travelSecs * 1000 * (0.3 + Math.random() * 0.5) : null

  travelInterval = setInterval(() => {
    const now = Date.now()
    const $p = get(player)

    // Fire random event
    if (event && !eventFired && eventTriggerTime && now >= eventTriggerTime && $p.status === 'travelling') {
      eventFired = true
      clearInterval(travelInterval)
      pendingEvent.set({ ...event, destinationId, originalArrivalTime: $p.arrivalTime })
      player.update(p => ({ ...p, status: 'event' }))
      return
    }

    if (now >= $p.arrivalTime && $p.status === 'travelling') {
      clearInterval(travelInterval)
      beginDocking(destinationId)
    }
  }, 500)
}

export function resumeAfterEvent(remainingMs) {
  const $player = get(player)
  const destinationId = $player.travellingTo
  const newArrivalTime = Date.now() + remainingMs

  player.update(p => ({
    ...p,
    status: 'travelling',
    arrivalTime: newArrivalTime,
  }))

  travelInterval = setInterval(() => {
    const now = Date.now()
    const $p = get(player)
    if (now >= $p.arrivalTime && $p.status === 'travelling') {
      clearInterval(travelInterval)
      beginDocking(destinationId)
    }
  }, 500)
}

function beginDocking(destinationId) {
  const loc = getLocation(destinationId)
  const dockSecs = 4
  const dockingUntil = Date.now() + dockSecs * 1000

  player.update(p => ({
    ...p,
    status: 'docking',
    locationId: destinationId,
    travellingTo: null,
    arrivalTime: null,
    dockingUntil,
    statusMessage: `Docking at ${loc?.name}`,
  }))

  addLog(`Arrived at ${loc?.name} — docking`, 'travel')

  dockingInterval = setInterval(() => {
    const now = Date.now()
    const $p = get(player)
    if (now >= $p.dockingUntil) {
      clearInterval(dockingInterval)
      completeDocking(destinationId)
    }
  }, 500)
}

function completeDocking(locationId) {
  const loc = getLocation(locationId)
  ensureMarketPrices(locationId)

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

// ─── Event resolution ────────────────────────────────────────────────────────

export function resolveEvent(choiceIndex) {
  const event = get(pendingEvent)
  if (!event) return

  const choice = event.choices[choiceIndex]
  const effect = choice.effect
  const $player = get(player)
  const remainingMs = Math.max(0, event.originalArrivalTime - Date.now())

  pendingEvent.set(null)

  applyEffect(effect, remainingMs, event.destinationId)
}

function applyEffect(effect, remainingMs, destinationId) {
  const $player = get(player)

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

    case 'pirate_toll': {
      const $cv = get(cargoValue)
      const toll = Math.round($cv * effect.percent)
      player.update(p => ({ ...p, credits: Math.max(0, p.credits - toll) }))
      resumeAfterEvent(remainingMs)
      addLog(`Paid pirate toll: ${toll} ¢.`, 'danger')
      break
    }

    case 'escape_attempt': {
      const success = Math.random() > 0.5
      if (success) {
        resumeAfterEvent(remainingMs)
        addLog('Escaped the pirates!', 'info')
      } else {
        applyEffect(effect.failEffect, remainingMs, destinationId)
      }
      break
    }

    case 'distress_rescue': {
      const success = Math.random() < 0.4
      if (success) {
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
          newCargo[id] = (newCargo[id] || 0) - remove
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
      const commodityIds = commodities.map(c => c.id)
      const id = commodityIds[Math.floor(Math.random() * commodityIds.length)]
      const ship = getShip($player.shipId)
      const current = get(cargoUnits)
      const space = (ship?.cargoCapacity ?? 50) - current
      const qty = Math.max(1, Math.min(Math.floor(value / 50), space))
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
      const dest = topLevel[Math.floor(Math.random() * topLevel.length)]
      clearInterval(travelInterval)
      addLog(`Wormhole! Emerged near ${dest.name}.`, 'info')
      beginDocking(dest.id)
      break
    }

    case 'risky_push': {
      const fails = Math.random() < effect.failChance
      if (fails) {
        applyEffect(effect.failEffect, remainingMs, destinationId)
      } else {
        resumeAfterEvent(remainingMs)
        addLog('Pushed through — no damage.', 'info')
      }
      break
    }

    case 'sell_premium': {
      const $mp = get(marketPrices)
      const closestPlanet = getLocation($player.travellingTo ?? $player.locationId)
      const prices = $mp[closestPlanet?.id]
      if (prices && Object.keys($player.cargo).length > 0) {
        let bestId = null
        let bestQty = 0
        for (const [id, qty] of Object.entries($player.cargo)) {
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
      const ship = getShip($player.shipId)
      const current = get(cargoUnits)
      const space = Math.min(15, (ship?.cargoCapacity ?? 50) - current)
      if (space > 0) {
        const organicsQty = Math.ceil(space * 0.6)
        const waterQty = Math.floor(space * 0.4)
        player.update(p => ({
          ...p,
          cargo: {
            ...p.cargo,
            organics: (p.cargo.organics ?? 0) + organicsQty,
            water: (p.cargo.water ?? 0) + waterQty,
          },
        }))
        addLog(`Harvested ${organicsQty}t organics and ${waterQty}t water ice from comet.`, 'info')
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
  const $player = get(player)
  const $mp = get(marketPrices)
  const prices = $mp[$player.locationId]
  const ship = getShip($player.shipId)
  const currentUnits = get(cargoUnits)

  if (!prices || $player.status !== 'docked') return
  const price = prices[commodityId]?.buyPrice ?? 0
  const totalCost = price * quantity
  const spaceAvailable = ship.cargoCapacity - currentUnits

  if (quantity > spaceAvailable) {
    addLog('Not enough cargo space.', 'warning'); return
  }
  if ($player.credits < totalCost) {
    addLog('Not enough credits.', 'warning'); return
  }

  player.update(p => ({
    ...p,
    credits: p.credits - totalCost,
    cargo: { ...p.cargo, [commodityId]: (p.cargo[commodityId] ?? 0) + quantity },
  }))
  addLog(`Bought ${quantity}t ${getCommodity(commodityId)?.name} for ${totalCost} ¢.`, 'trade')
}

export function sellItem(commodityId, quantity) {
  const $player = get(player)
  const $mp = get(marketPrices)
  const prices = $mp[$player.locationId]

  if (!prices || $player.status !== 'docked') return
  const inCargo = $player.cargo[commodityId] ?? 0
  const actualQty = Math.min(quantity, inCargo)
  if (actualQty <= 0) return

  const price = prices[commodityId]?.sellPrice ?? 0
  const income = price * actualQty

  player.update(p => {
    const newCargo = { ...p.cargo }
    newCargo[commodityId] = (newCargo[commodityId] ?? 0) - actualQty
    if (newCargo[commodityId] <= 0) delete newCargo[commodityId]
    return { ...p, credits: p.credits + income, cargo: newCargo }
  })
  addLog(`Sold ${actualQty}t ${getCommodity(commodityId)?.name} for ${income} ¢.`, 'trade')
}

// ─── Ship store ──────────────────────────────────────────────────────────────

export function buyShip(newShipId) {
  const $player = get(player)
  const currentShipData = getShip($player.shipId)
  const newShipData = getShip(newShipId)
  const loc = getLocation($player.locationId)

  if (!newShipData || !loc?.hasShipyard || $player.status !== 'docked') return

  const tradeinValue = Math.round((currentShipData?.price ?? 0) * 0.55)
  const netCost = newShipData.price - tradeinValue

  if ($player.credits < netCost) {
    addLog(`Not enough credits. Need ${netCost} ¢ (after ${tradeinValue} ¢ trade-in).`, 'warning'); return
  }

  // Trim cargo to new ship's capacity
  const newCapacity = newShipData.cargoCapacity
  const newCargo = { ...$player.cargo }
  let total = Object.values(newCargo).reduce((s, q) => s + q, 0)
  for (const id of Object.keys(newCargo)) {
    if (total <= newCapacity) break
    const excess = total - newCapacity
    const remove = Math.min(newCargo[id], excess)
    newCargo[id] -= remove
    if (newCargo[id] <= 0) delete newCargo[id]
    total -= remove
  }

  player.update(p => ({
    ...p,
    credits: p.credits - netCost,
    shipId: newShipId,
    cargo: newCargo,
  }))
  addLog(`Purchased ${newShipData.name} for ${netCost} ¢ net (${tradeinValue} ¢ trade-in).`, 'info')
}

// ─── Init ────────────────────────────────────────────────────────────────────

ensureMarketPrices('earth')
addLog('Welcome to Space Flight Inc. Docked at Earth. Good luck, Commander.', 'info')
