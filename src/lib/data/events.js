// Random events that fire during travel.
// probability: cumulative thresholds (first 30% = no event)
// Each event has choices; each choice has an effect object.
// Effect types: delay (multiply remaining time), credits, cargo_gain, cargo_loss,
//               teleport (random location), log_only

export const travelEvents = [
  {
    id: 'solar-storm',
    name: 'Solar Storm',
    icon: '☀',
    severity: 'warning',
    description: "A violent solar ejection is battering your ship's shields. Navigation systems are struggling to compensate.",
    flavour: 'The hull groans as superheated plasma washes over the shields. Your ETA just went way up.',
    choices: [
      {
        label: 'Power through it',
        description: 'Maintain course. Travel time increases by 60%.',
        effect: { type: 'delay', multiplier: 1.6 },
      },
      {
        label: 'Emergency boost (300 ¢)',
        description: 'Burn extra fuel to punch through. No delay but costs 300 credits.',
        effect: { type: 'credits', amount: -300 },
        requiresCredits: 300,
      },
      {
        label: 'Shelter in place (2.5× delay)',
        description: 'Wait out the storm safely. Much longer delay but zero risk.',
        effect: { type: 'delay', multiplier: 2.5 },
      },
    ],
  },
  {
    id: 'pirate-attack',
    name: 'Pirate Interdiction',
    icon: '☠',
    severity: 'danger',
    description: 'A pirate vessel has locked a tractor beam onto your ship. They demand tribute.',
    flavour: "\"Pay up or we take everything.\" The comms crackle with their ultimatum.",
    choices: [
      {
        label: 'Pay the toll',
        description: 'Hand over 15% of your cargo value in credits. They leave you alone.',
        effect: { type: 'pirate_toll', percent: 0.15 },
      },
      {
        label: 'Outrun them (50/50)',
        description: 'Boost engines and try to escape. 50% chance: free. 50% chance: lose 25% of cargo.',
        effect: { type: 'escape_attempt', successEffect: { type: 'none' }, failEffect: { type: 'cargo_loss', percent: 0.25 } },
      },
      {
        label: 'Broadcast distress signal',
        description: 'Alliance patrol may respond. 40% chance they arrive in time. Otherwise pay double toll.',
        effect: { type: 'distress_rescue', successEffect: { type: 'none' }, failEffect: { type: 'pirate_toll', percent: 0.30 } },
      },
    ],
  },
  {
    id: 'derelict-ship',
    name: 'Derelict Vessel',
    icon: '🛸',
    severity: 'info',
    description: 'Sensors detect an abandoned ship drifting nearby. Life signs: none. Cargo hold: intact.',
    flavour: "The registry comes back as the Stellarion — reported missing 14 months ago. No one's claimed salvage rights.",
    choices: [
      {
        label: 'Salvage the cargo',
        description: 'Dock and strip the hold. Gain random cargo worth 400–1200 ¢. Adds 45 seconds to ETA.',
        effect: { type: 'salvage', minValue: 400, maxValue: 1200, delay: 45 },
      },
      {
        label: 'Report it and move on',
        description: 'Log the coordinates with Alliance authorities. Gain 100 ¢ finder\'s fee later.',
        effect: { type: 'credits', amount: 100 },
      },
      {
        label: 'Ignore it',
        description: 'Not worth the detour. Continue course unaffected.',
        effect: { type: 'none' },
      },
    ],
  },
  {
    id: 'distress-signal',
    name: 'Distress Signal',
    icon: '📡',
    severity: 'warning',
    description: "A civilian vessel is broadcasting a distress signal. They've lost engine power.",
    flavour: "\"Mayday, mayday — we have three hundred colonists aboard and no power to life support.\" You check your ETA.",
    choices: [
      {
        label: 'Respond to the call',
        description: 'Divert to assist. 90-second delay, but gain 800 ¢ in gratitude and Alliance reputation.',
        effect: { type: 'rescue', credits: 800, delay: 90 },
      },
      {
        label: 'Relay the signal and continue',
        description: "Bounce their signal to the nearest station. You're not equipped to help anyway.",
        effect: { type: 'credits', amount: 0 },
      },
    ],
  },
  {
    id: 'wormhole',
    name: 'Wormhole Detected',
    icon: '🌀',
    severity: 'info',
    description: 'Navigational sensors are going haywire. A stable wormhole has opened directly on your course.',
    flavour: "Impossible. Wormholes don't exist — yet here it is, shimmering like a tear in space.",
    choices: [
      {
        label: 'Enter the wormhole',
        description: 'Emerge at a random location in the solar system. Could be anywhere.',
        effect: { type: 'wormhole' },
      },
      {
        label: 'Veer off and document it',
        description: 'Record the coordinates and sell the data for 500 ¢. Minor 20-second delay.',
        effect: { type: 'credits', amount: 500, delay: 20 },
      },
    ],
  },
  {
    id: 'engine-trouble',
    name: 'Engine Malfunction',
    icon: '⚠',
    severity: 'danger',
    description: "Your primary engine is overheating. Warning lights are flooding the cockpit.",
    flavour: "\"Hull temperature critical. Recommend immediate engine shutdown.\" Your ship AI isn't wrong.",
    choices: [
      {
        label: 'Emergency shutdown',
        description: 'Safe but slow. Travel time increases by 200%.',
        effect: { type: 'delay', multiplier: 3.0 },
      },
      {
        label: 'Push through it',
        description: 'Keep going. 70% chance nothing bad happens. 30% chance you lose 10% of cargo.',
        effect: { type: 'risky_push', successEffect: { type: 'none' }, failEffect: { type: 'cargo_loss', percent: 0.10 }, failChance: 0.30 },
      },
    ],
  },
  {
    id: 'meteor-shower',
    name: 'Meteor Field',
    icon: '☄',
    severity: 'warning',
    description: 'A dense field of debris lies directly ahead. Probably remnants from a recent collision.',
    flavour: "The forward camera shows a sparkling wall of rock and ice. Beautiful — and about to hurt.",
    choices: [
      {
        label: 'Navigate through carefully',
        description: '30% delay but safe passage.',
        effect: { type: 'delay', multiplier: 1.3 },
      },
      {
        label: 'Full detour around it',
        description: '80% delay but completely safe.',
        effect: { type: 'delay', multiplier: 1.8 },
      },
      {
        label: 'Blast through at full speed',
        description: "No delay, but 40% chance of losing 10% cargo to hull impacts.",
        effect: { type: 'risky_push', successEffect: { type: 'none' }, failEffect: { type: 'cargo_loss', percent: 0.10 }, failChance: 0.40 },
      },
    ],
  },
  {
    id: 'friendly-trader',
    name: 'Roaming Trader',
    icon: '🤝',
    severity: 'info',
    description: 'A friendly independent trader hails you. They need a specific commodity and are paying over market.',
    flavour: '"I\'ll pay 140% of your cargo\'s market value — right now, no haggling. What do you say?"',
    choices: [
      {
        label: 'Sell your largest cargo at 140%',
        description: 'Offload the commodity you\'re carrying most of at 1.4× market sell price.',
        effect: { type: 'sell_premium', multiplier: 1.4 },
      },
      {
        label: 'Decline',
        description: "You're headed somewhere that'll pay even more.",
        effect: { type: 'none' },
      },
    ],
  },
  {
    id: 'comet-encounter',
    name: 'Comet Encounter',
    icon: '☄',
    severity: 'info',
    description: "Your path has crossed a periodic comet's tail. Rich in organic compounds and ice.",
    flavour: "Through the viewport, a glittering ribbon of ice crystals stretches for thousands of kilometres. Your cargo scoop is spinning up.",
    choices: [
      {
        label: 'Harvest the tail',
        description: 'Collect organics and water ice from the coma. 30-second delay, but free cargo.',
        effect: { type: 'comet_harvest', delay: 30 },
      },
      {
        label: 'Continue on course',
        description: "No time for sightseeing.",
        effect: { type: 'none' },
      },
    ],
  },
  {
    id: 'nav-beacon',
    name: 'Uncharted Beacon',
    icon: '📍',
    severity: 'info',
    description: "Your sensors have picked up an uncharted navigation beacon — not on any official registry.",
    flavour: "Someone put this here and didn't want it found. The signal is strong and the coordinates are precise.",
    choices: [
      {
        label: 'Log and sell the data (200 ¢)',
        description: 'Add it to your charts and sell the coordinates to the Alliance.',
        effect: { type: 'credits', amount: 200 },
      },
      {
        label: 'Investigate',
        description: "Follow the beacon. Could lead somewhere interesting — or dangerous.",
        effect: { type: 'credits', amount: 350, delay: 40 },
      },
    ],
  },
]

// Returns a random event (or null if no event fires this trip)
export function rollEvent() {
  const roll = Math.random()
  if (roll < 0.30) return null // 30% chance of no event
  const idx = Math.floor((roll - 0.30) / 0.70 * travelEvents.length)
  return travelEvents[Math.min(idx, travelEvents.length - 1)]
}
