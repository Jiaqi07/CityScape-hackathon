// Building specs based on real Texas energy infrastructure parameters
// Sources: EIA, NREL, ERCOT capacity reports

export const BUILDING_TYPES = {
  solar: {
    id: 'solar',
    name: 'Solar Farm',
    icon: '☀',
    color: '#ffe043',
    glow: 'rgba(255,224,67,0.3)',
    emissive: '#ffe043',
    mw: 150,
    type: 'generation',
    carbonOffset: 120,
    costPerMw: 1.1,
    capacityFactor: 0.26,
    landAcresPerMw: 7,
    description: 'Utility-scale PV array',
    effectRadius: 40,
    height: 0.3,
    shape: 'flat',
  },
  wind: {
    id: 'wind',
    name: 'Wind Farm',
    icon: '💨',
    color: '#00d4ff',
    glow: 'rgba(0,212,255,0.3)',
    emissive: '#00d4ff',
    mw: 300,
    type: 'generation',
    carbonOffset: 150,
    costPerMw: 1.3,
    capacityFactor: 0.36,
    landAcresPerMw: 60,
    description: 'Onshore wind turbine array',
    effectRadius: 60,
    height: 2.8,
    shape: 'turbine',
  },
  battery: {
    id: 'battery',
    name: 'Battery Storage',
    icon: '🔋',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.3)',
    emissive: '#a855f7',
    mw: 200,
    mwh: 800,
    type: 'storage',
    carbonOffset: 30,
    costPerMw: 1.5,
    capacityFactor: 0.85,
    landAcresPerMw: 2,
    description: '4hr lithium-ion BESS',
    effectRadius: 30,
    height: 0.8,
    shape: 'box',
  },
  datacenter: {
    id: 'datacenter',
    name: 'Data Center',
    icon: '🖥',
    color: '#ff6b6b',
    glow: 'rgba(255,107,107,0.3)',
    emissive: '#ff6b6b',
    mw: 80,
    type: 'load',
    carbonFootprint: 95,
    costPerMw: 8.0,
    capacityFactor: 0.92,
    landAcresPerMw: 0.5,
    description: 'Hyperscale compute campus',
    effectRadius: 25,
    height: 1.4,
    shape: 'tower',
  },
  hydrogen: {
    id: 'hydrogen',
    name: 'H₂ Electrolyzer',
    icon: '⚗',
    color: '#00ff88',
    glow: 'rgba(0,255,136,0.3)',
    emissive: '#00ff88',
    mw: 100,
    type: 'load',
    carbonFootprint: 0,
    costPerMw: 2.5,
    capacityFactor: 0.65,
    landAcresPerMw: 1,
    description: 'Green hydrogen production',
    effectRadius: 30,
    height: 1.0,
    shape: 'cylinder',
  },
  nuclear: {
    id: 'nuclear',
    name: 'SMR Nuclear',
    icon: '⚛',
    color: '#ff8c42',
    glow: 'rgba(255,140,66,0.3)',
    emissive: '#ff8c42',
    mw: 300,
    type: 'generation',
    carbonOffset: 200,
    costPerMw: 6.5,
    capacityFactor: 0.93,
    landAcresPerMw: 1,
    description: 'Small modular reactor',
    effectRadius: 50,
    height: 1.6,
    shape: 'dome',
  },
  substation: {
    id: 'substation',
    name: 'Substation',
    icon: '⚡',
    color: '#00d4ff',
    glow: 'rgba(0,212,255,0.3)',
    emissive: '#00d4ff',
    mw: 0,
    type: 'infrastructure',
    costPerMw: 0,
    capacityFactor: 1,
    description: 'Grid substation node',
    effectRadius: 0,
    height: 0.6,
    shape: 'pylon',
  },
};

export const BUILDING_LIST = Object.values(BUILDING_TYPES).filter(b => b.id !== 'substation');

export function calcBuildingEffect(building) {
  const spec = BUILDING_TYPES[building.type];
  if (!spec) return { netMw: 0, effectiveMw: 0 };
  const effectiveMw = spec.mw * spec.capacityFactor;
  if (spec.type === 'generation') return { netMw: effectiveMw, effectiveMw };
  if (spec.type === 'load') return { netMw: -effectiveMw, effectiveMw };
  return { netMw: 0, effectiveMw };
}

export function findNearestSubstation(lng, lat, substations) {
  let best = null, bestDist = Infinity;
  for (const sub of substations) {
    const d = Math.hypot(sub.lng - lng, sub.lat - lat);
    if (d < bestDist) { bestDist = d; best = sub; }
  }
  return best;
}
