<script>
  import StatsBar from './lib/components/StatsBar.svelte'
  import SolarSystemMap from './lib/components/SolarSystemMap.svelte'
  import LocationPanel from './lib/components/LocationPanel.svelte'
  import MarketPanel from './lib/components/MarketPanel.svelte'
  import EventModal from './lib/components/EventModal.svelte'
  import EventLog from './lib/components/EventLog.svelte'
  import TravelStatus from './lib/components/TravelStatus.svelte'
  import { player, pendingEvent } from './lib/stores/gameStore.js'

  // Mobile panel tabs
  let mobilePanelTab = 'map' // 'map' | 'nav' | 'market'

  $: isDocked = $player.status === 'docked'
  $: isMoving = $player.status === 'travelling' || $player.status === 'docking'

  // Auto-switch to nav tab when in transit
  $: if (isMoving && mobilePanelTab === 'market') {
    mobilePanelTab = 'nav'
  }
</script>

<div class="flex flex-col h-screen overflow-hidden bg-[#030711]">
  <!-- Stats bar (always visible) -->
  <StatsBar />

  <!-- Mobile tab bar -->
  <div class="flex md:hidden border-b border-slate-800 shrink-0 bg-[#030711]">
    {#each [['map', '🗺 Map'], ['nav', '🧭 Navigate'], ['market', '💹 Trade']] as [tab, label]}
      <button
        class="flex-1 py-2 text-[11px] font-mono-space font-bold transition-colors
          {mobilePanelTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-px' : 'text-slate-500'}"
        on:click={() => mobilePanelTab = tab}
      >{label}</button>
    {/each}
  </div>

  <!-- Main content area -->
  <div class="flex flex-1 overflow-hidden">

    <!-- Left: Solar System Map (always shown on desktop; conditionally on mobile) -->
    <div class="
      {mobilePanelTab === 'map' ? 'flex' : 'hidden'}
      md:flex flex-col
      w-full md:w-[58%] lg:w-[62%]
      border-r border-slate-800
    ">
      <div class="flex-1 relative overflow-hidden">
        <SolarSystemMap />
      </div>
    </div>

    <!-- Right: Panels (always shown on desktop; conditionally on mobile) -->
    <div class="
      {mobilePanelTab !== 'map' ? 'flex' : 'hidden'}
      md:flex flex-col
      w-full md:w-[42%] lg:w-[38%]
      overflow-hidden
    ">
      <!-- Desktop tab bar -->
      <div class="hidden md:flex border-b border-slate-800 shrink-0">
        {#each [['nav', '🧭 Navigate'], ['market', '💹 Trade']] as [tab, label]}
          <button
            class="flex-1 py-2.5 text-xs font-mono-space font-bold transition-colors
              {mobilePanelTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-px' : 'text-slate-500 hover:text-slate-300'}"
            on:click={() => mobilePanelTab = tab}
          >{label}</button>
        {/each}
      </div>

      <!-- Travel status (shown in both nav and market while moving) -->
      <TravelStatus />

      <!-- Panel content -->
      <div class="flex-1 overflow-hidden flex flex-col">
        {#if mobilePanelTab === 'market'}
          <MarketPanel />
        {:else}
          <LocationPanel />
        {/if}
      </div>

      <!-- Event log at the bottom of the right panel -->
      <EventLog />
    </div>
  </div>
</div>

<!-- Event modal (global overlay) -->
<EventModal />
