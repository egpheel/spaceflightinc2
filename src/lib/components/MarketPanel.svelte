<script>
  import { player, currentShip, cargoUnits, marketPrices, buyItem, sellItem } from '../stores/gameStore.js'
  import { commodities } from '../data/commodities.js'
  import { getLocation } from '../data/locations.js'
  import { ships } from '../data/ships.js'
  import { buyShip } from '../stores/gameStore.js'

  let activeTab = 'market' // 'market' | 'cargo' | 'ships'
  let quantities = {} // { commodityId: number }

  $: loc = getLocation($player.locationId)
  $: prices = $marketPrices[$player.locationId] ?? {}
  $: ship = $currentShip
  $: isDocked = $player.status === 'docked'
  $: hasShipyard = loc?.hasShipyard ?? false

  function getQty(id) { return quantities[id] ?? 1 }
  function setQty(id, val) { quantities = { ...quantities, [id]: Math.max(1, Math.min(val, 999)) } }

  function maxBuy(commodityId) {
    const price = prices[commodityId]?.buyPrice ?? 0
    const afford = price > 0 ? Math.floor($player.credits / price) : 0
    const space = (ship?.cargoCapacity ?? 0) - $cargoUnits
    return Math.max(0, Math.min(afford, space))
  }

  function maxSell(commodityId) {
    return $player.cargo[commodityId] ?? 0
  }

  function handleBuy(id) {
    buyItem(id, getQty(id))
  }

  function handleSell(id) {
    sellItem(id, getQty(id))
  }

  function handleBuyShip(shipId) {
    buyShip(shipId)
  }

  $: tradeinValue = ship ? Math.round(ship.price * 0.55) : 0
</script>

