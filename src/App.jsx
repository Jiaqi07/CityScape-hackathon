import { useState, useMemo, useCallback, useEffect } from 'react';
import { BUILDING_TYPES, calcBuildingEffect } from './data/buildings';
import { useErcotLive } from './hooks/useLiveGrid';
import CityScene from './components/CityScene';
import HUD from './components/HUD';
import BuildToolbar from './components/BuildToolbar';
import BuildingInfo from './components/BuildingInfo';

export default function App() {
  const { data: ercotData, fuelMix, status } = useErcotLive(30000);
  const [activeCity, setActiveCity] = useState('austin');
  const [placedBuildings, setPlacedBuildings] = useState({});
  const [activeTool, setActiveTool] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const cityBuildings = useMemo(() => placedBuildings[activeCity] || [], [placedBuildings, activeCity]);

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

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setActiveTool(null); setSelectedBuilding(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Reset selection when switching cities
  useEffect(() => {
    setSelectedBuilding(null);
    setActiveTool(null);
  }, [activeCity]);

  const handlePlaceBuilding = useCallback((type, gridX, gridZ) => {
    setPlacedBuildings(prev => ({
      ...prev,
      [activeCity]: [...(prev[activeCity] || []), { type, gridX, gridZ }],
    }));
  }, [activeCity]);

  const handleRemoveBuilding = useCallback((index) => {
    setPlacedBuildings(prev => ({
      ...prev,
      [activeCity]: (prev[activeCity] || []).filter((_, i) => i !== index),
    }));
    setSelectedBuilding(null);
  }, [activeCity]);

  const handleUndo = useCallback(() => {
    setPlacedBuildings(prev => ({
      ...prev,
      [activeCity]: (prev[activeCity] || []).slice(0, -1),
    }));
    setSelectedBuilding(null);
  }, [activeCity]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <CityScene
        activeCity={activeCity}
        activeTool={activeTool}
        placedBuildings={cityBuildings}
        selectedBuilding={selectedBuilding}
        ercotData={ercotData}
        onPlaceBuilding={handlePlaceBuilding}
        onSelectBuilding={setSelectedBuilding}
        onDeselectBuilding={() => setSelectedBuilding(null)}
      />

      <HUD
        ercotData={ercotData}
        fuelMix={fuelMix}
        status={status}
        placedBuildings={cityBuildings}
        gridDelta={gridDelta}
        activeCity={activeCity}
        onCityChange={setActiveCity}
      />

      <BuildToolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onUndo={handleUndo}
        buildCount={cityBuildings.length}
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
              <span className="text-lg">{BUILDING_TYPES[activeTool]?.icon}</span>
              Click grid to place {BUILDING_TYPES[activeTool]?.name}
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
