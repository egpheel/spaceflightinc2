<script>
  import { onMount, onDestroy } from 'svelte'
  import { player, currentShip, selectedLocationId, startTravel } from '../stores/gameStore.js'
  import {
    locations, comets,
    currentAngle, orbitPosition, travelDistance,
    cometSVGPosition, cometOrbitEllipse,
    getLocation, getMoons, getPlanets,
  } from '../data/locations.js'

  // ── Map state ───────────────────────────────────────────────────────────────
  let viewBox = '-500 -500 1000 1000'
  let zoom = 1
  let panX = 0
  let panY = 0
  let focusedPlanetId = null // which planet is zoomed in on map

  // ── Live planet positions (updated each animation frame) ────────────────────
  let planetAngles = {}
  let cometPositions = {}
  let animFrame

  const topLevelLocations = getPlanets()

  function updateOrbits() {
    const now = Date.now()
    const angles = {}
    for (const loc of topLevelLocations) {
      if (loc.orbitalPeriodDays) {
        angles[loc.id] = currentAngle(loc.startAngle, loc.orbitalPeriodDays)
      } else {
        angles[loc.id] = loc.startAngle ?? 0
      }
    }
    planetAngles = angles

    const cPos = {}
    for (const c of comets) {
      cPos[c.id] = cometSVGPosition(c, now)
    }
    cometPositions = cPos

    animFrame = requestAnimationFrame(updateOrbits)
  }

  onMount(() => { animFrame = requestAnimationFrame(updateOrbits) })
  onDestroy(() => { if (animFrame) cancelAnimationFrame(animFrame) })

  // ── Helper: get live SVG position for a top-level location ─────────────────
  function getPlanetPos(loc) {
    const angle = planetAngles[loc.id] ?? loc.startAngle ?? 0
    return orbitPosition(loc.orbitRadius, angle)
  }

  // ── Player position on map ──────────────────────────────────────────────────
  $: playerLoc = getLocation($player.locationId) ?? getLocation($player.travellingTo)
  $: playerParentId = playerLoc?.parentId ?? null
  $: playerPlanetLoc = playerParentId
    ? (topLevelLocations.find(l => l.id === playerParentId) ?? playerLoc)
    : (topLevelLocations.find(l => l.id === playerLoc?.id) ?? null)
  $: playerPos = playerPlanetLoc ? getPlanetPos(playerPlanetLoc) : { x: 0, y: 0 }

  // ── Travel destination position ─────────────────────────────────────────────
  $: destLoc = $player.travellingTo ? getLocation($player.travellingTo) : null
  $: destPlanetLoc = destLoc
    ? (destLoc.parentId
        ? topLevelLocations.find(l => l.id === destLoc.parentId)
        : topLevelLocations.find(l => l.id === destLoc.id))
    : null
  $: destPos = destPlanetLoc ? getPlanetPos(destPlanetLoc) : null

  // ── Selected location ───────────────────────────────────────────────────────
  $: selectedLoc = getLocation($selectedLocationId)
  $: selectedPlanetLoc = selectedLoc
    ? (selectedLoc.parentId
        ? topLevelLocations.find(l => l.id === selectedLoc.parentId)
        : topLevelLocations.find(l => l.id === selectedLoc.id))
    : null

  // ── Reachable check ─────────────────────────────────────────────────────────
  $: currentLoc = getLocation($player.locationId)
  function isReachable(loc) {
    if (!currentLoc || !$currentShip) return false
    const dist = travelDistance(currentLoc, loc)
    return dist <= $currentShip.jumpDistance && loc.id !== $player.locationId
  }

  // ── Zoom & pan ──────────────────────────────────────────────────────────────
  function zoomIn() { zoom = Math.min(zoom * 1.4, 6) }
  function zoomOut() { zoom = Math.max(zoom / 1.4, 0.5) }

  // ── Touch pinch-to-zoom ─────────────────────────────────────────────────────
  let lastTouchDist = null
  function getTouchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }
  function onTouchStart(e) {
    if (e.touches.length === 2) lastTouchDist = getTouchDist(e)
  }
  function onTouchMove(e) {
    if (e.touches.length === 2 && lastTouchDist) {
      const dist = getTouchDist(e)
      const delta = dist / lastTouchDist
      zoom = Math.max(0.5, Math.min(zoom * delta, 6))
      lastTouchDist = dist
      e.preventDefault()
    }
  }
  function onTouchEnd() { lastTouchDist = null }

  // ── Click planet on map ─────────────────────────────────────────────────────
  function handlePlanetClick(loc, event) {
    event.stopPropagation()
    selectedLocationId.set(loc.id)
    focusedPlanetId = focusedPlanetId === loc.id ? null : loc.id
  }

  // ── Star field (seeded, stable) ─────────────────────────────────────────────
  function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000
    return x - Math.floor(x)
  }
  const stars = Array.from({ length: 220 }, (_, i) => ({
    x: (seededRand(i * 3) - 0.5) * 960,
    y: (seededRand(i * 3 + 1) - 0.5) * 960,
    r: seededRand(i * 3 + 2) * 1.4 + 0.3,
    o: seededRand(i * 3 + 3) * 0.6 + 0.3,
  }))

  // ── Viewbox transform string ────────────────────────────────────────────────
  $: transform = `translate(500 500) scale(${zoom}) translate(-500 -500) translate(${panX} ${panY})`

  // ── Comet ellipse params ─────────────────────────────────────────────────────
  const cometEllipses = comets.map(c => ({ ...cometOrbitEllipse(c), id: c.id, color: c.color }))
