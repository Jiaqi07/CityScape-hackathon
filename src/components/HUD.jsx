import { CITIES } from '../data/gridNodes';
import { useMemo, useState } from 'react';

export default function HUD({
  ercotData,
  fuelMix,
  status,
  lastUpdate,
  placedBuildings,
  gridDelta,
  activeCity,
  cashM,
  expandCostM,
  expandSpentM,
  unlockedChunks,
  chunkSize,
  cityStats,
  austinScore,
}) {
  const d = ercotData;
  const isLive = status === 'live';
  const unlockedCount = (unlockedChunks?.length || 0) * (chunkSize || 8) * (chunkSize || 8);
  const lastUpdateLabel = useMemo(() => {
    if (!lastUpdate) return '—';
    try {
      return new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '—';
    }
  }, [lastUpdate]);

  const cardClass =
    'bg-[rgba(8,16,32,0.72)] backdrop-blur-2xl border border-[rgba(255,255,255,0.10)] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)]';

  return (
    <>
      {/* Top-left: Logo + System vitals */}
      <div className="absolute top-3 left-3 z-30 pointer-events-none select-none">
        <div className="flex flex-col gap-1.5">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-0.5 pointer-events-auto">
            <img
              src="/citybuilder.png"
              alt="CityScape"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display text-[13px] font-bold tracking-[3px] text-[var(--accent)]">
              CityScape
            </span>
            <span className={`font-mono text-[7px] tracking-[1px] px-1.5 py-0.5 rounded-sm border ${
              isLive
                ? 'text-[var(--accent2)] border-[rgba(0,255,136,0.2)] bg-[rgba(0,255,136,0.05)]'
                : 'text-[var(--dim)] border-[rgba(255,255,255,0.10)]'
            }`}>
              {isLive ? 'LIVE' : status === 'connecting' ? '...' : 'OFFLINE'}
            </span>
          </div>

          {/* Expand cost counter (side card) */}
          <div className={`pointer-events-auto ${cardClass} px-3 py-2 animate-fade-up`} style={{ minWidth: 220 }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px]">EXPANSION COST</span>
              <span className="font-mono text-[9px] font-bold text-[var(--accent)] tabular-nums">
                ${fmtMoney(expandSpentM ?? 0)}M
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-[7px] text-[var(--dim)] opacity-70">Per expand</span>
              <span className="font-mono text-[8px] text-[var(--text)] tabular-nums">${fmtMoney(expandCostM ?? 0)}M</span>
            </div>
          </div>


          {/* City builder panel */}
          <CollapsiblePanel
            title="AUSTIN DASHBOARD"
            right={<span className="font-mono text-[9px] font-bold text-[var(--accent2)] tabular-nums">{austinScore ?? 0}</span>}
            minWidth={220}
            cardClass={cardClass}
            storageKey="hud:dashboard"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <V label="BUDGET" value={`$${fmtMoney(cashM)}`} unit="M" color="#c0d4e8" />
              <V label="DAILY NET" value={`${(cityStats?.netPerDay ?? 0) >= 0 ? '+' : ''}${fmtMoney(cityStats?.netPerDay ?? 0)}`} unit="M" color={(cityStats?.netPerDay ?? 0) >= 0 ? '#00ff88' : '#ff6b6b'} />
              <V label="POP" value={fmt(cityStats?.population ?? 0)} unit="" />
              <V label="JOBS" value={fmt(cityStats?.jobs ?? 0)} unit="" />
              <V label="HOUSING" value={fmt(cityStats?.housingUnits ?? 0)} unit="u" />
              <V label="HAPPY" value={`${Math.round((cityStats?.happiness ?? 0.6) * 100)}`} unit="%" color="#34d399" />
            </div>
            <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.10)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px]">UNLOCKED AREA</span>
                <span className="font-mono text-[8px] text-[var(--text)] tabular-nums">{fmt(unlockedCount)} tiles</span>
              </div>
            </div>
          </CollapsiblePanel>

          {/* ERCOT / power panel */}
          {d && (
            <CollapsiblePanel
              title="ERCOT + YOUR CITY POWER"
              right={<span className="font-mono text-[7px] text-[var(--dim)] tracking-[1px] opacity-70">UPDATED {lastUpdateLabel}</span>}
              minWidth={220}
              cardClass={cardClass}
              storageKey="hud:ercot"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <V label="ERCOT DEMAND" value={fmt(d.demand)} unit="MW" />
                <V label="FREQ" value={d.frequency?.toFixed(3)} unit="Hz" accent />
                <V label="WIND" value={fmt(d.windOutput)} unit="MW" color="#00d4ff" />
                <V label="SOLAR" value={fmt(d.solarOutput)} unit="MW" color="#ffe043" />
              </div>
              <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.10)]">
                <V
                  label="YOUR MW DELTA"
                  value={(gridDelta.netMw > 0 ? '+' : '') + fmt(Math.round(gridDelta.netMw))}
                  unit="MW"
                  color={gridDelta.netMw > 0 ? '#00ff88' : '#ff6b6b'}
                />
              </div>
            </CollapsiblePanel>
          )}
        </div>
      </div>

      {/* Top-right: Fuel mix */}
      {fuelMix && (
        <div className="absolute top-3 right-3 z-30 pointer-events-none select-none">
          <div className={`pointer-events-auto ${cardClass} px-3 py-2.5 animate-fade-up`} style={{ minWidth: 180 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px]">GENERATION MIX</span>
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[1px] opacity-70">
                {isLive ? `LIVE · ${lastUpdateLabel}` : status.toUpperCase()}
              </span>
            </div>

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
            <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.10)] flex items-baseline gap-1.5">
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
          <div className={`pointer-events-auto ${cardClass} px-3 py-2.5 animate-fade-up`}>
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

function CollapsiblePanel({ title, right, children, minWidth, cardClass, storageKey }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      if (!storageKey) return false;
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setCollapsed(v => {
      const next = !v;
      try {
        if (storageKey) localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className={`pointer-events-auto ${cardClass} px-3 py-2.5 animate-fade-up`} style={{ minWidth }}>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2"
      >
        <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px]">{title}</span>
        <span className="flex items-center gap-2">
          {right}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[var(--dim)] opacity-70 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {!collapsed && <div className="mt-2">{children}</div>}
    </div>
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

function fmtMoney(n) {
  if (n == null) return '—';
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
