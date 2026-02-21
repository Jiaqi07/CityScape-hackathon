// Texas cities with ERCOT substation data
// Each city has a grid position for the 3D city view and real coordinates

export const CITIES = {
  austin: {
    id: 'austin',
    name: 'Austin',
    lng: -97.74,
    lat: 30.27,
    kv: 345,
    cap: 3200,
    population: '2.3M',
    // City-builder world settings (tile units)
    worldSize: 40,
    chunkSize: 8,
    initialChunks: [
      // 2x2 unlocked to start (downtown + close-in neighborhoods)
      [2, 2], [3, 2],
      [2, 3], [3, 3],
    ],
    // Downtown roughly north of the river
    downtown: { x: 20, z: 17 },
    riverZ: 20,
    color: '#00d4ff',
  },
};

export const CITY_LIST = Object.values(CITIES);

export const SUBSTATIONS = [
  { id: 0,  name: 'Houston',         lng: -95.37,  lat: 29.76, kv: 345, cap: 4800, city: 'houston' },
  { id: 1,  name: 'Beaumont',        lng: -94.10,  lat: 30.08, kv: 138, cap: 1900 },
  { id: 2,  name: 'Austin',          lng: -97.74,  lat: 30.27, kv: 345, cap: 3200, city: 'austin' },
  { id: 3,  name: 'San Antonio',     lng: -98.49,  lat: 29.42, kv: 345, cap: 3600, city: 'sanantonio' },
  { id: 4,  name: 'Dallas',          lng: -96.80,  lat: 32.78, kv: 500, cap: 5500, city: 'dallas' },
  { id: 5,  name: 'Fort Worth',      lng: -97.33,  lat: 32.75, kv: 345, cap: 3000, city: 'dallas' },
  { id: 6,  name: 'Corpus Christi',  lng: -97.40,  lat: 27.80, kv: 138, cap: 1500 },
  { id: 7,  name: 'Laredo',          lng: -99.49,  lat: 27.55, kv: 138, cap: 850  },
  { id: 8,  name: 'El Paso',         lng: -106.44, lat: 31.76, kv: 138, cap: 1300 },
  { id: 9,  name: 'Lubbock',         lng: -101.85, lat: 33.57, kv: 138, cap: 1700 },
  { id: 10, name: 'Amarillo',        lng: -101.83, lat: 35.22, kv: 138, cap: 1200 },
  { id: 11, name: 'Waco',            lng: -97.13,  lat: 31.55, kv: 138, cap: 1900 },
  { id: 12, name: 'Tyler',           lng: -95.30,  lat: 32.35, kv: 138, cap: 1300 },
  { id: 13, name: 'Midland',         lng: -102.08, lat: 31.99, kv: 138, cap: 1400 },
  { id: 14, name: 'Abilene',         lng: -99.73,  lat: 32.45, kv: 138, cap: 1150 },
  { id: 15, name: 'McAllen',         lng: -98.23,  lat: 26.20, kv: 138, cap: 1600 },
  { id: 16, name: 'Killeen',         lng: -97.73,  lat: 31.12, kv: 69,  cap: 950  },
  { id: 17, name: 'Texarkana',       lng: -94.05,  lat: 33.43, kv: 69,  cap: 750  },
  { id: 18, name: 'Galveston',       lng: -94.80,  lat: 29.30, kv: 138, cap: 1100 },
  { id: 19, name: 'Odessa',          lng: -102.37, lat: 31.85, kv: 138, cap: 1450 },
];

export const TRANSMISSION_LINES = [
  [0, 1], [0, 2], [0, 18], [1, 12], [1, 17], [2, 3], [2, 11], [2, 16],
  [3, 6], [3, 7], [3, 15], [4, 5], [4, 12], [4, 17], [5, 11], [5, 14],
  [6, 15], [7, 8], [8, 13], [9, 10], [9, 13], [9, 14], [10, 4],
  [11, 12], [11, 16], [13, 19], [14, 9], [2, 4], [0, 4], [18, 1], [7, 15], [8, 19],
];

export const TOTAL_GRID_CAP = SUBSTATIONS.reduce((s, n) => s + n.cap, 0);

// Seeded pseudo-random for deterministic city layouts
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Austin-specific starter skyline: dense downtown cluster, river band, suburbs ring
function generateAustinLayout(worldSize, citySeed) {
  const rand = seededRandom(citySeed);
  const buildings = [];
  const downtown = CITIES.austin.downtown;
  const riverZ = CITIES.austin.riverZ;

  for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
      // Keep a clear river corridor (Lady Bird Lake)
      if (Math.abs(z - riverZ) <= 1) continue;

      const dx = x - downtown.x;
      const dz = z - downtown.z;
      const dDowntown = Math.hypot(dx, dz);

      const r = rand();
      const h = rand();

      // Downtown: tall commercial towers
      if (dDowntown < 4 && z < riverZ - 1) {
        if (r < 0.65) buildings.push({ x, z, type: 'commercial', height: 1.8 + h * 3.2 });
        continue;
      }

      // South Congress / close-in mixed area (south of river)
      if (dDowntown < 7 && z > riverZ + 1) {
        if (r < 0.25) buildings.push({ x, z, type: 'commercial', height: 0.7 + h * 1.2 });
        else if (r < 0.55) buildings.push({ x, z, type: 'residential', height: 0.45 + h * 0.8 });
        continue;
      }

      // Near-downtown neighborhoods: midrise residential + some commercial
      if (dDowntown < 10) {
        if (r < 0.16) buildings.push({ x, z, type: 'commercial', height: 0.6 + h * 1.0 });
        else if (r < 0.45) buildings.push({ x, z, type: 'residential', height: 0.35 + h * 0.7 });
        continue;
      }

      // Suburbs: sparse low residential
      if (dDowntown < 16) {
        if (r < 0.14) buildings.push({ x, z, type: 'residential', height: 0.22 + h * 0.35 });
      }
    }
  }

  return buildings;
}

const CITY_SEEDS = { austin: 42 };
const cityLayouts = {};
export function getCityLayout(cityId) {
  if (!cityLayouts[cityId]) {
    const city = CITIES[cityId];
    if (!city) return [];
    if (cityId === 'austin') {
      cityLayouts[cityId] = generateAustinLayout(city.worldSize, CITY_SEEDS[cityId] || 1);
    } else {
      cityLayouts[cityId] = [];
    }
  }
  return cityLayouts[cityId];
}
