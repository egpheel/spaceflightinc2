<script>
  import { player, currentShip, selectedLocationId, startTravel } from '../stores/gameStore.js'
  import { getLocation, getMoons, travelDistance, factions } from '../data/locations.js'

  $: selectedLoc = getLocation($selectedLocationId)
  $: currentLoc = getLocation($player.locationId)
  $: ship = $currentShip
  $: moons = selectedLoc ? getMoons(selectedLoc.id) : []
  $: parentLoc = selectedLoc?.parentId ? getLocation(selectedLoc.parentId) : null

  $: dist = (selectedLoc && currentLoc)
    ? travelDistance(currentLoc, selectedLoc)
    : null

  $: eta = (dist !== null && ship)
    ? Math.max(1, Math.round(dist / ship.speed))
    : null

  $: inRange = dist !== null && ship ? dist <= ship.jumpDistance : false
  $: isCurrent = selectedLoc?.id === $player.locationId
  $: canTravel = $player.status === 'docked' && !isCurrent && inRange
  $: isSpace = $player.locationId === 'space' || $player.status === 'travelling'

  function handleTravel() {
    if (canTravel && selectedLoc) startTravel(selectedLoc.id)
  }

  function selectMoon(moonId) {
    selectedLocationId.set(moonId)
  }

  const typeLabels = { planet: 'Planet', moon: 'Moon', station: 'Station' }

  $: faction = selectedLoc?.faction ? factions[selectedLoc.faction] : null
</script>

<div class="flex flex-col h-full overflow-hidden">
  <!-- Header -->
  <div class="px-4 pt-3 pb-2 border-b border-slate-800 shrink-0">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="text-slate-100 font-bold font-mono-space text-sm">
            {selectedLoc?.name ?? 'Select a destination'}
          </h2>
          {#if selectedLoc}
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono-space">
              {typeLabels[selectedLoc.type] ?? selectedLoc.type}
            </span>
          {/if}
          {#if faction}
            <span class="text-[10px] px-1.5 py-0.5 rounded-full font-mono-space" style="color:{faction.color};background:{faction.color}22">
              {faction.name}
            </span>
          {/if}
        </div>
        {#if parentLoc}
          <p class="text-xs text-slate-500 mt-0.5">Moon of {parentLoc.name}</p>
        {/if}
      </div>

      {#if selectedLoc && dist !== null && !isCurrent}
        <div class="text-right shrink-0">
          <div class="font-mono-space text-xs text-slate-400">{dist.toFixed(2)} du</div>
          {#if eta !== null}
            <div class="font-mono-space text-xs {inRange ? 'text-cyan-400' : 'text-red-400'}">
              {inRange ? eta + 's' : 'OUT OF RANGE'}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    {#if selectedLoc?.description}
      <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">{selectedLoc.description}</p>
    {/if}
  </div>

  <!-- Location details -->
  {#if selectedLoc}
    <div class="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-4">

      <!-- Facilities -->
      <div class="flex gap-2 flex-wrap">
        {#if selectedLoc.hasShipyard}
          <span class="text-[10px] px-2 py-1 rounded bg-amber-900/40 text-amber-400 border border-amber-800/40 font-mono-space">⚙ SHIPYARD</span>
        {/if}
        {#if selectedLoc.hasMarket}
          <span class="text-[10px] px-2 py-1 rounded bg-slate-800/60 text-slate-300 border border-slate-700/40 font-mono-space">📦 MARKET</span>
        {/if}
      </div>

      <!-- Produces / Consumes -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-[10px] text-slate-500 font-mono-space uppercase tracking-wide mb-1.5">Exports</p>
          <div class="space-y-1">
            {#each (selectedLoc.produces ?? []) as id}
              <div class="text-[11px] text-green-400 flex items-center gap-1">
                <span class="w-1 h-1 rounded-full bg-green-400 shrink-0"></span>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </div>
            {/each}
          </div>
        </div>
        <div>
          <p class="text-[10px] text-slate-500 font-mono-space uppercase tracking-wide mb-1.5">Imports</p>
          <div class="space-y-1">
            {#each (selectedLoc.consumes ?? []) as id}
              <div class="text-[11px] text-red-400 flex items-center gap-1">
                <span class="w-1 h-1 rounded-full bg-red-400 shrink-0"></span>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Moons list (if planet) -->
      {#if moons.length > 0}
        <div>
          <p class="text-[10px] text-slate-500 font-mono-space uppercase tracking-wide mb-2">Moons ({moons.length})</p>
          <div class="grid grid-cols-2 gap-1">
            {#each moons as moon}
              <button
                class="text-left px-2 py-1.5 rounded text-xs hover:bg-slate-800 transition-colors border border-slate-800 text-slate-300"
                on:click={() => selectMoon(moon.id)}
              >
                <span class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:{moon.color}"></span>
                  {moon.name}
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Travel info while in transit -->
      {#if $player.status === 'travelling'}
        <div class="bg-cyan-900/20 border border-cyan-800/30 rounded-lg p-3">
          <p class="text-xs text-cyan-400 font-mono-space font-bold">IN TRANSIT</p>
          <p class="text-xs text-slate-400 mt-1">Heading to {getLocation($player.travellingTo)?.name}</p>
        </div>
      {/if}

      {#if $player.status === 'docking'}
        <div class="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
          <p class="text-xs text-amber-400 font-mono-space font-bold">DOCKING SEQUENCE</p>
          <p class="text-xs text-slate-400 mt-1">Approaching {currentLoc?.name}</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex-1 flex items-center justify-center p-4">
      <p class="text-xs text-slate-600 text-center font-mono-space">
        Click a planet on the map<br/>or select a moon to navigate
      </p>
    </div>
  {/if}

  <!-- Travel button -->
  {#if selectedLoc && !isCurrent && $player.status === 'docked'}
    <div class="px-4 pb-3 pt-2 border-t border-slate-800 shrink-0">
      <button
        class="w-full py-2.5 rounded-lg font-mono-space font-bold text-sm btn-primary disabled:opacity-30"
        on:click={handleTravel}
        disabled={!canTravel}
      >
        {#if !inRange}
          ✕ OUT OF RANGE ({dist?.toFixed(1)} / {ship?.jumpDistance} du)
        {:else}
          → JUMP TO {selectedLoc.name.toUpperCase()} ({eta}s)
        {/if}
      </button>
    </div>
  {/if}
</div>
