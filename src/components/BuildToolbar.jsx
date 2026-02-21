import { useMemo, useState } from 'react';
import { BUILDING_LIST, BUILDING_CATEGORIES, SPECIAL_TOOLS, calcPlacementCostM } from '../data/buildings';

export default function BuildToolbar({ activeTool, onSelectTool, onUndo, buildCount, cashM }) {
  const [category, setCategory] = useState('city');

  const tools = useMemo(() => ([
    SPECIAL_TOOLS.expand,
  ]), []);

  const visible = useMemo(() => {
    if (category === 'tools') return tools;
    return BUILDING_LIST.filter(b => (b.category || 'energy') === category);
  }, [category, tools]);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 animate-fade-up select-none">
      {/* Category tabs */}
      <div className="flex justify-center gap-1 mb-2 pointer-events-auto">
        {BUILDING_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1 rounded-md font-mono text-[9px] tracking-[2px] border transition-all duration-200 ${
              category === c.id
                ? 'text-[var(--text)] border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)]'
                : 'text-[var(--dim)] border-[var(--border)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
            style={category === c.id ? { boxShadow: '0 0 8px rgba(0,212,255,0.1)' } : {}}
          >
            {c.label}
          </button>
        ))}
        <button
          onClick={() => setCategory('tools')}
          className={`px-3 py-1 rounded-md font-mono text-[9px] tracking-[2px] border transition-all duration-200 ${
            category === 'tools'
              ? 'text-[var(--text)] border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)]'
              : 'text-[var(--dim)] border-[var(--border)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.12)]'
          }`}
          style={category === 'tools' ? { boxShadow: '0 0 8px rgba(0,212,255,0.1)' } : {}}
        >
          TOOLS
        </button>
      </div>

      <div className="flex items-end gap-1.5 bg-[rgba(5,10,20,0.6)] backdrop-blur-md rounded-2xl px-3 py-2 border border-[rgba(20,40,70,0.4)]">
      {visible.map(b => {
        const active = activeTool === b.id;
        const cost = b.id === 'expand' ? null : calcPlacementCostM(b.id);
        const disabled = typeof cost === 'number' ? cost > (cashM ?? Infinity) : false;
        return (
          <button
            key={b.id}
            onClick={() => onSelectTool(active ? null : b.id)}
            disabled={disabled}
            className={`group relative flex flex-col items-center transition-all duration-200 ${
              disabled ? 'opacity-40 cursor-not-allowed' : ''
            } ${active ? 'translate-y-[-6px]' : disabled ? '' : 'hover:translate-y-[-3px]'}`}
          >
            {/* Tooltip */}
            <div className={`absolute bottom-full mb-2.5 px-3 py-2 rounded-lg bg-[rgba(8,16,32,0.97)] border border-[var(--border)] backdrop-blur-xl whitespace-nowrap transition-all duration-200 ${
              active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0'
            }`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              <div className="font-display text-[11px] font-medium text-[var(--text)]">{b.name}</div>
              <div className="font-mono text-[8px] text-[var(--dim)] mt-0.5">
                {b.id === 'expand'
                  ? 'Unlock adjacent grid chunk'
                  : `${fmtMw(b.mw)} MW · ${b.type === 'generation' ? '⚡ generates' : b.type === 'load' ? '📊 consumes' : '🔄 stores'}`
                }
              </div>
              <div className="font-mono text-[7px] text-[var(--dim)] opacity-60 mt-0.5">{b.description}</div>
              {b.id !== 'expand' && (
                <div className="font-mono text-[7px] mt-1 pt-1 border-t border-[var(--border)]">
                  <span className="text-[var(--dim)]">Cost: </span>
                  <span className="text-[var(--text)]">${cost.toFixed(0)}M</span>
                  <span className="text-[var(--dim)] ml-2">CF: </span>
                  <span className="text-[var(--text)]">{(b.capacityFactor * 100).toFixed(0)}%</span>
                </div>
              )}
              {b.sim && (
                <div className="font-mono text-[7px] mt-0.5 text-[var(--dim)] opacity-60">
                  {b.sim.housing > 0 && <span>🏠 {b.sim.housing} units </span>}
                  {b.sim.jobs > 0 && <span>💼 {b.sim.jobs} jobs</span>}
                </div>
              )}
              {disabled && (
                <div className="font-mono text-[7px] text-[#ff6b6b] mt-1">
                  Not enough budget
                </div>
              )}
            </div>

            {/* Button */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl transition-all duration-200 border-2 ${
              active
                ? 'bg-[rgba(8,16,32,0.95)]'
                : 'bg-[var(--panel)] border-[var(--border)] hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(12,24,48,0.95)]'
            }`}
            style={active ? {
              borderColor: b.color,
              boxShadow: `0 0 20px ${b.glow}, 0 0 40px ${b.glow}, inset 0 0 15px ${b.glow}`,
            } : {}}>
              <span className={`text-xl transition-transform duration-200 ${active ? 'scale-125' : 'group-hover:scale-110'}`}>
                {b.icon}
              </span>
            </div>

            {/* Energy type indicator dot */}
            {b.type && (
              <div
                className="w-1.5 h-1.5 rounded-full mt-1"
                style={{
                  backgroundColor: b.type === 'generation' ? '#00ff88' : b.type === 'load' ? '#ff6b6b' : '#a855f7',
                  opacity: active ? 1 : 0.4,
                  boxShadow: active ? `0 0 4px ${b.type === 'generation' ? '#00ff88' : b.type === 'load' ? '#ff6b6b' : '#a855f7'}` : 'none',
                }}
              />
            )}

            {/* Label */}
            <span className={`font-mono text-[7px] mt-0.5 tracking-[0.5px] transition-all ${
              active ? 'opacity-90 font-medium' : 'text-[var(--dim)] opacity-40'
            }`} style={active ? { color: b.color } : {}}>
              {b.id.toUpperCase()}
            </span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-px h-10 bg-[var(--border)] mx-1.5 self-center opacity-30" />

      {/* Undo */}
      <button onClick={onUndo}
              className="w-11 h-11 rounded-xl bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center text-[var(--dim)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-200 self-center hover:bg-[rgba(12,24,48,0.95)]"
              title="Undo last placement">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10h13a4 4 0 0 1 0 8H9M3 10l5-5M3 10l5 5"/>
        </svg>
      </button>
      </div>
    </div>
  );
}

function fmtMw(mw) {
  if (mw == null) return '—';
  if (mw < 1) return mw.toFixed(1);
  return mw.toFixed(0);
}
