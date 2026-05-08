<script>
  import { logs } from '../stores/gameStore.js'

  const typeColors = {
    info: 'text-slate-400',
    travel: 'text-cyan-400',
    trade: 'text-amber-400',
    warning: 'text-orange-400',
    danger: 'text-red-400',
  }

  const typePrefix = {
    info: '·',
    travel: '→',
    trade: '$',
    warning: '!',
    danger: '☠',
  }
</script>

<div class="h-24 border-t border-slate-800 overflow-y-auto scrollbar-thin bg-[#020508] shrink-0">
  {#if $logs.length === 0}
    <div class="flex items-center justify-center h-full">
      <p class="text-xs text-slate-700 font-mono-space">No events logged</p>
    </div>
  {:else}
    <div class="px-3 py-1.5 space-y-0.5">
      {#each $logs as log}
        <div class="flex items-start gap-2 text-xs font-mono-space leading-relaxed">
          <span class="text-slate-600 shrink-0 w-12 text-[10px]">{log.time}</span>
          <span class="shrink-0 {typeColors[log.type] ?? 'text-slate-500'}">{typePrefix[log.type] ?? '·'}</span>
          <span class="{typeColors[log.type] ?? 'text-slate-400'} flex-1">{log.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
