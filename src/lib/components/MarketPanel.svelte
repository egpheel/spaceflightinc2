<script>
  import {
    player, currentShip, cargoUnits, marketPrices, marketStock,
    buyItem, sellItem, buyShip, retrieveShip, tradeInValue,
  } from '../stores/gameStore.js'
  import { commodities } from '../data/commodities.js'
  import { getLocation } from '../data/locations.js'
  import { ships, getShip } from '../data/ships.js'

  let activeTab = 'market' // 'market' | 'cargo' | 'ships' | 'fleet'
  let quantities = {}      // { commodityId: number }

  // Ship purchase modal state
  let purchaseModal = null  // null | { shipId }
  let purchaseAction = 'tradein'  // 'tradein' | 'store'

  $: loc       = getLocation($player.locationId)
  $: prices    = $marketPrices[$player.locationId] ?? {}
  $: stock     = $marketStock[$player.locationId] ?? {}
  $: ship      = $currentShip
  $: isDocked  = $player.status === 'docked'
  $: hasShipyard = loc?.hasShipyard ?? false
  $: fleetHere = $player.fleet.filter(f => f.locationId === $player.locationId)

  function getQty(id) { return quantities[id] ?? 1 }

  function setQty(id, val) {
    const n = parseInt(val) || 1
    quantities = { ...quantities, [id]: Math.max(1, n) }
  }

  // Max that can be bought (limited by credits, cargo space, AND stock)
  function maxBuy(commodityId) {
    const p = prices[commodityId]
    if (!p) return 0
    const afford  = p.buyPrice > 0 ? Math.floor($player.credits / p.buyPrice) : 0
    const space   = (ship?.cargoCapacity ?? 0) - $cargoUnits
    const inStock = p.stock ?? 0
    return Math.max(0, Math.min(afford, space, inStock))
  }

  function maxSell(commodityId) {
    return $player.cargo[commodityId] ?? 0
  }

  function handleBuy(id) { buyItem(id, getQty(id)) }
  function handleSell(id) { sellItem(id, getQty(id)) }

  function setMaxBuy(id) {
    const max = maxBuy(id)
    if (max > 0) buyItem(id, max)
  }
  function setMaxSell(id) {
    const max = maxSell(id)
    if (max > 0) sellItem(id, max)
  }

  function stockPct(commodityId) {
    const p = prices[commodityId]
    if (!p || !p.stockCap) return 0
    return Math.min(100, Math.round((p.stock / p.stockCap) * 100))
  }

  // Clamp input value to max allowed
  function onQtyInput(id, e) {
    const val = parseInt(e.target.value) || 1
    const max = Math.max(maxBuy(id), maxSell(id))
    const clamped = Math.max(1, max > 0 ? Math.min(val, max) : val)
    setQty(id, clamped)
    if (e.target.value !== String(clamped)) e.target.value = clamped
  }

  // Trade-in value for current ship
  $: tiv = ship ? tradeInValue(ship, $player.mileage, $player.damage) : 0
  $: mileagePct = ship ? Math.min(100, Math.round(($player.mileage / (ship.maxMileage ?? 100000)) * 100)) : 0

  function openPurchaseModal(shipId) {
    purchaseModal = { shipId }
    purchaseAction = 'tradein'
  }
  function confirmPurchase() {
    if (purchaseModal) {
      buyShip(purchaseModal.shipId, purchaseAction)
      purchaseModal = null
    }
  }

  function tabList() {
    const tabs = [
      ['market', '📦 Market'],
      ['cargo',  '🗃 Cargo'],
    ]
    if (hasShipyard) tabs.push(['ships', '⚙ Shipyard'])
    if ($player.fleet.length > 0) tabs.push(['fleet', '🚀 Fleet'])
    return tabs
  }
</script>

