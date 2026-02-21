// Building specs based on real Texas energy infrastructure parameters
// Sources: EIA, NREL, ERCOT capacity reports

export const BUILDING_TYPES = {
  // --- Urban / Austin city-builder buildings ---
  home: {
    id: 'home',
    name: 'Suburban Homes',
    icon: '🏠',
    color: '#7dd3fc',
    glow: 'rgba(125,211,252,0.25)',
    emissive: '#7dd3fc',
    mw: 2,
    type: 'load',
    category: 'city',
    costPerMw: 6.0, // used as generic $M per placement for city buildings
    capacityFactor: 0.55,
    landAcresPerMw: 0.2,
    description: 'Single-family neighborhood',
    effectRadius: 0,
    height: 0.55,
    shape: 'home',
    sim: { housing: 120, jobs: 0, popPerHousing: 2.4, taxPerDay: 0.12, serviceCostPerDay: 0.06, happiness: 0.7 },
  },
  apartments: {
    id: 'apartments',
    name: 'Apartments',
    icon: '🏢',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.25)',
    emissive: '#60a5fa',
    mw: 6,
    type: 'load',
    category: 'city',
    costPerMw: 18.0,
    capacityFactor: 0.62,
    landAcresPerMw: 0.05,
    description: 'Mid-rise housing',
    effectRadius: 0,
    height: 1.2,
    shape: 'midrise',
    sim: { housing: 420, jobs: 30, popPerHousing: 1.9, taxPerDay: 0.32, serviceCostPerDay: 0.18, happiness: 0.62 },
  },
  retail: {
    id: 'retail',
    name: 'Retail Street',
    icon: '🛍',
    color: '#fb7185',
    glow: 'rgba(251,113,133,0.25)',
    emissive: '#fb7185',
    mw: 3,
    type: 'load',
    category: 'city',
    costPerMw: 10.0,
    capacityFactor: 0.65,
    landAcresPerMw: 0.05,
    description: 'Shops + restaurants',
    effectRadius: 0,
    height: 0.8,
    shape: 'lowrise',
    sim: { housing: 0, jobs: 220, popPerHousing: 0, taxPerDay: 0.22, serviceCostPerDay: 0.11, happiness: 0.66 },
  },
  tech: {
    id: 'tech',
    name: 'Tech Campus',
    icon: '🧑‍💻',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.25)',
    emissive: '#22c55e',
    mw: 12,
    type: 'load',
    category: 'city',
    costPerMw: 45.0,
    capacityFactor: 0.75,
    landAcresPerMw: 0.08,
    description: 'Austin tech HQ + labs',
    effectRadius: 0,
    height: 1.0,
    shape: 'campus',
    sim: { housing: 0, jobs: 1800, popPerHousing: 0, taxPerDay: 0.85, serviceCostPerDay: 0.35, happiness: 0.6 },
  },
  park: {
    id: 'park',
    name: 'Park',
    icon: '🌳',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.18)',
    emissive: '#34d399',
    mw: 0.3,
    type: 'load',
    category: 'city',
    costPerMw: 4.0,
    capacityFactor: 0.45,
    landAcresPerMw: 0.2,
    description: 'Green space + trails',
    effectRadius: 0,
    height: 0.2,
    shape: 'park',
    sim: { housing: 0, jobs: 25, popPerHousing: 0, taxPerDay: 0.03, serviceCostPerDay: 0.09, happiness: 0.9 },
  },

  // --- Grid / Energy buildings ---
  solar: {
    id: 'solar',
    name: 'Solar Farm',
    icon: '☀',
    color: '#ffe043',
    glow: 'rgba(255,224,67,0.3)',
    emissive: '#ffe043',
    mw: 150,
    type: 'generation',
    category: 'energy',
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
    category: 'energy',
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
    category: 'energy',
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
    category: 'energy',
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
    category: 'energy',
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
    category: 'energy',
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
    category: 'grid',
    costPerMw: 0,
    capacityFactor: 1,
    description: 'Grid substation node',
    effectRadius: 0,
    height: 0.6,
    shape: 'pylon',
  },
};

export const BUILDING_LIST = Object.values(BUILDING_TYPES).filter(b => b.id !== 'substation');

export const BUILDING_CATEGORIES = [
  { id: 'city', label: 'CITY' },
  { id: 'energy', label: 'ENERGY' },
];

export const SPECIAL_TOOLS = {
  expand: {
    id: 'expand',
    name: 'Expand Grid',
    icon: '🧱',
    color: '#c0d4e8',
    glow: 'rgba(192,212,232,0.18)',
    category: 'tools',
    description: 'Unlock new buildable chunks',
  },
};

export function calcBuildingEffect(building) {
  const spec = BUILDING_TYPES[building.type];
  if (!spec) return { netMw: 0, effectiveMw: 0 };
  const effectiveMw = spec.mw * spec.capacityFactor;
  if (spec.type === 'generation') return { netMw: effectiveMw, effectiveMw };
  if (spec.type === 'load') return { netMw: -effectiveMw, effectiveMw };
  return { netMw: 0, effectiveMw };
}

export function calcPlacementCostM(buildingTypeId) {
  const spec = BUILDING_TYPES[buildingTypeId];
  if (!spec) return 0;
  // Energy buildings: keep original meaning ($M per MW * MW)
  if (spec.category === 'energy') return (spec.costPerMw || 0) * (spec.mw || 0);
  // City buildings: costPerMw is a simple per-placement $M
  if (spec.category === 'city') return spec.costPerMw || 0;
  return 0;
}

export function calcCityStats(placedBuildings) {
  let housing = 0;
  let jobs = 0;
  let pop = 0;
  let taxPerDay = 0;
  let serviceCostPerDay = 0;
  let happinessNumer = 0;
  let happinessDenom = 0;

  placedBuildings.forEach(b => {
    const spec = BUILDING_TYPES[b.type];
    const sim = spec?.sim;
    if (!sim) return;
    housing += sim.housing || 0;
    jobs += sim.jobs || 0;
    pop += (sim.housing || 0) * (sim.popPerHousing || 0);
    taxPerDay += sim.taxPerDay || 0;
    serviceCostPerDay += sim.serviceCostPerDay || 0;
    const weight = (sim.housing || 0) + (sim.jobs || 0) * 0.2;
    happinessNumer += (sim.happiness ?? 0.6) * weight;
    happinessDenom += weight;
  });

  const happiness = happinessDenom > 0 ? happinessNumer / happinessDenom : 0.6;
  const netPerDay = taxPerDay - serviceCostPerDay;

  return {
    population: Math.round(pop),
    housingUnits: Math.round(housing),
    jobs: Math.round(jobs),
    taxPerDay,
    serviceCostPerDay,
    netPerDay,
    happiness,
  };
}

export function findNearestSubstation(lng, lat, substations) {
  let best = null, bestDist = Infinity;
  for (const sub of substations) {
    const d = Math.hypot(sub.lng - lng, sub.lat - lat);
    if (d < bestDist) { bestDist = d; best = sub; }
  }
  return best;
}
