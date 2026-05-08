<script>
  import { onMount, onDestroy } from 'svelte'
  import { player } from '../stores/gameStore.js'
  import { getLocation } from '../data/locations.js'

  let now = Date.now()
  let ticker

  onMount(() => { ticker = setInterval(() => now = Date.now(), 500) })
  onDestroy(() => clearInterval(ticker))

  $: destLoc = $player.travellingTo ? getLocation($player.travellingTo) : null
  $: currentLoc = getLocation($player.locationId)

  $: secondsLeft = $player.arrivalTime
    ? Math.max(0, Math.round(($player.arrivalTime - now) / 1000))
    : null

  $: dockingLeft = $player.dockingUntil
    ? Math.max(0, Math.round(($player.dockingUntil - now) / 1000))
    : null

  $: progressPct = ($player.arrivalTime && $player.status === 'travelling')
    ? Math.min(100, 100 - (($player.arrivalTime - now) / ($player.arrivalTime - ($player.arrivalTime - secondsLeft * 1000 - (secondsLeft * 1000))) * 100))
    : ($player.status === 'docking' ? Math.max(0, 100 - (dockingLeft ?? 0) * 25) : 0)
</script>

{#if $player.status === 'travelling' && destLoc}
  <div class="px-4 py-4 border-b border-slate-800">
    <div class="flex items-center justify-between mb-2">
      <p class="text-xs font-mono-space font-bold text-cyan-400">IN TRANSIT</p>
      <p class="text-xs font-mono-space text-cyan-400">{secondsLeft}s</p>
    </div>
    <p class="text-xs text-slate-400 mb-2 font-mono-space">→ {destLoc.name}</p>
    <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
      <div
        class="h-full bg-cyan-500 rounded-full transition-all duration-500"
        style="width:{secondsLeft !== null ? Math.max(2, Math.min(98, 100 - secondsLeft * 2)) : 50}%"
      ></div>
    </div>
  </div>
{/if}

{#if $player.status === 'docking' && currentLoc}
  <div class="px-4 py-4 border-b border-slate-800">
    <div class="flex items-center justify-between mb-2">
      <p class="text-xs font-mono-space font-bold text-amber-400">DOCKING</p>
      <p class="text-xs font-mono-space text-amber-400">{dockingLeft}s</p>
    </div>
    <p class="text-xs text-slate-400 mb-2 font-mono-space">Approaching {currentLoc.name}</p>
    <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
      <div
        class="h-full bg-amber-500 rounded-full transition-all duration-500"
        style="width:{dockingLeft !== null ? Math.max(2, (4 - dockingLeft) * 25) : 50}%"
      ></div>
    </div>
  </div>
{/if}
