// speed: dunits/second (1 dunit = 0.1 AU)
// jumpDistance: max single-hop range in dunits
// cargoCapacity: max cargo units
// price: cost in credits
//
// Travel time reference (distance / speed):
//   Earth-Mars min ~5 du  at 0.010 du/s = ~8 min
//   Earth-Jupiter min ~42 du at 0.010 du/s = ~70 min
//   Jupiter-Saturn min ~44 du at 0.007 du/s = ~105 min

export const ships = [
  // ─── Class: Scout ──────────────────────────────────────────────────────────
  // Fast and nimble, minimal cargo. Best for scouting routes and quick hops.
  {
    id: 'dart-i',
    name: 'Dart I',
    class: 'Scout',
    speed: 0.010,
    jumpDistance: 50,
    cargoCapacity: 12,
    price: 1500,
    maxMileage: 50000,
    description: 'Entry-level scout. Quick across short hops but hauls almost nothing.',
  },
  {
    id: 'dart-ii',
    name: 'Dart II',
    class: 'Scout',
    speed: 0.013,
    jumpDistance: 70,
    cargoCapacity: 18,
    price: 3200,
    maxMileage: 50000,
    description: 'Improved scout with a modest cargo bay. Good for early inner-system runs.',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    class: 'Scout',
    speed: 0.016,
    jumpDistance: 90,
    cargoCapacity: 14,
    price: 6500,
    maxMileage: 50000,
    description: 'Speed-optimised hull. Reaches the asteroid belt and inner Jupiter from Earth.',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    class: 'Scout',
    speed: 0.020,
    jumpDistance: 120,
    cargoCapacity: 10,
    price: 12000,
    maxMileage: 50000,
    description: 'Top-of-class scout. Can reach Saturn from Earth when aligned. Pure speed.',
  },

  // ─── Class: Courier ────────────────────────────────────────────────────────
  {
    id: 'relay-mk1',
    name: 'Relay MK1',
    class: 'Courier',
    speed: 0.007,
    jumpDistance: 60,
    cargoCapacity: 55,
    price: 4500,
    maxMileage: 80000,
    description: 'The classic courier. Reliable, affordable, gets the job done.',
  },
  {
    id: 'relay-mk2',
    name: 'Relay MK2',
    class: 'Courier',
    speed: 0.009,
    jumpDistance: 80,
    cargoCapacity: 70,
    price: 8500,
    maxMileage: 80000,
    description: 'Upgraded relay with extended jump range. Can reach Jupiter when well-positioned.',
  },
  {
    id: 'swift-arrow',
    name: 'Swift Arrow',
    class: 'Courier',
    speed: 0.011,
    jumpDistance: 100,
    cargoCapacity: 80,
    price: 14000,
    maxMileage: 80000,
    description: 'Fast courier with solid cargo. Reliably reaches Jupiter from Earth.',
  },
  {
    id: 'falcon-x',
    name: 'Falcon X',
    class: 'Courier',
    speed: 0.014,
    jumpDistance: 130,
    cargoCapacity: 90,
    price: 22000,
    maxMileage: 80000,
    description: 'Premium courier. Long jump range covers Earth–Saturn comfortably when aligned.',
  },

  // ─── Class: Freighter ──────────────────────────────────────────────────────
  {
    id: 'iron-mule',
    name: 'Iron Mule',
    class: 'Freighter',
    speed: 0.004,
    jumpDistance: 40,
    cargoCapacity: 150,
    price: 9000,
    maxMileage: 120000,
    description: "Slow but dependable. The trader's bread-and-butter for inner routes.",
  },
  {
    id: 'cargo-king',
    name: 'Cargo King',
    class: 'Freighter',
    speed: 0.0045,
    jumpDistance: 50,
    cargoCapacity: 210,
    price: 16000,
    maxMileage: 120000,
    description: 'A step up from the Iron Mule. More cargo, slightly longer range.',
  },
  {
    id: 'void-hauler',
    name: 'Void Hauler',
    class: 'Freighter',
    speed: 0.005,
    jumpDistance: 60,
    cargoCapacity: 270,
    price: 24000,
    maxMileage: 120000,
    description: 'Mid-tier freighter covering the asteroid belt and Jupiter routes.',
  },
  {
    id: 'star-ox',
    name: 'Star Ox',
    class: 'Freighter',
    speed: 0.006,
    jumpDistance: 75,
    cargoCapacity: 330,
    price: 34000,
    maxMileage: 120000,
    description: 'Heavy freighter that keeps reasonable speed. Respected on outer routes.',
  },

  // ─── Class: Heavy Freighter ────────────────────────────────────────────────
  {
    id: 'titan-hauler',
    name: 'Titan Hauler',
    class: 'Heavy Freighter',
    speed: 0.0025,
    jumpDistance: 30,
    cargoCapacity: 550,
    price: 40000,
    maxMileage: 150000,
    description: 'Enormous cargo bay. Limited range — plan inner-system hops carefully.',
  },
  {
    id: 'colossus-i',
    name: 'Colossus I',
    class: 'Heavy Freighter',
    speed: 0.0018,
    jumpDistance: 25,
    cargoCapacity: 750,
    price: 58000,
    maxMileage: 150000,
    description: 'Bulk carrier. Short hops only — pairs well with scout relay ships.',
  },
  {
    id: 'colossus-ii',
    name: 'Colossus II',
    class: 'Heavy Freighter',
    speed: 0.0013,
    jumpDistance: 22,
    cargoCapacity: 980,
    price: 80000,
    maxMileage: 150000,
    description: 'A floating warehouse. Barely moves but single runs pay enormous sums.',
  },
  {
    id: 'leviathan',
    name: 'Leviathan',
    class: 'Heavy Freighter',
    speed: 0.001,
    jumpDistance: 18,
    cargoCapacity: 1300,
    price: 115000,
    maxMileage: 150000,
    description: 'The largest commercial ship available. Inner-system only without relay chains.',
  },

  // ─── Class: Explorer ───────────────────────────────────────────────────────
  {
    id: 'wanderer',
    name: 'Wanderer',
    class: 'Explorer',
    speed: 0.007,
    jumpDistance: 150,
    cargoCapacity: 45,
    price: 18000,
    maxMileage: 200000,
    description: 'Entry-level explorer. Its long range opens up the entire outer system.',
  },
  {
    id: 'horizon-seeker',
    name: 'Horizon Seeker',
    class: 'Explorer',
    speed: 0.009,
    jumpDistance: 200,
    cargoCapacity: 40,
    price: 30000,
    maxMileage: 200000,
    description: 'Can bridge Jupiter to Uranus. Premium deep-space hull.',
  },
  {
    id: 'deep-scout',
    name: 'Deep Scout',
    class: 'Explorer',
    speed: 0.012,
    jumpDistance: 280,
    cargoCapacity: 35,
    price: 48000,
    maxMileage: 200000,
    description: 'Covers the entire solar system in a handful of hops. Best-in-class range.',
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    class: 'Explorer',
    speed: 0.015,
    jumpDistance: 400,
    cargoCapacity: 30,
    price: 75000,
    maxMileage: 200000,
    description: 'End-game explorer. Earth to Pluto in a single hop when aligned. Legendary.',
  },
]

export const shipClasses = ['Scout', 'Courier', 'Freighter', 'Heavy Freighter', 'Explorer']

export function getShip(id) {
  return ships.find(s => s.id === id)
}

export function getShipsByClass(cls) {
  return ships.filter(s => s.class === cls)
}
