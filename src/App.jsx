import { useState, useMemo, useCallback, useEffect } from 'react';
import { BUILDING_TYPES, calcBuildingEffect, calcCityStats, calcPlacementCostM } from './data/buildings';
import { useErcotLive } from './hooks/useLiveGrid';
import { CITIES } from './data/gridNodes';
import CityScene from './components/CityScene';
import HUD from './components/HUD';
import BuildToolbar from './components/BuildToolbar';
import BuildingInfo from './components/BuildingInfo';
import LoadingScreen from './components/LoadingScreen';
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
  const [cashM, setCashM] = useState(650); // $M starting budget
  const [expandSpentM, setExpandSpentM] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);

  const cityBuildings = placedBuildings;

  const gridDelta = useMemo(() => {
    let netMw = 0;
    let genMw = 0;
    let loadMw = 0;
    cityBuildings.forEach(b => {
      const { netMw: n, effectiveMw } = calcBuildingEffect(b);
      netMw += n;
      const spec = BUILDING_TYPES[b.type];
      if (spec?.type === 'generation') genMw += effectiveMw;
      if (spec?.type === 'load') loadMw += effectiveMw;
    });
    return { netMw, genMw, loadMw };
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

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setActiveTool(null); setSelectedBuilding(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handlePlaceBuilding = useCallback((type, gridX, gridZ) => {
    const cost = calcPlacementCostM(type);
    if (cost > cashM) return;
    setCashM(v => Math.max(0, +(v - cost).toFixed(2)));
    setPlacedBuildings(prev => [...prev, { type, gridX, gridZ }]);
  }, [cashM]);

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
      <LoadingScreen videoSrc={loadingVideo} show={!sceneReady} />

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
      />

      <HUD
        ercotData={ercotData}
        fuelMix={fuelMix}
        status={status}
        lastUpdate={lastUpdate}
        placedBuildings={cityBuildings}
        gridDelta={gridDelta}
        activeCity={activeCity}
        cashM={cashM}
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
        cashM={cashM}
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

      {/* Scan line effect */}
      <div className="absolute top-0 left-0 right-0 h-px z-20 pointer-events-none"
           style={{
             background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
             animation: 'scan-line 8s ease-in-out infinite',
           }} />
    </div>
  );
}
