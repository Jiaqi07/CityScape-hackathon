import { BUILDING_TYPES, calcBuildingEffect } from '../data/buildings';

export default function BuildingInfo({ building, index, onRemove, onClose }) {
  if (!building) return null;
  const spec = BUILDING_TYPES[building.type];
  if (!spec) return null;

  const { netMw, effectiveMw } = calcBuildingEffect(building);
  const isGen = spec.type === 'generation';
  const isLoad = spec.type === 'load';

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 animate-fade-up pointer-events-auto select-none">
      <div className="bg-[var(--panel)] backdrop-blur-xl border rounded-lg px-4 py-3 min-w-[300px]"
           style={{ borderColor: spec.color + '40' }}>
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
                 style={{ background: spec.color + '15', border: `1px solid ${spec.color}30` }}>
              {spec.icon}
            </div>
            <div>
              <div className="font-display text-[13px] font-semibold" style={{ color: spec.color }}>{spec.name}</div>
              <div className="font-mono text-[8px] text-[var(--dim)]">{spec.description}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--dim)] hover:text-[var(--text)] text-sm ml-4 w-6 h-6 flex items-center justify-center rounded hover:bg-[rgba(255,255,255,0.05)]">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <Stat label="CAPACITY" value={`${spec.mw}`} unit="MW" color={spec.color} />
          <Stat label="EFFECTIVE" value={`${Math.round(effectiveMw)}`} unit="MW"
                color={isGen ? '#00ff88' : isLoad ? '#ff6b6b' : '#a855f7'} />
          <Stat label="CF" value={`${(spec.capacityFactor * 100).toFixed(0)}`} unit="%" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <Stat label="COST" value={`$${(spec.costPerMw * spec.mw).toFixed(0)}`} unit="M" />
          <Stat label="LAND" value={`${spec.landAcresPerMw * spec.mw}`} unit="ac" />
          <Stat label="GRID POS" value={`${building.gridX},${building.gridZ}`} unit="" />
        </div>

        {isGen && spec.carbonOffset && (
          <div className="font-mono text-[8px] text-[#00ff88] mb-2 opacity-70 flex items-center gap-1">
            <span>🌱</span>
            Offsets ~{Math.round(spec.carbonOffset * effectiveMw / 1000)}k tons CO₂/yr
          </div>
        )}

        <button onClick={() => onRemove(index)}
                className="w-full py-2 rounded-lg border border-[rgba(255,51,85,0.2)] bg-[rgba(255,51,85,0.05)] text-[#ff6b6b] font-mono text-[9px] tracking-[1px] hover:bg-[rgba(255,51,85,0.12)] transition-colors font-medium">
          REMOVE BUILDING
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, color }) {
  return (
    <div className="bg-[rgba(0,0,0,0.25)] rounded-md px-2 py-1.5">
      <div className="flex items-baseline gap-0.5">
        <span className="font-mono text-[14px] font-bold tabular-nums" style={{ color: color || 'var(--text)' }}>{value}</span>
        <span className="font-mono text-[7px] text-[var(--dim)]">{unit}</span>
      </div>
      <div className="font-mono text-[6px] text-[var(--dim)] tracking-[1px] mt-0.5 opacity-50">{label}</div>
    </div>
  );
}
