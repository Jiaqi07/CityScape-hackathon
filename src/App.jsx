import { useState, useMemo, useCallback, useEffect } from 'react';
import { BUILDING_TYPES, calcBuildingEffect, calcCityStats, calcPlacementCostM } from './data/buildings';
import { useErcotLive } from './hooks/useLiveGrid';
import { CITIES } from './data/gridNodes';
import CityScene from './components/CityScene';
import HUD from './components/HUD';
import BuildToolbar from './components/BuildToolbar';
import BuildingInfo from './components/BuildingInfo';
import LoadingScreen from './components/LoadingScreen';
import MapZoomTransition from './components/MapZoomTransition';
import AIChatBox from './components/AIChatBox';
import loadingVideo from './loading screen.mp4';

export default function App() {
  const { data: ercotData, fuelMix, status, lastUpdate } = useErcotLive(10000);
  const activeCity = 'austin';
  const city = CITIES[activeCity];
  const chunkSize = city?.chunkSize || 8;
  const [placedBuildings, setPlacedBuildings] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [unlockedChunks, setUnlockedChunks] = useState(city?.initialChunks || [[2, 2], [3, 2], [2, 3], [3, 3]]);
  const [totalSpentM, setTotalSpentM] = useState(0);
  const [expandSpentM, setExpandSpentM] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [showMapZoom, setShowMapZoom] = useState(false);
  const [mapZoomDone, setMapZoomDone] = useState(false);
  const [isDaytime, setIsDaytime] = useState(false);

  const cityBuildings = placedBuildings;

  const gridDelta = useMemo(() => {
    let netMw = 0;
    let genMw = 0;
    let loadMw = 0;
    const byType = { wind: 0, solar: 0, nuclear: 0, battery: 0 };
    cityBuildings.forEach(b => {
      const { netMw: n, effectiveMw } = calcBuildingEffect(b);
      netMw += n;
      const spec = BUILDING_TYPES[b.type];
      if (spec?.type === 'generation') {
        genMw += effectiveMw;
        if (b.type === 'wind') byType.wind += effectiveMw;
        else if (b.type === 'solar') byType.solar += effectiveMw;
        else if (b.type === 'nuclear') byType.nuclear += effectiveMw;
      }
      if (spec?.type === 'storage' && b.type === 'battery') byType.battery += effectiveMw;
      if (spec?.type === 'load') loadMw += effectiveMw;
    });
    const totalGen = byType.wind + byType.solar + byType.nuclear + byType.battery;
    const myMix = totalGen > 0
      ? {
          wind: { mw: Math.round(byType.wind), pct: (byType.wind / totalGen) * 100 },
          solar: { mw: Math.round(byType.solar), pct: (byType.solar / totalGen) * 100 },
          nuclear: { mw: Math.round(byType.nuclear), pct: (byType.nuclear / totalGen) * 100 },
          battery: { mw: Math.round(byType.battery), pct: (byType.battery / totalGen) * 100 },
          total: totalGen,
        }
      : null;
    return { netMw, genMw, loadMw, myMix };
  }, [cityBuildings]);

  const cityStats = useMemo(() => calcCityStats(cityBuildings), [cityBuildings]);

  const austinScore = useMemo(() => {
    const jobs = cityStats.jobs || 0;
    const pop = cityStats.population || 0;
    const housing = cityStats.housingUnits || 0;
    const jobCoverage = pop > 0 ? Math.min(1, jobs / pop) : 0.7;
    const housingCoverage = pop > 0 ? Math.min(1, housing / (pop / 2.2)) : 0.7;
    const powerOk = gridDelta.netMw > -150 ? 1 : 0.6;
    const happy = cityStats.happiness ?? 0.6;
    return Math.round(100 * (0.35 * happy + 0.25 * jobCoverage + 0.2 * housingCoverage + 0.2 * powerOk));
  }, [cityStats, gridDelta.netMw]);

  const gameContext = useMemo(() => ({
    city: activeCity,
    austinScore,
    budget: { cashM: totalSpentM, expandSpentM },
    buildings: {
      count: cityBuildings.length,
      breakdown: cityBuildings.reduce((acc, b) => { acc[b.type] = (acc[b.type] || 0) + 1; return acc; }, {}),
    },
    grid: {
      netMw: Math.round(gridDelta.netMw),
      generationMw: Math.round(gridDelta.genMw),
      loadMw: Math.round(gridDelta.loadMw),
    },
    cityStats: {
      population: cityStats.population,
      jobs: cityStats.jobs,
      housingUnits: cityStats.housingUnits,
      happiness: Math.round((cityStats.happiness ?? 0.6) * 100),
      netPerDay: cityStats.netPerDay,
    },
    ercot: ercotData ? {
      demand: ercotData.demand,
      frequency: ercotData.frequency,
      wind: ercotData.windOutput,
      solar: ercotData.solarOutput,
    } : null,
    fuelMix: fuelMix ? {
      wind: fuelMix.wind?.pct,
      solar: fuelMix.solar?.pct,
      nuclear: fuelMix.nuclear?.pct,
      gas: fuelMix.gas?.pct,
    } : null,
    unlockedChunks: unlockedChunks.length,
  }), [activeCity, austinScore, totalSpentM, expandSpentM, cityBuildings, gridDelta, cityStats, ercotData, fuelMix, unlockedChunks]);

  useEffect(() => {
    if (sceneReady && !loadingDone) {
      setLoadingDone(true);
    }
  }, [sceneReady, loadingDone]);

  const handleLoadingDone = useCallback(() => {
    setShowMapZoom(true);
  }, []);

  const handleMapZoomComplete = useCallback(() => {
    setMapZoomDone(true);
    setShowMapZoom(false);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setActiveTool(null); setSelectedBuilding(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handlePlaceBuilding = useCallback((type, gridX, gridZ) => {
    const cost = calcPlacementCostM(type);
    setTotalSpentM(v => +(v + cost).toFixed(2));
    setPlacedBuildings(prev => [...prev, { type, gridX, gridZ }]);
  }, []);

  const EXPAND_COST_M = 75;
  const handleUnlockChunk = useCallback((cx, cz) => {
    const key = `${cx},${cz}`;
    const set = new Set(unlockedChunks.map(([x, z]) => `${x},${z}`));
    if (set.has(key)) return;
    setExpandSpentM(v => +(v + EXPAND_COST_M).toFixed(2));
    setUnlockedChunks(prev => [...prev, [cx, cz]]);
  }, [unlockedChunks]);

  const handleRemoveBuilding = useCallback((index) => {
    setPlacedBuildings(prev => prev.filter((_, i) => i !== index));
    setSelectedBuilding(null);
  }, []);

  const handleUndo = useCallback(() => {
    setPlacedBuildings(prev => prev.slice(0, -1));
    setSelectedBuilding(null);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <LoadingScreen videoSrc={loadingVideo} show={!sceneReady} onDone={handleLoadingDone} />
      <MapZoomTransition show={showMapZoom} onComplete={handleMapZoomComplete} />

      <CityScene
        activeCity={activeCity}
        activeTool={activeTool}
        placedBuildings={cityBuildings}
        selectedBuilding={selectedBuilding}
        ercotData={ercotData}
        onPlaceBuilding={handlePlaceBuilding}
        unlockedChunks={unlockedChunks}
        chunkSize={chunkSize}
        onUnlockChunk={handleUnlockChunk}
        onSelectBuilding={setSelectedBuilding}
        onDeselectBuilding={() => setSelectedBuilding(null)}
        onReady={() => setSceneReady(true)}
        animateIn={mapZoomDone}
        isDaytime={isDaytime}
      />

      <div
        className="transition-opacity duration-1000"
        style={{ opacity: mapZoomDone ? 1 : 0, pointerEvents: mapZoomDone ? 'auto' : 'none' }}
      >
        <HUD
          ercotData={ercotData}
          fuelMix={fuelMix}
          status={status}
          lastUpdate={lastUpdate}
          placedBuildings={cityBuildings}
          gridDelta={gridDelta}
          activeCity={activeCity}
          totalSpentM={totalSpentM}
          expandCostM={EXPAND_COST_M}
          expandSpentM={expandSpentM}
          unlockedChunks={unlockedChunks}
          chunkSize={chunkSize}
          cityStats={cityStats}
          austinScore={austinScore}
        />

        <BuildToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onUndo={handleUndo}
          buildCount={cityBuildings.length}
          totalSpentM={totalSpentM}
        />

        {selectedBuilding !== null && cityBuildings[selectedBuilding] && (
          <BuildingInfo
            building={cityBuildings[selectedBuilding]}
            index={selectedBuilding}
            onRemove={handleRemoveBuilding}
            onClose={() => setSelectedBuilding(null)}
          />
        )}

        {/* Active tool indicator */}
        {activeTool && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none select-none">
            <div className="bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)] rounded-lg px-4 py-2 opacity-60">
              <div className="font-mono text-[10px] text-[var(--text)] tracking-[1px] flex items-center gap-2">
                <span className="text-lg">{activeTool === 'expand' ? '🧱' : BUILDING_TYPES[activeTool]?.icon}</span>
                {activeTool === 'expand'
                  ? 'Click adjacent locked area to unlock'
                  : `Click grid to place ${BUILDING_TYPES[activeTool]?.name} ($${calcPlacementCostM(activeTool).toFixed(0)}M)`
                }
              </div>
            </div>
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute bottom-20 right-3 z-20 pointer-events-none select-none">
          <div className="font-mono text-[7px] text-[var(--dim)] opacity-30 text-right space-y-0.5">
            <div>ORBIT: drag</div>
            <div>ZOOM: scroll</div>
            <div>ESC: cancel</div>
          </div>
        </div>

        {/* Day/Night Toggle */}
        <button
          onClick={() => setIsDaytime(v => !v)}
          className="absolute bottom-3 left-3 z-30 group"
          style={{ width: 48, height: 48 }}
          aria-label="Toggle day/night"
        >
          <div className="relative w-full h-full flex items-center justify-center bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)] rounded-full hover:border-[rgba(0,212,255,0.4)] transition-all duration-300 hover:scale-110 shadow-lg">
            <span className="text-2xl transition-transform duration-500" style={{ transform: isDaytime ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              {isDaytime ? '☀️' : '🌙'}
            </span>
          </div>
        </button>

        {/* Scan line effect */}
        <div className="absolute top-0 left-0 right-0 h-px z-20 pointer-events-none"
             style={{
               background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
               animation: 'scan-line 8s ease-in-out infinite',
             }} />

        <AIChatBox gameContext={gameContext} />
      </div>
    </div>
  );
}
