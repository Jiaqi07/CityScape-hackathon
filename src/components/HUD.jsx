import { CITIES, CITY_LIST } from '../data/gridNodes';

export default function HUD({
  ercotData,
  fuelMix,
  status,
  placedBuildings,
  gridDelta,
  activeCity,
  onCityChange,
}) {
  const d = ercotData;
  const isLive = status === 'live';
  const city = CITIES[activeCity];

  return (
    <>
      {/* Top-left: Logo + System vitals */}
      <div className="absolute top-3 left-3 z-30 pointer-events-none select-none">
        <div className="flex flex-col gap-1.5">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-0.5 pointer-events-auto">
            <div className="w-5 h-5 rounded-full border border-[var(--accent)] flex items-center justify-center animate-glow">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            </div>
            <span className="font-display text-[13px] font-bold tracking-[3px] text-[var(--accent)]">
              GRIDMIRROR
            </span>
            <span className={`font-mono text-[7px] tracking-[1px] px-1.5 py-0.5 rounded-sm border ${
              isLive
                ? 'text-[var(--accent2)] border-[rgba(0,255,136,0.2)] bg-[rgba(0,255,136,0.05)]'
                : 'text-[var(--dim)] border-[var(--border)]'
            }`}>
              {isLive ? 'LIVE' : status === 'connecting' ? '...' : 'OFFLINE'}
            </span>
          </div>

          {/* City selector */}
          <div className="flex gap-1 pointer-events-auto">
            {CITY_LIST.map(c => (
              <button
                key={c.id}
                onClick={() => onCityChange(c.id)}
                className={`px-2.5 py-1 rounded-md font-mono text-[9px] tracking-[1px] border transition-all duration-200 ${
                  activeCity === c.id
                    ? 'border-opacity-60 bg-opacity-10'
                    : 'border-[var(--border)] bg-transparent text-[var(--dim)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.1)]'
                }`}
                style={activeCity === c.id ? {
                  borderColor: c.color + '60',
                  backgroundColor: c.color + '10',
                  color: c.color,
                } : {}}
              >
                {c.name.split('-')[0].trim().toUpperCase()}
              </button>
            ))}
          </div>

          {/* ERCOT Data panel */}
          {d && (
            <div className="bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)] rounded-lg px-3 py-2.5 animate-fade-up"
                 style={{ minWidth: 200 }}>
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px] block mb-2">
                ERCOT SYSTEM — REAL TIME
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <V label="DEMAND" value={fmt(d.demand)} unit="MW" />
                <V label="CAPACITY" value={fmt(d.capacity)} unit="MW" />
                <V label="WIND" value={fmt(d.windOutput)} unit="MW" color="#00d4ff" />
                <V label="SOLAR" value={fmt(d.solarOutput)} unit="MW" color="#ffe043" />
                <V label="FREQ" value={d.frequency?.toFixed(3)} unit="Hz" accent />
                <V label="NET LOAD" value={fmt(d.netLoad)} unit="MW" />
              </div>

              {/* City-specific load estimate */}
              {city && d.demand && (
                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: city.color }} />
                    <span className="font-mono text-[7px] tracking-[1px]" style={{ color: city.color }}>
                      {city.name.toUpperCase()} LOAD
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[16px] font-bold" style={{ color: city.color }}>
                      {fmt(Math.round(d.demand * (city.cap / 40000)))}
                    </span>
                    <span className="font-mono text-[7px] text-[var(--dim)]">MW est.</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (d.demand / 70000) * (city.cap / 5500) * 100)}%`,
                        background: `linear-gradient(90deg, ${city.color}, ${city.color}80)`,
                      }}
                    />
                  </div>
                </div>
              )}

              {gridDelta.netMw !== 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <V label="YOUR DELTA"
                     value={(gridDelta.netMw > 0 ? '+' : '') + fmt(Math.round(gridDelta.netMw))}
                     unit="MW"
                     color={gridDelta.netMw > 0 ? '#00ff88' : '#ff6b6b'} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top-right: Fuel mix */}
      {fuelMix && (
        <div className="absolute top-3 right-3 z-30 pointer-events-none select-none">
          <div className="bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)] rounded-lg px-3 py-2.5 animate-fade-up"
               style={{ minWidth: 160 }}>
            <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px] block mb-2">GENERATION MIX</span>

            {/* Stacked bar */}
            <div className="flex h-2 rounded-full overflow-hidden gap-px mb-2">
              <div style={{ width: `${fuelMix.wind.pct}%`, background: '#00d4ff' }} className="rounded-full transition-all duration-1000" />
              <div style={{ width: `${fuelMix.solar.pct}%`, background: '#ffe043' }} className="rounded-full transition-all duration-1000" />
              <div style={{ width: `${fuelMix.nuclear.pct}%`, background: '#a855f7' }} className="rounded-full transition-all duration-1000" />
              <div style={{ width: `${fuelMix.gas.pct}%`, background: '#ff8c42' }} className="rounded-full transition-all duration-1000" />
            </div>

            <div className="space-y-1">
              <MixRow label="Wind" mw={fuelMix.wind.mw} pct={fuelMix.wind.pct} color="#00d4ff" />
              <MixRow label="Solar" mw={fuelMix.solar.mw} pct={fuelMix.solar.pct} color="#ffe043" />
              <MixRow label="Nuclear" mw={fuelMix.nuclear.mw} pct={fuelMix.nuclear.pct} color="#a855f7" />
              <MixRow label="Gas/Other" mw={fuelMix.gas.mw} pct={fuelMix.gas.pct} color="#ff8c42" />
            </div>

            {/* Renewable percentage */}
            <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-baseline gap-1.5">
              <span className="font-mono text-[16px] font-bold text-[var(--accent2)]">
                {(fuelMix.wind.pct + fuelMix.solar.pct).toFixed(0)}%
              </span>
              <span className="font-mono text-[7px] text-[var(--dim)]">RENEWABLE</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-left: Your grid stats */}
      {placedBuildings.length > 0 && (
        <div className="absolute bottom-20 left-3 z-30 pointer-events-none select-none">
          <div className="bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)] rounded-lg px-3 py-2.5 animate-fade-up">
            <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px] block mb-1.5">YOUR GRID</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[22px] font-bold text-[var(--accent)]">{placedBuildings.length}</span>
              <span className="font-mono text-[8px] text-[var(--dim)]">buildings</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-[14px] font-bold"
                    style={{ color: gridDelta.netMw >= 0 ? '#00ff88' : '#ff6b6b' }}>
                {gridDelta.netMw >= 0 ? '+' : ''}{Math.round(gridDelta.netMw)}
              </span>
              <span className="font-mono text-[7px] text-[var(--dim)]">MW net</span>
            </div>
            {gridDelta.genMw > 0 && (
              <div className="mt-1 font-mono text-[8px] text-[var(--dim)]">
                <span className="text-[#00ff88]">+{Math.round(gridDelta.genMw)}</span> gen
                {gridDelta.loadMw > 0 && (
                  <> · <span className="text-[#ff6b6b]">-{Math.round(gridDelta.loadMw)}</span> load</>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function V({ label, value, unit, color, accent }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`font-mono text-[13px] font-semibold leading-none ${accent ? 'tabular-nums' : ''}`}
            style={{ color: color || 'var(--text)' }}>
        {value ?? '—'}
      </span>
      <span className="font-mono text-[7px] text-[var(--dim)] tracking-[0.5px]">{unit}</span>
      <span className="font-mono text-[6px] text-[var(--dim)] tracking-[1px] ml-auto opacity-50">{label}</span>
    </div>
  );
}

function MixRow({ label, mw, pct, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
      <span className="font-mono text-[8px] text-[var(--dim)]">{label}</span>
      <span className="font-mono text-[8px] ml-auto tabular-nums" style={{ color }}>
        {pct.toFixed(0)}%
      </span>
      <span className="font-mono text-[7px] text-[var(--dim)] tabular-nums w-12 text-right">
        {fmt(Math.round(mw))}
      </span>
    </div>
  );
}

function fmt(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
