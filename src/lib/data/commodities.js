export const commodities = [
  {
    id: 'food',
    name: 'Food & Nutrients',
    unit: 'ton',
    basePrice: 50,
    color: '#4ade80',
    icon: '🌾',
    description: 'Synthetic and organic food supplies. Universally needed everywhere.',
  },
  {
    id: 'water',
    name: 'Water & Ice',
    unit: 'ton',
    basePrice: 80,
    color: '#38bdf8',
    icon: '💧',
    description: 'Purified water and raw water ice. Cheap at ice moons, precious in the inner system.',
  },
  {
    id: 'ore',
    name: 'Metal Ore',
    unit: 'ton',
    basePrice: 65,
    color: '#94a3b8',
    icon: '⛏',
    description: 'Raw metallic ore from asteroid mining. Heavy but always in demand.',
  },
  {
    id: 'fuel',
    name: 'Fuel Crystals',
    unit: 'ton',
    basePrice: 130,
    color: '#fb923c',
    icon: '⚡',
    description: 'Compressed hydrogen and helium-3 fuel. Essential for all ships.',
  },
  {
    id: 'tech',
    name: 'Tech Components',
    unit: 'ton',
    basePrice: 220,
    color: '#22d3ee',
    icon: '🔧',
    description: 'Electronics, computer cores, and precision components. High value, high demand.',
  },
  {
    id: 'medicine',
    name: 'Medical Supplies',
    unit: 'ton',
    basePrice: 190,
    color: '#f87171',
    icon: '💊',
    description: 'Pharmaceuticals, medical equipment, and life-support supplies.',
  },
  {
    id: 'minerals',
    name: 'Rare Minerals',
    unit: 'ton',
    basePrice: 380,
    color: '#c084fc',
    icon: '💎',
    description: 'Platinum-group metals, rare earths, and exotic crystalline compounds.',
  },
  {
    id: 'gases',
    name: 'Exotic Gases',
    unit: 'ton',
    basePrice: 160,
    color: '#34d399',
    icon: '🌬',
    description: 'Noble and exotic gases extracted from gas giants. Used in manufacturing and medicine.',
  },
  {
    id: 'luxury',
    name: 'Luxury Goods',
    unit: 'ton',
    basePrice: 450,
    color: '#fbbf24',
    icon: '✨',
    description: 'Art, fine spirits, bespoke technology. Outer system colonists pay dearly for comfort.',
  },
  {
    id: 'organics',
    name: 'Organic Compounds',
    unit: 'ton',
    basePrice: 110,
    color: '#a3e635',
    icon: '🧬',
    description: 'Complex carbon compounds from comets and active moons. Used in biotech and research.',
  },
]

export function getCommodity(id) {
  return commodities.find(c => c.id === id)
}

// Generate finite stock state for a location.
// Returns { [commodityId]: { stock, stockCap, supplyRate, consumeRate, basePrice, isProducer, isConsumer } }
export function generateMarketStock(location) {
  const result = {}
  for (const c of commodities) {
    const isProducer = !!location.produces?.includes(c.id)
    const isConsumer = !!location.consumes?.includes(c.id)

    let stockCap, supplyRate, consumeRate, initialRatio
    if (isProducer) {
      stockCap    = 180 + Math.floor(Math.random() * 200)  // 180–380
      supplyRate  = 18  + Math.floor(Math.random() * 18)   // 18–36 per tick
      consumeRate = 4   + Math.floor(Math.random() * 4)    // 4–8 per tick
      initialRatio = 0.60 + Math.random() * 0.30            // 60–90 % full
    } else if (isConsumer) {
      stockCap    = 80  + Math.floor(Math.random() * 80)   // 80–160
      supplyRate  = 3   + Math.floor(Math.random() * 4)    // 3–7 per tick
      consumeRate = 14  + Math.floor(Math.random() * 12)   // 14–26 per tick
      initialRatio = 0.15 + Math.random() * 0.30            // 15–45 % full
    } else {
      stockCap    = 100 + Math.floor(Math.random() * 80)   // 100–180
      supplyRate  = 9   + Math.floor(Math.random() * 9)    // 9–18 per tick
      consumeRate = 6   + Math.floor(Math.random() * 6)    // 6–12 per tick
      initialRatio = 0.35 + Math.random() * 0.35            // 35–70 % full
    }

    result[c.id] = {
      stock: Math.round(stockCap * initialRatio),
      stockCap,
      supplyRate,
      consumeRate,
      basePrice: c.basePrice,
      isProducer,
      isConsumer,
    }
  }
  return result
}

// Derive buy/sell price from stock level and location type.
// ratio = stock / stockCap (0 = empty → high price, 1 = full → low price)
export function stockPrice(info) {
  const ratio = info.stockCap > 0 ? Math.min(1, info.stock / info.stockCap) : 0.5
  let mult
  if (info.isProducer) {
    mult = 0.30 + (1 - ratio) * 0.25   // 0.30 (full) → 0.55 (empty)
  } else if (info.isConsumer) {
    mult = 1.50 + (1 - ratio) * 1.30   // 1.50 (full) → 2.80 (empty)
  } else {
    mult = 0.85 + (1 - ratio) * 0.30   // 0.85 (full) → 1.15 (empty)
  }
  const market = Math.round(info.basePrice * Math.max(0.1, mult))
  return {
    buyPrice:  Math.round(market * 1.08),
    sellPrice: Math.round(market * 0.72),
    stock:     info.stock,
    stockCap:  info.stockCap,
  }
}
