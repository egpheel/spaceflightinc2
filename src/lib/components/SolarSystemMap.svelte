<script>
  import { onMount, onDestroy } from 'svelte'
  import { player, currentShip, selectedLocationId, npcs, startTravel } from '../stores/gameStore.js'
  import {
    locations, comets,
    currentAngle, orbitPosition, bodyPosition, travelDistance,
    cometSVGPosition, cometOrbitEllipse,
    getLocation, getMoons, getPlanets,
  } from '../data/locations.js'

  // ── ViewBox state (pan + zoom) ─────────────────────────────────────────────
  let vbX = -500, vbY = -500, vbW = 1000, vbH = 1000
  $: viewBox = `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`

  const VB_MIN = 220   // max zoom-in
  const VB_MAX = 2200  // max zoom-out

  function clampVB() {
    vbW = Math.max(VB_MIN, Math.min(VB_MAX, vbW))
    vbH = vbW  // maintain square aspect
    vbX = Math.max(-2500, Math.min(2500, vbX))
    vbY = Math.max(-2500, Math.min(2500, vbY))
  }

  // ── Drag (mouse) ───────────────────────────────────────────────────────────
  let svgEl
  let isDragging = false
  let dragX = 0, dragY = 0

  function onMouseDown(e) {
    if (e.button !== 0) return
    isDragging = true
    dragX = e.clientX
    dragY = e.clientY
    e.preventDefault()
  }
  function onMouseMove(e) {
    if (!isDragging || !svgEl) return
    const rect  = svgEl.getBoundingClientRect()
    const scaleX = vbW / rect.width
    const scaleY = vbH / rect.height
    vbX -= (e.clientX - dragX) * scaleX
    vbY -= (e.clientY - dragY) * scaleY
    dragX = e.clientX
    dragY = e.clientY
    clampVB()
  }
  function onMouseUp() { isDragging = false }

  // ── Scroll-wheel zoom ──────────────────────────────────────────────────────
  function onWheel(e) {
    if (!svgEl) return
    e.preventDefault()
    const factor = e.deltaY < 0 ? 0.85 : 1.18
    const rect   = svgEl.getBoundingClientRect()
    // Mouse position in SVG space
    const mx = vbX + ((e.clientX - rect.left) / rect.width)  * vbW
    const my = vbY + ((e.clientY - rect.top)  / rect.height) * vbH
    const newW = vbW * factor
    const newH = vbH * factor
    vbX = mx - ((e.clientX - rect.left) / rect.width)  * newW
    vbY = my - ((e.clientY - rect.top)  / rect.height) * newH
    vbW = newW
    vbH = newH
    clampVB()
  }

  // ── Touch (pan + pinch zoom) ───────────────────────────────────────────────
  let lastTouchDist = null
  let lastTouchX = 0, lastTouchY = 0
  let lastMidX = 0, lastMidY = 0

  function getTouchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    return Math.sqrt(dx*dx + dy*dy)
  }
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      lastTouchDist = getTouchDist(e)
      lastMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      lastMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    } else if (e.touches.length === 1) {
      lastTouchX = e.touches[0].clientX
      lastTouchY = e.touches[0].clientY
      lastTouchDist = null
    }
  }
  function onTouchMove(e) {
    e.preventDefault()
    if (!svgEl) return
    const rect = svgEl.getBoundingClientRect()

    if (e.touches.length === 2 && lastTouchDist) {
      const dist  = getTouchDist(e)
      const midX  = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY  = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const factor = lastTouchDist / dist

      // Zoom centred on pinch midpoint
      const mx = vbX + ((midX - rect.left) / rect.width)  * vbW
      const my = vbY + ((midY - rect.top)  / rect.height) * vbH
      vbW *= factor
      vbH = vbW
      vbX = mx - ((midX - rect.left) / rect.width)  * vbW
      vbY = my - ((midY - rect.top)  / rect.height) * vbH

      // Pan by midpoint movement
      vbX -= (midX - lastMidX) * (vbW / rect.width)
      vbY -= (midY - lastMidY) * (vbH / rect.height)

      lastTouchDist = dist
      lastMidX = midX
      lastMidY = midY
      clampVB()
    } else if (e.touches.length === 1 && !lastTouchDist) {
      const dx = e.touches[0].clientX - lastTouchX
      const dy = e.touches[0].clientY - lastTouchY
      vbX -= dx * (vbW / rect.width)
      vbY -= dy * (vbH / rect.height)
      lastTouchX = e.touches[0].clientX
      lastTouchY = e.touches[0].clientY
      clampVB()
    }
  }
  function onTouchEnd() { lastTouchDist = null }

  // ── Zoom buttons ───────────────────────────────────────────────────────────
  function zoomIn()  { vbW *= 0.75; vbH = vbW; clampVB() }
  function zoomOut() { vbW *= 1.33; vbH = vbW; clampVB() }
  function resetView() { vbX = -500; vbY = -500; vbW = 1000; vbH = 1000 }

  // ── Live orbit animation ───────────────────────────────────────────────────
  const topLevelLocations = getPlanets()
  let planetAngles = {}
  let cometPositions = {}
  let animFrame

  function updateOrbits() {
    const now  = Date.now()
    const angles = {}
    for (const loc of topLevelLocations) {
      angles[loc.id] = loc.orbitalPeriodDays
        ? currentAngle(loc.startAngle, loc.orbitalPeriodDays)
        : (loc.startAngle ?? 0)
    }
    planetAngles = angles

    const cPos = {}
    for (const c of comets) cPos[c.id] = cometSVGPosition(c, now)
    cometPositions = cPos

    animFrame = requestAnimationFrame(updateOrbits)
  }

  onMount(() => { animFrame = requestAnimationFrame(updateOrbits) })
  onDestroy(() => { if (animFrame) cancelAnimationFrame(animFrame) })

  // ── Position helpers ───────────────────────────────────────────────────────
  function getPlanetPos(loc) {
    const angle = planetAngles[loc.id] ?? loc.startAngle ?? 0
    return orbitPosition(loc.orbitRadius, angle)
  }

  function getSVGPos(locationId) {
    if (!locationId || locationId === 'space') return null
    const loc = getLocation(locationId)
    if (!loc) return null
    if (loc.parentId) {
      const parent = topLevelLocations.find(l => l.id === loc.parentId)
      return parent ? getPlanetPos(parent) : null
    }
    const top = topLevelLocations.find(l => l.id === loc.id)
    return top ? getPlanetPos(top) : null
  }

  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)) }

  // ── Player position (ping at current/destination planet) ───────────────────
  $: playerLoc = getLocation($player.locationId) ?? getLocation($player.travellingTo)
  $: playerParentId = playerLoc?.parentId ?? null
  $: playerPlanetLoc = playerParentId
    ? (topLevelLocations.find(l => l.id === playerParentId) ?? playerLoc)
    : (topLevelLocations.find(l => l.id === playerLoc?.id) ?? null)
  $: playerPos = playerPlanetLoc
    ? orbitPosition(playerPlanetLoc.orbitRadius, planetAngles[playerPlanetLoc.id] ?? playerPlanetLoc.startAngle ?? 0)
    : { x: 0, y: 0 }

  // ── Player ship animated position (lerps during travel) ────────────────────
  $: playerShipPos = (() => {
    const _ = planetAngles  // always re-run every animation frame
    if ($player.status === 'travelling'
        && $player.departedFromId
        && $player.travellingTo
        && $player.departedAt
        && $player.arrivalTime) {
      const t    = ($player.arrivalTime - $player.departedAt)
      const frac = t > 0 ? (Date.now() - $player.departedAt) / t : 1
      const from = getSVGPos($player.departedFromId)
      const to   = getSVGPos($player.travellingTo)
      if (from && to) {
        return { x: lerp(from.x, to.x, frac), y: lerp(from.y, to.y, frac) }
      }
    }
    return playerPos
  })()

  // ── Travel destination ─────────────────────────────────────────────────────
  $: destLoc = $player.travellingTo ? getLocation($player.travellingTo) : null
  $: destPlanetLoc = destLoc
    ? (destLoc.parentId
        ? topLevelLocations.find(l => l.id === destLoc.parentId)
        : topLevelLocations.find(l => l.id === destLoc.id))
    : null
  $: destPos = destPlanetLoc
    ? orbitPosition(destPlanetLoc.orbitRadius, planetAngles[destPlanetLoc.id] ?? destPlanetLoc.startAngle ?? 0)
    : null

  // ── Selected location ──────────────────────────────────────────────────────
  $: selectedLoc = getLocation($selectedLocationId)
  $: selectedPlanetLoc = selectedLoc
    ? (selectedLoc.parentId
        ? topLevelLocations.find(l => l.id === selectedLoc.parentId)
        : topLevelLocations.find(l => l.id === selectedLoc.id))
    : null

  // ── Reachable check ────────────────────────────────────────────────────────
  $: currentLoc = getLocation($player.locationId)
  function isReachable(loc) {
    if (!currentLoc || !$currentShip) return false
    const dist = travelDistance(currentLoc, loc)
    return dist <= $currentShip.jumpDistance && loc.id !== $player.locationId
  }

  // ── NPC positions (lerped, sensor-filtered) ───────────────────────────────
  $: npcPositions = (() => {
    const _tick   = planetAngles  // re-run every animation frame
    const pLoc    = getLocation($player.locationId) ?? getLocation($player.travellingTo)
    const pDu     = pLoc ? bodyPosition(pLoc) : { x: 0, y: 0 }
    const range   = $currentShip?.sensorRange ?? 100

    return $npcs.map(npc => {
      // Sensor range check in dunits
      const nLocId = npc.status === 'travelling' ? (npc.travellingTo ?? npc.departedFromId) : npc.locationId
      const nLoc   = getLocation(nLocId)
      if (nLoc) {
        const nDu = bodyPosition(nLoc)
        const dx = pDu.x - nDu.x
        const dy = pDu.y - nDu.y
        if (Math.sqrt(dx * dx + dy * dy) > range) return null
      }

      if (npc.status === 'travelling'
          && npc.departedFromId && npc.travellingTo
          && npc.departedAt && npc.arrivalTime) {
        const total = npc.arrivalTime - npc.departedAt
        const frac  = total > 0 ? (Date.now() - npc.departedAt) / total : 1
        const from  = getSVGPos(npc.departedFromId)
        const to    = getSVGPos(npc.travellingTo)
        if (from && to) {
          return {
            ...npc,
            pos: { x: lerp(from.x, to.x, frac), y: lerp(from.y, to.y, frac) },
            destPos: to,
          }
        }
      }
      const pos = getSVGPos(npc.locationId)
      return { ...npc, pos: pos ?? null, destPos: null }
    }).filter(Boolean)
  })()

  // ── Planet moon overlay ────────────────────────────────────────────────────
  let focusedPlanetId = null

  function handlePlanetClick(loc, e) {
    e.stopPropagation()
    selectedLocationId.set(loc.id)
    focusedPlanetId = focusedPlanetId === loc.id ? null : loc.id
  }

  // ── Stable star field (spread over larger area for zoom headroom) ──────────
  function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000
    return x - Math.floor(x)
  }
  const stars = Array.from({ length: 400 }, (_, i) => ({
    x: (seededRand(i * 3)     - 0.5) * 3600,
    y: (seededRand(i * 3 + 1) - 0.5) * 3600,
    r: seededRand(i * 3 + 2) * 1.5 + 0.3,
    o: seededRand(i * 3 + 3) * 0.6 + 0.3,
  }))

  // ── Comet ellipses ─────────────────────────────────────────────────────────
  const cometEllipses = comets.map(c => ({ ...cometOrbitEllipse(c), id: c.id, color: c.color }))
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="relative w-full h-full bg-[#030711] overflow-hidden select-none"
  role="application"
  aria-label="Solar system map"
  style="cursor:{isDragging ? 'grabbing' : 'grab'}"
  on:touchstart={onTouchStart}
  on:touchmove={onTouchMove}
  on:touchend={onTouchEnd}
