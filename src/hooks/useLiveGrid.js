import { useState, useEffect, useCallback } from 'react';

// Parse ERCOT real-time system conditions HTML page
// Proxied through Vite dev server to bypass CORS
function parseErcotHtml(html) {
  const get = (label) => {
    const re = new RegExp(label + '\\s*</td>\\s*<td[^>]*>\\s*([\\d.,\\-]+)', 'i');
    const m = html.match(re);
    return m ? parseFloat(m[1].replace(/,/g, '')) : null;
  };

  return {
    frequency:    get('Current Frequency'),
    demand:       get('Actual System Demand'),
    netLoad:      get('Average Net Load'),
    capacity:     get('Total System Capacity'),
    windOutput:   get('Total Wind Output'),
    solarOutput:  get('Total PVGR Output'),
    inertia:      get('Current System Inertia'),
    dcEast:       get('DC_E \\(East\\)'),
    dcLaredo:     get('DC_L \\(Laredo VFT\\)'),
    dcNorth:      get('DC_N \\(North\\)'),
    dcRailroad:   get('DC_R \\(Railroad\\)'),
    dcEaglePass:  get('DC_S \\(Eagle Pass\\)'),
  };
}

// Derive fuel mix from ERCOT actuals
function deriveFuelMix(data) {
  if (!data.demand) return null;
  const wind = data.windOutput || 0;
  const solar = data.solarOutput || 0;
  const nuclear = 5200; // STP 1&2 + Comanche Peak 1&2 — ~5.2 GW nameplate, ~93% CF
  const renewableAndNuclear = wind + solar + nuclear;
  const fossil = Math.max(0, data.demand - renewableAndNuclear);
  const total = data.demand;
  return {
    wind:    { mw: wind,    pct: (wind / total * 100) },
    solar:   { mw: solar,   pct: (solar / total * 100) },
    nuclear: { mw: nuclear, pct: (nuclear / total * 100) },
    gas:     { mw: fossil,  pct: (fossil / total * 100) },
    total:   total,
  };
}

export function useErcotLive(intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [fuelMix, setFuelMix] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/ercot-live/real_time_system_conditions.html', { cache: 'no-store' });
      const html = await res.text();
      const parsed = parseErcotHtml(html);
      if (parsed.demand) {
        setData({ ...parsed });
        setFuelMix(deriveFuelMix({ ...parsed }));
        setStatus('live');
        setLastUpdate(new Date());
      } else {
        setStatus('offline');
      }
    } catch (err) {
      console.warn('ERCOT fetch failed, check proxy config:', err);
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    const kickoff = setTimeout(fetchData, 0);
    const id = setInterval(fetchData, intervalMs);
    return () => {
      clearInterval(id);
      clearTimeout(kickoff);
    };
  }, [fetchData, intervalMs]);

  return { data, fuelMix, status, lastUpdate };
}

// Distribute system-wide demand across substations proportional to their capacity
export function distributeLoad(substations, totalDemandMw) {
  const totalCap = substations.reduce((s, n) => s + n.cap, 0);
  return substations.map(sub => ({
    ...sub,
    load: Math.round(totalDemandMw * (sub.cap / totalCap)),
    loadPct: totalDemandMw * (sub.cap / totalCap) / sub.cap,
  }));
}
