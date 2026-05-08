// basePrice: market price at a neutral location
// Prices at producer locations: 30-60% of base
// Prices at consumer locations: 150-280% of base
// Prices at neutral locations: 85-115% of base

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

// Generate market prices for a location
// Returns { commodityId: { buyPrice, sellPrice } }
export function generateMarketPrices(location) {
  const prices = {}
  for (const commodity of commodities) {
    const isProducer = location.produces?.includes(commodity.id)
    const isConsumer = location.consumes?.includes(commodity.id)

    let marketPrice
    if (isProducer) {
      marketPrice = commodity.basePrice * (0.3 + Math.random() * 0.3)
    } else if (isConsumer) {
      marketPrice = commodity.basePrice * (1.5 + Math.random() * 1.3)
    } else {
      marketPrice = commodity.basePrice * (0.85 + Math.random() * 0.3)
    }
    marketPrice = Math.round(marketPrice)
    prices[commodity.id] = {
      buyPrice: Math.round(marketPrice * 1.08),
      sellPrice: Math.round(marketPrice * 0.72),
    }
  }
  return prices
}