>
  <!-- Zoom controls -->
  <div class="absolute top-3 right-3 z-10 flex flex-col gap-1">
    <button
      on:click={resetView}
      class="w-8 h-8 rounded panel text-slate-400 text-xs font-bold flex items-center justify-center hover:bg-slate-700 transition-colors"
      aria-label="Reset view"
      title="Reset view"
    >⌖</button>
    <button
      on:click={zoomIn}
      class="w-8 h-8 rounded panel text-cyan-400 text-lg font-bold flex items-center justify-center hover:bg-slate-700 transition-colors"
      aria-label="Zoom in"
    >+</button>
    <button
      on:click={zoomOut}
      class="w-8 h-8 rounded panel text-cyan-400 text-lg font-bold flex items-center justify-center hover:bg-slate-700 transition-colors"
      aria-label="Zoom out"
    >−</button>
  </div>

  <!-- Legend -->
  <div class="absolute bottom-3 left-3 z-10 panel rounded px-2 py-1.5 text-xs text-slate-400 space-y-1 hidden sm:block">
    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> You</div>
    <div class="flex items-center gap-1.5"><span class="w-2 h-0.5 bg-cyan-400/50 inline-block"></span> Travel route</div>
    <div class="flex items-center gap-1.5"><span class="w-2 h-0.5 bg-[#a0d8ef] border-dashed inline-block"></span> Comet orbit</div>
    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full border border-white/30 inline-block"></span> NPC traders</div>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <svg
    bind:this={svgEl}
    {viewBox}
    class="w-full h-full"
    style="touch-action:none;"
    role="application"
    aria-label="Interactive solar system map"
    on:mousedown={onMouseDown}
    on:mousemove={onMouseMove}
    on:mouseup={onMouseUp}
    on:mouseleave={onMouseUp}
    on:wheel={onWheel}
  >
    <defs>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#FFF176" stop-opacity="1"/>
        <stop offset="40%"  stop-color="#FDB813" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#050d1a"/>
        <stop offset="100%" stop-color="#020508"/>
      </radialGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- Background -->
    <rect x="-1800" y="-1800" width="3600" height="3600" fill="url(#bgGrad)"/>

    <!-- Stars (spread wide for zoom headroom) -->
    {#each stars as s}
      <circle cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o}/>
    {/each}

    <!-- Comet orbits -->
    {#each cometEllipses as ce}
      <g transform="rotate({ce.rotate})">
        <ellipse
          cx={ce.cx} cy={ce.cy}
          rx={ce.a} ry={ce.b}
          fill="none"
          stroke={ce.color}
          stroke-width="0.6"
          stroke-dasharray="4 7"
          opacity="0.3"
        />
      </g>
    {/each}

    <!-- Orbital rings -->
    {#each topLevelLocations as loc}
      <circle
        cx="0" cy="0" r={loc.orbitRadius}
        fill="none"
        stroke="rgba(148,163,184,0.12)"
        stroke-width={loc.type === 'station' ? 0.5 : 0.8}
        stroke-dasharray={loc.type === 'station' ? '3 5' : 'none'}
      />
    {/each}

    <!-- Comet bodies -->
    {#each comets as comet}
      {#if cometPositions[comet.id]}
        {@const cp = cometPositions[comet.id]}
        {@const angle = Math.atan2(cp.y, cp.x)}
        <line
          x1={cp.x} y1={cp.y}
          x2={cp.x + Math.cos(angle) * 18} y2={cp.y + Math.sin(angle) * 18}
          stroke={comet.tailColor} stroke-width="3" stroke-linecap="round"
        />
        <circle cx={cp.x} cy={cp.y} r="3" fill={comet.color} filter="url(#glow)"/>
      {/if}
    {/each}

    <!-- Planets -->
    {#each topLevelLocations as loc}
      {@const angle      = planetAngles[loc.id] ?? loc.startAngle ?? 0}
      {@const pos        = orbitPosition(loc.orbitRadius, angle)}
      {@const isSelected = selectedPlanetLoc?.id === loc.id}
      {@const reachable  = isReachable(loc)}

      {#if isSelected}
        <circle cx={pos.x} cy={pos.y} r={loc.radius + 8}
          fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>
      {/if}

      {#if reachable && $player.status === 'docked'}
        <circle cx={pos.x} cy={pos.y} r={loc.radius + 5}
          fill="none" stroke="#22d3ee" stroke-width="0.8" opacity="0.6" stroke-dasharray="3 3"/>
      {/if}

      {#if loc.id === 'saturn'}
        <g transform="translate({pos.x},{pos.y}) rotate(-25)">
          <ellipse cx="0" cy="0" rx={loc.radius * 2.2} ry={loc.radius * 0.5}
            fill="none" stroke="#c8b060" stroke-width="3" opacity="0.5"/>
          <ellipse cx="0" cy="0" rx={loc.radius * 1.8} ry={loc.radius * 0.38}
            fill="none" stroke="#d4c080" stroke-width="1.5" opacity="0.35"/>
        </g>
      {/if}
      {#if loc.id === 'uranus'}
        <g transform="translate({pos.x},{pos.y}) rotate(90)">
          <ellipse cx="0" cy="0" rx={loc.radius * 1.6} ry={loc.radius * 0.3}
            fill="none" stroke="#7de8e8" stroke-width="1" opacity="0.25"/>
        </g>
      {/if}

      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <circle
        cx={pos.x} cy={pos.y} r={loc.radius}
        fill={loc.color}
        filter="url(#glow)"
        style="cursor:pointer"
        on:click={e => handlePlanetClick(loc, e)}
        role="button"
        tabindex="0"
        aria-label="Select {loc.name}"
        on:keydown={e => e.key === 'Enter' && handlePlanetClick(loc, e)}
      />

      <text x={pos.x} y={pos.y + loc.radius + 10}
        text-anchor="middle" fill="rgba(226,232,240,0.7)"
        font-size="7" font-family="Space Mono, monospace"
        pointer-events="none">{loc.name}</text>
    {/each}

    <!-- NPC travel routes -->
    {#each npcPositions as npc}
      {#if npc.pos && npc.destPos}
        <line
          x1={npc.pos.x} y1={npc.pos.y}
          x2={npc.destPos.x} y2={npc.destPos.y}
          stroke={npc.color} stroke-width="0.6" stroke-dasharray="3 5" opacity="0.3"
        />
      {/if}
    {/each}

    <!-- NPC traders -->
    {#each npcPositions as npc}
      {#if npc.pos}
        <circle cx={npc.pos.x} cy={npc.pos.y} r="4"
          fill={npc.color} opacity="0.8" filter="url(#glow)"/>
        <circle cx={npc.pos.x} cy={npc.pos.y} r="6"
          fill="none" stroke={npc.color} stroke-width="0.8" opacity="0.4"/>
        <text
          x={npc.pos.x} y={npc.pos.y - 9}
          text-anchor="middle"
          fill={npc.color}
          font-size="5"
          font-family="Space Mono, monospace"
          pointer-events="none"
          opacity="0.75"
        >{npc.name}</text>
      {/if}
    {/each}

    <!-- Travel line -->
    {#if ($player.status === 'travelling' || $player.status === 'event') && playerShipPos && destPos}
      <line
        x1={playerShipPos.x} y1={playerShipPos.y}
        x2={destPos.x}       y2={destPos.y}
        stroke="#22d3ee" stroke-width="1" stroke-dasharray="6 4" opacity="0.4"
      />
    {/if}

    <!-- Player ship (animated dot) -->
    {#if playerShipPos}
      <!-- Pulsing SMIL ring — no CSS transform, no drift bug -->
      <circle cx={playerShipPos.x} cy={playerShipPos.y} r="5"
        fill="none" stroke="#22d3ee" stroke-width="1.5" opacity="0.7">
        <animate attributeName="r" from="5" to="20" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>
      <!-- Inner dot -->
      <circle cx={playerShipPos.x} cy={playerShipPos.y} r="4"
        fill="#22d3ee" filter="url(#strongGlow)"/>
    {/if}

    <!-- Sun -->
    <circle cx="0" cy="0" r="40" fill="url(#sunGlow)" opacity="0.4"/>
    <circle cx="0" cy="0" r="22" fill="#FDB813" filter="url(#strongGlow)"/>
    <text x="0" y="32" text-anchor="middle" fill="rgba(253,184,19,0.7)"
      font-size="6" font-family="Space Mono, monospace" pointer-events="none">SOL</text>
  </svg>

  <!-- Focused planet moon overlay -->
  {#if focusedPlanetId}
    {@const fpLoc = topLevelLocations.find(l => l.id === focusedPlanetId)}
    {@const moons = getMoons(focusedPlanetId)}
    {#if fpLoc && moons.length > 0}
      <div class="absolute top-3 left-3 panel rounded-lg p-3 w-52 z-20 fade-in-up">
        <div class="flex justify-between items-center mb-2">
          <p class="text-xs font-bold font-mono-space text-slate-200">{fpLoc.name} System</p>
          <button class="text-slate-400 hover:text-white text-xs" on:click={() => focusedPlanetId = null} aria-label="Close">✕</button>
        </div>
        <div class="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
          <button
            class="w-full text-left px-2 py-1 rounded text-xs hover:bg-slate-700 transition-colors
              {$selectedLocationId === fpLoc.id ? 'bg-slate-700 text-cyan-400' : 'text-slate-300'}"
            on:click={() => selectedLocationId.set(fpLoc.id)}
          >
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full inline-block flex-shrink-0" style="background:{fpLoc.color}"></span>
              {fpLoc.name}
              {#if $player.status === 'docked' && isReachable(fpLoc)}
                <span class="ml-auto text-cyan-400 text-[10px]">✓</span>
              {/if}
            </span>
          </button>
          {#each moons as moon}
            <button
              class="w-full text-left px-2 py-1 rounded text-xs hover:bg-slate-700 transition-colors
                {$selectedLocationId === moon.id ? 'bg-slate-700 text-cyan-400' : 'text-slate-400'}"
              on:click={() => selectedLocationId.set(moon.id)}
            >
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ml-1" style="background:{moon.color}"></span>
                {moon.name}
                {#if $player.status === 'docked' && isReachable(moon)}
                  <span class="ml-auto text-cyan-400 text-[10px]">✓</span>
                {/if}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