<div class="flex flex-col h-full overflow-hidden">
  <!-- Tabs -->
  <div class="flex border-b border-slate-800 shrink-0">
    {#each [['market', '📦 Market'], ['cargo', '🗃 Cargo'], ...(hasShipyard ? [['ships', '⚙ Shipyard']] : [])] as [tab, label]}
      <button
        class="flex-1 py-2 text-xs font-mono-space font-bold transition-colors
          {activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-px' : 'text-slate-500 hover:text-slate-300'}"
        on:click={() => activeTab = tab}
      >{label}</button>
    {/each}
  </div>

  <!-- Market tab -->
  {#if activeTab === 'market'}
    {#if !isDocked}
      <div class="flex-1 flex items-center justify-center">
        <p class="text-xs text-slate-600 font-mono-space text-center">Market unavailable<br/>while in transit</p>
      </div>
    {:else}
      <div class="flex-1 overflow-y-auto scrollbar-thin">
        <table class="w-full text-xs">
          <thead class="sticky top-0 bg-slate-950 border-b border-slate-800">
            <tr>
              <th class="text-left px-3 py-2 text-slate-500 font-mono-space font-normal">COMMODITY</th>
              <th class="text-right px-2 py-2 text-slate-500 font-mono-space font-normal hidden sm:table-cell">BUY</th>
              <th class="text-right px-2 py-2 text-slate-500 font-mono-space font-normal hidden sm:table-cell">SELL</th>
              <th class="px-3 py-2 text-slate-500 font-mono-space font-normal">QTY / ACTION</th>
            </tr>
          </thead>
          <tbody>
            {#each commodities as c}
              {@const p = prices[c.id]}
              {#if p}
                <tr class="border-b border-slate-900 hover:bg-slate-900/50 transition-colors">
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      <div>
                        <div class="text-slate-200 font-bold">{c.name}</div>
                        <div class="text-slate-600 text-[10px] sm:hidden">{p.buyPrice} / {p.sellPrice} ¢</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-right px-2 py-2 text-amber-300 font-mono-space hidden sm:table-cell">
                    {p.buyPrice} ¢
                  </td>
                  <td class="text-right px-2 py-2 text-green-400 font-mono-space hidden sm:table-cell">
                    {p.sellPrice} ¢
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={getQty(c.id)}
                        on:change={e => setQty(c.id, parseInt(e.target.value) || 1)}
                        class="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-center font-mono-space text-slate-200"
                      />
                      <button
                        class="px-2 py-1 rounded text-[10px] font-mono-space btn-primary"
                        disabled={maxBuy(c.id) < 1 || !isDocked}
                        on:click={() => handleBuy(c.id)}
                      >BUY</button>
                      {#if maxSell(c.id) > 0}
                        <button
                          class="px-2 py-1 rounded text-[10px] font-mono-space btn-danger"
                          disabled={!isDocked}
                          on:click={() => handleSell(c.id)}
                        >SELL</button>
                      {/if}
                    </div>
                    {#if maxBuy(c.id) < 1 && isDocked}
                      <div class="text-[10px] text-slate-600 mt-0.5">
                        {$player.credits < p.buyPrice ? 'Insufficient credits' : 'No cargo space'}
                      </div>
                    {/if}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

  <!-- Cargo tab -->
  {:else if activeTab === 'cargo'}
    <div class="flex-1 overflow-y-auto scrollbar-thin p-3">
      <!-- Cargo capacity bar -->
      <div class="mb-3">
        <div class="flex justify-between text-[10px] font-mono-space text-slate-400 mb-1">
          <span>CARGO HOLD</span>
          <span>{$cargoUnits} / {ship?.cargoCapacity ?? 0} tons</span>
        </div>
        <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            style="width:{Math.min(100, ($cargoUnits / (ship?.cargoCapacity ?? 1)) * 100)}%;
              background:{$cargoUnits >= (ship?.cargoCapacity ?? 1) ? '#ef4444' : '#22d3ee'}"
          ></div>
        </div>
      </div>

      {#if Object.keys($player.cargo).length === 0}
        <p class="text-xs text-slate-600 font-mono-space text-center py-6">Cargo hold empty</p>
      {:else}
        <div class="space-y-2">
          {#each Object.entries($player.cargo) as [id, qty]}
            {#if qty > 0}
              {@const c = commodities.find(c => c.id === id)}
              {@const p = prices[id]}
              <div class="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
                <div class="flex items-center gap-2">
                  <span>{c?.icon}</span>
                  <div>
                    <div class="text-slate-200 text-xs font-bold">{c?.name}</div>
                    <div class="text-slate-500 text-[10px] font-mono-space">{qty} tons</div>
                  </div>
                </div>
                <div class="text-right">
                  {#if p && isDocked}
                    <div class="text-green-400 text-xs font-mono-space">{(p.sellPrice * qty).toLocaleString()} ¢</div>
                    <button
                      class="text-[10px] text-red-400 hover:text-red-300 font-mono-space"
                      on:click={() => sellItem(id, qty)}
                    >SELL ALL</button>
                  {:else}
                    <div class="text-slate-500 text-xs font-mono-space">{qty} t</div>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

  <!-- Shipyard tab -->
  {:else if activeTab === 'ships'}
    <div class="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
      <p class="text-[10px] text-slate-500 font-mono-space mb-2">
        Trade-in value of your <span class="text-amber-400">{ship?.name}</span>: {tradeinValue.toLocaleString()} ¢
      </p>
      {#each ships as s}
        {@const netCost = s.price - tradeinValue}
        {@const canAfford = $player.credits >= netCost}
        {@const isOwned = $player.shipId === s.id}
        <div class="bg-slate-900 rounded-lg p-3 border border-slate-800 {isOwned ? 'border-cyan-800' : ''}">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-slate-100 text-sm font-bold font-mono-space">{s.name}</span>
                <span class="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{s.class}</span>
                {#if isOwned}
                  <span class="text-[10px] text-cyan-400 font-mono-space">OWNED</span>
                {/if}
              </div>
              <p class="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{s.description}</p>
              <div class="flex gap-3 mt-1.5 text-[10px] font-mono-space text-slate-400">
                <span>⚡ {s.speed} du/s</span>
                <span>📡 {s.jumpDistance} du</span>
                <span>📦 {s.cargoCapacity} t</span>
              </div>
            </div>
            {#if !isOwned}
              <div class="text-right shrink-0">
                <div class="text-amber-400 font-mono-space text-sm font-bold">{Math.max(0, netCost).toLocaleString()} ¢</div>
                <div class="text-slate-600 text-[10px]">net cost</div>
                <button
                  class="mt-1 px-3 py-1 rounded text-[10px] font-mono-space btn-primary"
                  disabled={!canAfford || !isDocked}
                  on:click={() => handleBuyShip(s.id)}
                >
                  {canAfford ? 'PURCHASE' : 'INSUFFICIENT ¢'}
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
