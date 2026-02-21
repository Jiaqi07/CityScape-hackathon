import { BUILDING_LIST } from '../data/buildings';

export default function BuildToolbar({ activeTool, onSelectTool, onUndo, buildCount }) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-end gap-1.5 animate-fade-up select-none">
      {BUILDING_LIST.map(b => {
        const active = activeTool === b.id;
        return (
          <button
            key={b.id}
            onClick={() => onSelectTool(active ? null : b.id)}
            className={`group relative flex flex-col items-center transition-all duration-200 ${
              active ? 'translate-y-[-6px]' : 'hover:translate-y-[-3px]'
            }`}
          >
            {/* Tooltip */}
            <div className={`absolute bottom-full mb-2.5 px-3 py-2 rounded-lg bg-[rgba(8,16,32,0.95)] border border-[var(--border)] backdrop-blur-xl whitespace-nowrap transition-all duration-200 ${
              active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0'
            }`}>
              <div className="font-display text-[11px] font-medium text-[var(--text)]">{b.name}</div>
              <div className="font-mono text-[8px] text-[var(--dim)] mt-0.5">
                {b.mw} MW · {b.type === 'generation' ? '⚡ generates' : b.type === 'load' ? '📊 consumes' : '🔄 stores'}
              </div>
              <div className="font-mono text-[7px] text-[var(--dim)] opacity-60 mt-0.5">{b.description}</div>
              <div className="font-mono text-[7px] mt-1 pt-1 border-t border-[var(--border)]">
                <span className="text-[var(--dim)]">Cost: </span>
                <span className="text-[var(--text)]">${(b.costPerMw * b.mw).toFixed(0)}M</span>
                <span className="text-[var(--dim)] ml-2">CF: </span>
                <span className="text-[var(--text)]">{(b.capacityFactor * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Button */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl transition-all border-2 ${
              active
                ? 'bg-[rgba(8,16,32,0.95)]'
                : 'bg-[var(--panel)] border-[var(--border)] hover:border-[rgba(255,255,255,0.15)]'
            }`}
            style={active ? { borderColor: b.color, boxShadow: `0 0 20px ${b.glow}, 0 0 40px ${b.glow}` } : {}}>
              <span className={`text-xl transition-transform ${active ? 'scale-125' : 'group-hover:scale-110'}`}>
                {b.icon}
              </span>
            </div>

            {/* Label */}
            <span className={`font-mono text-[7px] mt-1.5 tracking-[0.5px] transition-all ${
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
              className="w-11 h-11 rounded-xl bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center text-[var(--dim)] hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.15)] transition-all self-center"
              title="Undo last placement">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10h13a4 4 0 0 1 0 8H9M3 10l5-5M3 10l5 5"/>
        </svg>
      </button>
    </div>
  );
}
