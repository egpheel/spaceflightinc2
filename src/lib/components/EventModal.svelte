<script>
  import { player, pendingEvent, resolveEvent } from '../stores/gameStore.js'

  $: event = $pendingEvent
  $: remainingMs = event ? Math.max(0, event.originalArrivalTime - Date.now()) : 0

  const severityStyles = {
    info: { border: 'border-cyan-700', bg: 'bg-cyan-900/20', icon: 'text-cyan-400', title: 'text-cyan-300' },
    warning: { border: 'border-amber-700', bg: 'bg-amber-900/20', icon: 'text-amber-400', title: 'text-amber-300' },
    danger: { border: 'border-red-700', bg: 'bg-red-900/20', icon: 'text-red-400', title: 'text-red-300' },
  }

  $: styles = event ? (severityStyles[event.severity] ?? severityStyles.info) : severityStyles.info

  function choose(i) { resolveEvent(i) }
</script>

{#if event}
  <!-- Backdrop -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="w-full max-w-md panel rounded-xl border {styles.border} {styles.bg} fade-in-up shadow-2xl">
      <!-- Header -->
      <div class="p-5 pb-3">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-3xl {styles.icon}" role="img" aria-label="event">{event.icon}</span>
          <div>
            <p class="text-[10px] font-mono-space text-slate-500 uppercase tracking-widest">TRAVEL EVENT</p>
            <h2 class="text-lg font-bold font-mono-space {styles.title}">{event.name}</h2>
          </div>
        </div>
        <p class="text-sm text-slate-300 leading-relaxed">{event.description}</p>
        {#if event.flavour}
          <p class="text-xs text-slate-500 italic mt-2 leading-relaxed border-l-2 border-slate-700 pl-3">
            {event.flavour}
          </p>
        {/if}
      </div>

      <!-- Choices -->
      <div class="px-5 pb-5 space-y-2">
        <p class="text-[10px] font-mono-space text-slate-500 uppercase tracking-wide mb-3">Choose your response:</p>
        {#each event.choices as choice, i}
          <button
            class="w-full text-left rounded-lg px-4 py-3 border transition-all btn-ghost hover:border-slate-600 group"
            on:click={() => choose(i)}
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="font-bold text-sm text-slate-200 group-hover:text-white transition-colors font-mono-space">
                  {choice.label}
                </div>
                <div class="text-xs text-slate-500 mt-0.5 leading-relaxed">{choice.description}</div>
              </div>
              <span class="text-slate-600 group-hover:text-slate-400 mt-0.5 shrink-0">→</span>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
