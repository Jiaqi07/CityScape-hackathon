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
  totalSpentM,
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
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.25)] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]" aria-hidden>
                <path d="M3 21h18v-2H3v2zM4 18h3v-8H4v8zm5 0h3V9H9v9zm5 0h3V5h-3v13zm5 0h3v-6h-3v6z" fill="currentColor"/>
              </svg>
            </div>
            <span className="font-display text-[13px] font-bold tracking-[3px] text-[var(--accent)]">
              CityScape
            </span>
          </div>

          {/* Expansion: total spent (accumulates per unlock) */}
          <div className={`pointer-events-auto ${cardClass} px-3 py-2 animate-fade-up`} style={{ minWidth: 220 }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px]">TOTAL EXPANSION SPENT</span>
              <span className="font-mono text-[11px] font-bold text-[var(--accent)] tabular-nums">
                ${fmtMoney(expandSpentM ?? 0)}M
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-[7px] text-[var(--dim)] opacity-70">Per chunk</span>
              <span className="font-mono text-[8px] text-[var(--text)] tabular-nums">${fmtMoney(expandCostM ?? 0)}M</span>
              <span className="font-mono text-[7px] text-[var(--dim)] opacity-70">· {unlockedChunks?.length ?? 0} unlocked</span>
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
              <V label="TOTAL SPENT" value={`$${fmtMoney(totalSpentM)}`} unit="M" color="#c0d4e8" />
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

      {/* Top-right: ERCOT mix + Your city mix (updates when you add buildings) */}
      <div className="absolute top-3 right-3 z-30 pointer-events-none select-none flex flex-col gap-1.5 items-end">
        {fuelMix && (
          <div className={`pointer-events-auto ${cardClass} px-3 py-2.5 animate-fade-up`} style={{ minWidth: 200 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px]">ERCOT LIVE</span>
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[1px] opacity-70">
                {isLive ? `${lastUpdateLabel}` : status.toUpperCase()}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-px mb-2">
              <div style={{ width: `${fuelMix.wind.pct}%`, background: '#00d4ff' }} className="rounded-full transition-all duration-500" />
              <div style={{ width: `${fuelMix.solar.pct}%`, background: '#ffe043' }} className="rounded-full transition-all duration-500" />
              <div style={{ width: `${fuelMix.nuclear.pct}%`, background: '#a855f7' }} className="rounded-full transition-all duration-500" />
              <div style={{ width: `${fuelMix.gas.pct}%`, background: '#ff8c42' }} className="rounded-full transition-all duration-500" />
            </div>
            <div className="space-y-1">
              <MixRow label="Wind" mw={fuelMix.wind.mw} pct={fuelMix.wind.pct} color="#00d4ff" />
              <MixRow label="Solar" mw={fuelMix.solar.mw} pct={fuelMix.solar.pct} color="#ffe043" />
              <MixRow label="Nuclear" mw={fuelMix.nuclear.mw} pct={fuelMix.nuclear.pct} color="#a855f7" />
              <MixRow label="Gas/Other" mw={fuelMix.gas.mw} pct={fuelMix.gas.pct} color="#ff8c42" />
            </div>
            <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.10)] flex items-baseline gap-1.5">
              <span className="font-mono text-[14px] font-bold text-[var(--accent2)]">
                {(fuelMix.wind.pct + fuelMix.solar.pct).toFixed(0)}%
              </span>
              <span className="font-mono text-[7px] text-[var(--dim)]">RENEWABLE</span>
            </div>
          </div>
        )}

        {/* Your city generation mix — updates when you add/remove wind/solar/nuclear/battery */}
        {(gridDelta.myMix && gridDelta.myMix.total > 0) && (
          <div className={`pointer-events-auto ${cardClass} px-3 py-2.5 animate-fade-up`} style={{ minWidth: 200 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[7px] text-[var(--dim)] tracking-[2px]">YOUR CITY MIX</span>
              <span className="font-mono text-[8px] text-[var(--accent)] tabular-nums">{fmt(gridDelta.myMix.total)} MW</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-px mb-2">
              <div style={{ width: `${gridDelta.myMix.wind.pct}%`, background: '#00d4ff' }} className="rounded-full transition-all duration-300" />
              <div style={{ width: `${gridDelta.myMix.solar.pct}%`, background: '#ffe043' }} className="rounded-full transition-all duration-300" />
              <div style={{ width: `${gridDelta.myMix.nuclear.pct}%`, background: '#ff8c42' }} className="rounded-full transition-all duration-300" />
              <div style={{ width: `${gridDelta.myMix.battery.pct}%`, background: '#a855f7' }} className="rounded-full transition-all duration-300" />
            </div>
            <div className="space-y-1">
              {gridDelta.myMix.wind.mw > 0 && <MixRow label="Wind" mw={gridDelta.myMix.wind.mw} pct={gridDelta.myMix.wind.pct} color="#00d4ff" />}
              {gridDelta.myMix.solar.mw > 0 && <MixRow label="Solar" mw={gridDelta.myMix.solar.mw} pct={gridDelta.myMix.solar.pct} color="#ffe043" />}
              {gridDelta.myMix.nuclear.mw > 0 && <MixRow label="Nuclear" mw={gridDelta.myMix.nuclear.mw} pct={gridDelta.myMix.nuclear.pct} color="#ff8c42" />}
              {gridDelta.myMix.battery.mw > 0 && <MixRow label="Battery" mw={gridDelta.myMix.battery.mw} pct={gridDelta.myMix.battery.pct} color="#a855f7" />}
            </div>
            <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.10)] flex items-baseline gap-1.5">
              <span className="font-mono text-[14px] font-bold text-[var(--accent2)]">
                {((gridDelta.myMix.wind.pct + gridDelta.myMix.solar.pct)).toFixed(0)}%
              </span>
              <span className="font-mono text-[7px] text-[var(--dim)]">YOUR RENEWABLE</span>
            </div>
          </div>
        )}
      </div>

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

  const peekPx = 34;

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
    <div
      className={`pointer-events-auto ${cardClass} px-3 py-2.5 animate-fade-up transition-transform duration-300 ease-out will-change-transform`}
      style={{
        minWidth,
        transform: collapsed ? `translateX(calc(-100% + ${peekPx}px))` : 'translateX(0px)',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
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
            className={`text-[var(--dim)] opacity-70 transition-transform ${collapsed ? '-rotate-90' : 'rotate-90'}`}
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
