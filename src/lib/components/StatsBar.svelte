<script>
  import { player, currentShip, cargoUnits } from '../stores/gameStore.js'
  import { getLocation } from '../data/locations.js'

  $: loc = getLocation($player.locationId)
  $: ship = $currentShip
  $: status = $player.status

  const statusColors = {
    docked: 'text-green-400',
    travelling: 'text-cyan-400',
    docking: 'text-amber-400',
    event: 'text-red-400',
  }
  const statusLabels = {
    docked: 'DOCKED',
    travelling: 'IN TRANSIT',
    docking: 'DOCKING',
    event: 'EVENT',
  }
</script>

<header class="panel border-b flex items-center px-3 py-2 gap-4 overflow-x-auto scrollbar-thin shrink-0 z-30">
  <!-- Brand -->
  <span class="font-mono-space text-cyan-400 font-bold text-sm whitespace-nowrap shrink-0 hidden sm:block">
    SFI
  </span>

  <div class="h-4 w-px bg-slate-700 hidden sm:block shrink-0"></div>

  <!-- Stats row -->
  <div class="flex items-center gap-4 md:gap-6 min-w-0">
    <div class="stat-item">
      <span class="label">SHIP</span>
      <span class="value truncate max-w-28">{ship?.name ?? '—'}</span>
    </div>
    <div class="stat-item hidden xs:flex">
      <span class="label">CLASS</span>
      <span class="value">{ship?.class ?? '—'}</span>
    </div>
    <div class="stat-item">
      <span class="label">CARGO</span>
      <span class="value">{$cargoUnits}/{ship?.cargoCapacity ?? 0}</span>
    </div>
    <div class="stat-item">
      <span class="label">CREDITS</span>
      <span class="value text-amber-400">{$player.credits.toLocaleString()} ¢</span>
    </div>
    <div class="stat-item">
      <span class="label">LOCATION</span>
      <span class="value truncate max-w-24">
        {$player.status === 'travelling' ? 'Deep Space' : (loc?.name ?? '—')}
      </span>
    </div>
    <div class="stat-item">
      <span class="label">STATUS</span>
      <span class="value {statusColors[status] ?? 'text-slate-300'}">{statusLabels[status] ?? status}</span>
    </div>
    <div class="stat-item hidden md:flex">
      <span class="label">SPEED</span>
      <span class="value">{ship?.speed} du/s</span>
    </div>
    <div class="stat-item hidden md:flex">
      <span class="label">RANGE</span>
      <span class="value">{ship?.jumpDistance} du</span>
    </div>
  </div>
</header>

<style>
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .label {
    font-size: 9px;
    color: #475569;
    font-family: 'Space Mono', monospace;
    letter-spacing: 0.08em;
  }
  .value {
    font-size: 12px;
    color: #e2e8f0;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
  }
</style>