</script>

<div
  class="relative w-full h-full bg-[#030711] overflow-hidden select-none"
  role="application"
  aria-label="Solar system map"
  on:touchstart={onTouchStart}
  on:touchmove={onTouchMove}
  on:touchend={onTouchEnd}
>
  <!-- Zoom controls -->
  <div class="absolute top-3 right-3 z-10 flex flex-col gap-1">
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
  <div class="absolute bottom-3 left-3 z-10 panel rounded px-2 py-1 text-xs text-slate-400 space-y-0.5 hidden sm:block">
    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Your position</div>
    <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full border border-white/40 inline-block"></span> Selected</div>
    <div class="flex items-center gap-1.5"><span class="w-2 h-0.5 bg-[#a0d8ef] inline-block"></span> Comet orbit</div>
  </div>

  <svg
    viewBox="-500 -500 1000 1000"
    class="w-full h-full"
    style="touch-action: none;"
  >
    <defs>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFF176" stop-opacity="1"/>
        <stop offset="40%" stop-color="#FDB813" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#050d1a"/>
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
      <clipPath id="mapClip">
        <rect x="-500" y="-500" width="1000" height="1000"/>
      </clipPath>
    </defs>

    <!-- Background -->
    <rect x="-500" y="-500" width="1000" height="1000" fill="url(#bgGrad)"/>

    <!-- Star field -->
    {#each stars as s}
      <circle cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o}/>
    {/each}

    <g transform={transform} clip-path="url(#mapClip)">
      <!-- Comet orbits (ellipses) -->
      {#each cometEllipses as ce}
        <g transform="rotate({ce.rotate})">
          <ellipse
            cx={ce.cx} cy={ce.cy}
            rx={ce.a} ry={ce.b}
            fill="none"
            stroke={ce.color}
            stroke-width="0.5"
            stroke-dasharray="4 6"
            opacity="0.35"
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
          <!-- Tail (line pointing away from sun) -->
          {@const angle = Math.atan2(cp.y, cp.x)}
          <line
            x1={cp.x} y1={cp.y}
            x2={cp.x + Math.cos(angle) * 20}
            y2={cp.y + Math.sin(angle) * 20}
            stroke={comet.tailColor}
            stroke-width="3"
            stroke-linecap="round"
          />
          <circle cx={cp.x} cy={cp.y} r="3" fill={comet.color} filter="url(#glow)"/>
        {/if}
      {/each}

      <!-- Planets -->
      {#each topLevelLocations as loc}
        {@const pos = getPlanetPos(loc)}
        {@const isSelected = selectedPlanetLoc?.id === loc.id}
        {@const reachable = isReachable(loc)}

        <!-- Selection ring -->
        {#if isSelected}
          <circle
            cx={pos.x} cy={pos.y}
            r={loc.radius + 8}
            fill="none" stroke="white" stroke-width="1.5" opacity="0.4"
          />
        {/if}

        <!-- Reachable indicator -->
        {#if reachable && $player.status === 'docked'}
          <circle
            cx={pos.x} cy={pos.y}
            r={loc.radius + 5}
            fill="none" stroke="#22d3ee" stroke-width="0.8" opacity="0.6"
            stroke-dasharray="3 3"
          />
        {/if}

        <!-- Saturn rings -->
        {#if loc.id === 'saturn'}
          <g transform="translate({pos.x},{pos.y}) rotate(-25)">
            <ellipse cx="0" cy="0" rx={loc.radius * 2.2} ry={loc.radius * 0.5}
              fill="none" stroke="#c8b060" stroke-width="3" opacity="0.5"/>
            <ellipse cx="0" cy="0" rx={loc.radius * 1.8} ry={loc.radius * 0.38}
              fill="none" stroke="#d4c080" stroke-width="1.5" opacity="0.35"/>
          </g>
        {/if}

        <!-- Uranus rings (subtle) -->
        {#if loc.id === 'uranus'}
          <g transform="translate({pos.x},{pos.y}) rotate(90)">
            <ellipse cx="0" cy="0" rx={loc.radius * 1.6} ry={loc.radius * 0.3}
              fill="none" stroke="#7de8e8" stroke-width="1" opacity="0.25"/>
          </g>
        {/if}

        <!-- Planet body -->
        <circle
          cx={pos.x} cy={pos.y}
          r={loc.radius}
          fill={loc.color}
          filter="url(#glow)"
          style="cursor:pointer"
          on:click={e => handlePlanetClick(loc, e)}
          role="button"
          tabindex="0"
          aria-label="Select {loc.name}"
          on:keydown={e => e.key === 'Enter' && handlePlanetClick(loc, e)}
        />

        <!-- Label -->
        <text
          x={pos.x}
          y={pos.y + loc.radius + 10}
          text-anchor="middle"
          fill="rgba(226,232,240,0.7)"
          font-size="7"
          font-family="Space Mono, monospace"
          pointer-events="none"
        >{loc.name}</text>
      {/each}

      <!-- Travel line (if travelling) -->
      {#if $player.status === 'travelling' && playerPos && destPos}
        <line
          x1={playerPos.x} y1={playerPos.y}
          x2={destPos.x} y2={destPos.y}
          stroke="#22d3ee"
          stroke-width="1"
          stroke-dasharray="6 4"
          opacity="0.5"
          class="travel-line"
        />
      {/if}

      <!-- Player position -->
      {#if playerPos}
        <!-- Outer pulse ring -->
        <circle
          cx={playerPos.x} cy={playerPos.y}
          r="10"
          fill="none" stroke="#22d3ee" stroke-width="1.5"
          opacity="0.6"
          class="animate-ping-slow"
        />
        <!-- Inner dot -->
        <circle
          cx={playerPos.x} cy={playerPos.y}
          r="4"
          fill="#22d3ee"
          filter="url(#strongGlow)"
        />
      {/if}

      <!-- Sun -->
      <circle cx="0" cy="0" r="40" fill="url(#sunGlow)" opacity="0.4"/>
      <circle cx="0" cy="0" r="22" fill="#FDB813" filter="url(#strongGlow)"/>
      <text x="0" y="32" text-anchor="middle" fill="rgba(253,184,19,0.7)"
        font-size="6" font-family="Space Mono, monospace">SOL</text>
    </g>
  </svg>

  <!-- Focused planet moons overlay -->
  {#if focusedPlanetId}
    {@const fpLoc = topLevelLocations.find(l => l.id === focusedPlanetId)}
    {@const moons = getMoons(focusedPlanetId)}
    {#if fpLoc && moons.length > 0}
      <div class="absolute top-3 left-3 panel rounded-lg p-3 w-48 z-20 fade-in-up">
        <div class="flex justify-between items-center mb-2">
          <p class="text-xs font-bold font-mono-space text-slate-200">{fpLoc.name} System</p>
          <button
            class="text-slate-400 hover:text-white text-xs"
            on:click={() => focusedPlanetId = null}
            aria-label="Close"
          >✕</button>
        </div>
        <div class="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
          <!-- Planet itself -->
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
          <!-- Moons -->
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