<!-- Purchase confirmation modal -->
{#if purchaseModal}
  {@const newShipData = getShip(purchaseModal.shipId)}
  {@const storeCost   = newShipData?.price ?? 0}
  {@const tradeinCost = Math.max(0, (newShipData?.price ?? 0) - tiv)}
  {@const canAfford   = $player.credits >= (purchaseAction === 'tradein' ? tradeinCost : storeCost)}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true">
    <div class="panel rounded-xl p-5 w-80 border border-slate-700 shadow-xl">
      <h3 class="text-sm font-bold font-mono-space text-slate-100 mb-1">Purchase {newShipData?.name}</h3>
      <p class="text-xs text-slate-400 mb-4">What do you want to do with your <span class="text-amber-400">{ship?.name}</span>?</p>

      <div class="space-y-2 mb-4">
        <label class="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-slate-800 transition-colors
          {purchaseAction === 'tradein' ? 'bg-slate-800 border border-slate-600' : 'border border-transparent'}">
          <input type="radio" bind:group={purchaseAction} value="tradein" class="mt-0.5"/>
          <div>
            <div class="text-xs font-bold text-slate-200">Trade In</div>
            <div class="text-[11px] text-slate-400">
              Receive <span class="text-green-400">{tiv.toLocaleString()} ¢</span> trade-in value.
              Net cost: <span class="text-amber-400">{tradeinCost.toLocaleString()} ¢</span>
            </div>
            {#if $player.damage > 0 || $player.mileage > 0}
              <div class="text-[10px] text-slate-500 mt-0.5">
                ({$player.damage}% damage, {$player.mileage.toFixed(0)} du mileage reduces value)
              </div>
            {/if}
          </div>
        </label>

        <label class="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-slate-800 transition-colors
          {purchaseAction === 'store' ? 'bg-slate-800 border border-slate-600' : 'border border-transparent'}">
          <input type="radio" bind:group={purchaseAction} value="store" class="mt-0.5"/>
          <div>
            <div class="text-xs font-bold text-slate-200">Store in Shipyard</div>
            <div class="text-[11px] text-slate-400">
              Keep your ship here. Full cost: <span class="text-amber-400">{storeCost.toLocaleString()} ¢</span>
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Retrieve it when you return to this shipyard.</div>
          </div>
        </label>
      </div>

      <div class="flex gap-2">
        <button
          class="flex-1 py-2 rounded text-xs font-mono-space btn-primary"
          disabled={!canAfford || !isDocked}
          on:click={confirmPurchase}
        >
          {canAfford ? 'Confirm' : 'Insufficient ¢'}
        </button>
        <button
          class="flex-1 py-2 rounded text-xs font-mono-space btn-ghost"
          on:click={() => purchaseModal = null}
        >Cancel</button>
      </div>
    </div>
  </div>
{/if}

<div class="flex flex-col h-full overflow-hidden">
  <!-- Tabs -->
  <div class="flex border-b border-slate-800 shrink-0 overflow-x-auto">
    {#each tabList() as [tab, label]}
      <button
        class="flex-1 min-w-fit py-2 px-2 text-xs font-mono-space font-bold transition-colors whitespace-nowrap
          {activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-px' : 'text-slate-500 hover:text-slate-300'}"
        on:click={() => activeTab = tab}
      >{label}</button>
    {/each}
  </div>

  <!-- ── Market tab ── -->
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
              <th class="px-3 py-2 text-slate-500 font-mono-space font-normal">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {#each commodities as c}
              {@const p   = prices[c.id]}
              {@const pct = stockPct(c.id)}
              {#if p}
                <tr class="border-b border-slate-900 hover:bg-slate-900/50 transition-colors">
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      <div>
                        <div class="text-slate-200 font-bold">{c.name}</div>
                        <!-- Stock bar -->
                        <div class="flex items-center gap-1 mt-0.5">
                          <div class="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              class="h-full rounded-full"
                              style="width:{pct}%; background:{pct < 20 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22d3ee'}"
                            ></div>
                          </div>
                          <span class="text-[9px] font-mono-space text-slate-600">{p.stock}/{p.stockCap}</span>
                        </div>
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
                    <div class="flex items-center gap-1 flex-wrap">
                      <input
                        type="number"
                        min="1"
                        max={Math.max(maxBuy(c.id), maxSell(c.id), 1)}
                        value={getQty(c.id)}
                        on:change={e => onQtyInput(c.id, e)}
                        class="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-center font-mono-space text-slate-200"
                      />
                      {#if maxBuy(c.id) > 0}
                        <button
                          class="px-2 py-1 rounded text-[10px] font-mono-space btn-primary"
                          on:click={() => handleBuy(c.id)}
                        >BUY</button>
                        <button
                          class="px-1.5 py-1 rounded text-[9px] font-mono-space text-cyan-400 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Buy maximum available quantity"
                          on:click={() => setMaxBuy(c.id)}
                        >ALL</button>
                      {:else}
                        <span class="text-[10px] text-slate-600 font-mono-space">
                          {p.stock === 0 ? 'Out of stock' : $player.credits < p.buyPrice ? 'No ¢' : 'No space'}
                        </span>
                      {/if}
                      {#if maxSell(c.id) > 0}
                        <button
                          class="px-2 py-1 rounded text-[10px] font-mono-space btn-danger"
                          on:click={() => handleSell(c.id)}
                        >SELL</button>
                        <button
                          class="px-1.5 py-1 rounded text-[9px] font-mono-space text-red-400 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Sell all of this commodity"
                          on:click={() => setMaxSell(c.id)}
                        >ALL</button>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

  <!-- ── Cargo tab ── -->
  {:else if activeTab === 'cargo'}
    <div class="flex-1 overflow-y-auto scrollbar-thin p-3">
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
              {@const c = commodities.find(x => x.id === id)}
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
                    <button class="text-[10px] text-red-400 hover:text-red-300 font-mono-space"
                      on:click={() => sellItem(id, qty)}>SELL ALL</button>
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

  <!-- ── Shipyard tab ── -->
  {:else if activeTab === 'ships'}
    <div class="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
      <!-- Current ship condition -->
      <div class="bg-slate-900 rounded-lg p-3 border border-cyan-900 mb-3">
        <div class="text-[10px] font-mono-space text-slate-400 mb-1">ACTIVE SHIP CONDITION</div>
        <div class="text-sm font-bold font-mono-space text-cyan-400 mb-2">{ship?.name}</div>
        <div class="space-y-1">
          <div class="flex justify-between text-[10px] font-mono-space text-slate-400">
            <span>Mileage</span><span>{$player.mileage.toFixed(1)} / {(ship?.maxMileage ?? 100000).toLocaleString()} du</span>
          </div>
          <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full bg-blue-500" style="width:{mileagePct}%"></div>
          </div>
          <div class="flex justify-between text-[10px] font-mono-space text-slate-400 mt-1">
            <span>Hull Damage</span><span class="{$player.damage > 50 ? 'text-red-400' : $player.damage > 20 ? 'text-amber-400' : 'text-green-400'}">{$player.damage}%</span>
          </div>
          {#if $player.damage > 0}
            <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-red-500" style="width:{$player.damage}%"></div>
            </div>
          {/if}
          <div class="text-[10px] text-amber-300 font-mono-space mt-1">Trade-in value: {tiv.toLocaleString()} ¢</div>
        </div>
      </div>

      {#each ships as s}
        {@const isOwned  = $player.shipId === s.id}
        {@const isStored = $player.fleet.some(f => f.shipId === s.id)}
        <div class="bg-slate-900 rounded-lg p-3 border {isOwned ? 'border-cyan-800' : 'border-slate-800'}">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-slate-100 text-sm font-bold font-mono-space">{s.name}</span>
                <span class="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{s.class}</span>
                {#if isOwned}
                  <span class="text-[10px] text-cyan-400 font-mono-space">ACTIVE</span>
                {/if}
                {#if isStored}
                  <span class="text-[10px] text-amber-400 font-mono-space">IN FLEET</span>
                {/if}
              </div>
              <p class="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{s.description}</p>
              <div class="flex gap-3 mt-1.5 text-[10px] font-mono-space text-slate-400">
                <span>⚡ {s.speed} du/s</span>
                <span>📡 {s.jumpDistance} du</span>
                <span>📦 {s.cargoCapacity} t</span>
              </div>
            </div>
            {#if !isOwned && !isStored}
              <div class="text-right shrink-0">
                <div class="text-amber-400 font-mono-space text-sm font-bold">{s.price.toLocaleString()} ¢</div>
                <div class="text-slate-600 text-[10px]">list price</div>
                <button
                  class="mt-1 px-3 py-1 rounded text-[10px] font-mono-space btn-primary"
                  disabled={!isDocked || !hasShipyard}
                  on:click={() => openPurchaseModal(s.id)}
                >PURCHASE</button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

  <!-- ── Fleet tab ── -->
  {:else if activeTab === 'fleet'}
    <div class="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
      {#if $player.fleet.length === 0}
        <p class="text-xs text-slate-600 font-mono-space text-center py-6">No ships in fleet.<br/>Store a ship when purchasing to add it here.</p>
      {:else}
        {#each $player.fleet as f}
          {@const s    = getShip(f.shipId)}
          {@const fl   = getLocation(f.locationId)}
          {@const atLoc = f.locationId === $player.locationId}
          {@const fMileagePct = s ? Math.min(100, Math.round((f.mileage / (s.maxMileage ?? 100000)) * 100)) : 0}
          <div class="bg-slate-900 rounded-lg p-3 border {atLoc ? 'border-green-800' : 'border-slate-800'}">
            <div class="flex justify-between items-start gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-slate-100 text-sm font-bold font-mono-space">{s?.name}</span>
                  <span class="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{s?.class}</span>
                </div>
                <div class="text-[10px] font-mono-space text-slate-500 mt-0.5">
                  Stored at <span class="{atLoc ? 'text-green-400' : 'text-slate-400'}">{fl?.name ?? f.locationId}</span>
                  {#if !atLoc}<span class="text-slate-600"> — travel there to retrieve</span>{/if}
                </div>
                <div class="flex gap-3 mt-1 text-[10px] font-mono-space text-slate-500">
                  <span>Mileage: {f.mileage.toFixed(0)} du ({fMileagePct}%)</span>
                  <span class="{f.damage > 50 ? 'text-red-400' : f.damage > 20 ? 'text-amber-400' : ''}">
                    Damage: {f.damage}%
                  </span>
                </div>
              </div>
              {#if atLoc && hasShipyard && isDocked}
                <button
                  class="px-3 py-1 rounded text-[10px] font-mono-space btn-primary shrink-0"
                  on:click={() => retrieveShip(f.shipId)}
                >RETRIEVE</button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
