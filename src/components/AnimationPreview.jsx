import { useEffect, useRef, useState } from 'react';

const OBJECTS = [
  { id: 'car', label: '🏎 Car' },
  { id: 'block', label: '⬛ Block' },
  { id: 'circle', label: '⚪ Circle' }
];

const PRESET_LANES = (custom) => [
  { key: 'custom', name: 'Custom Curve', easing: custom, color: 'from-sky-500 to-pink-500' },
  { key: 'linear', name: 'Linear', easing: 'linear', color: 'from-gray-500 to-slate-500' },
  { key: 'ease', name: 'Ease', easing: 'ease', color: 'from-blue-500 to-indigo-500' },
  { key: 'ease-in-out', name: 'Ease-In-Out', easing: 'ease-in-out', color: 'from-teal-500 to-emerald-500' }
];

export default function AnimationPreview({
  x1,
  y1,
  x2,
  y2,
  isPlaying,
  setIsPlaying,
  duration,
  setDuration,
  autoLoop,
  setAutoLoop
}) {
  const customEasing = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  const [selectedObjects, setSelectedObjects] = useState(new Set(['car']));
  const [compareMode, setCompareMode] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const progressRef = useRef(0);

  const toggleObject = (id) => {
    setSelectedObjects((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  };

  // RAF loop to drive smooth updates and avoid unnecessary React re-renders
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
      progressRef.current = 0;
      return;
    }

    const run = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000; // seconds
      const p = Math.min(1, elapsed / duration);
      progressRef.current = p;

      // Force a visual CSS-driven update by toggling a data attribute on body or similar
      // But to animate the DOM we rely on inline styles computed from p in render

      if (p < 1) {
        rafRef.current = requestAnimationFrame(run);
      } else {
        // finish
        setIsPlaying(false);
        if (autoLoop) {
          // restart next frame
          startRef.current = null;
          setTimeout(() => setIsPlaying(true), 220);
        }
      }
    };

    rafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, duration, setIsPlaying, autoLoop]);

  const lanes = PRESET_LANES(customEasing);

  const triggerPlay = () => setIsPlaying(true);
  const triggerReset = () => { setIsPlaying(false); setAutoLoop(false); progressRef.current = 0; };

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-card shadow-lg flex flex-col gap-5 text-left w-full h-full justify-between glass-card animate-fade-in">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[var(--text-h)] uppercase tracking-wider font-mono">Physics Simulator</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-mono">Compare Mode</label>
            <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-black/30 p-3.5 rounded-xl border border-white/5 mb-5">
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button onClick={triggerPlay} className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-pink-500 text-xs font-semibold text-white">Play</button>
            ) : (
              <button onClick={triggerReset} className="px-4 py-2 rounded-lg bg-red-500/15 text-xs font-semibold text-red-400">Reset</button>
            )}

            <button onClick={() => setAutoLoop(!autoLoop)} className={`px-3 py-2 rounded-lg text-xs font-semibold ${autoLoop ? 'text-sky-400' : 'text-gray-400'}`}>Auto-Loop</button>
          </div>

          <div className="flex items-center gap-3.5 flex-1">
            <span className="text-xs font-mono text-gray-400">Duration: {duration}s</span>
            <input type="range" min="0.2" max="5.0" step="0.1" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div className="flex items-center gap-2">
            {OBJECTS.map((o) => (
              <button key={o.id} onClick={() => toggleObject(o.id)} className={`px-2 py-1 rounded ${selectedObjects.has(o.id) ? 'bg-sky-500/10 text-sky-300' : 'bg-white/5 text-gray-300'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-black/60 rounded-xl border border-white/5 relative overflow-hidden flex flex-col gap-3.5 p-4">
        {/* If compare mode, render lanes side-by-side with per-lane metrics */}
        {compareMode ? (
          <div className="grid grid-cols-1 gap-3">
            {lanes.map((lane) => (
              <div key={lane.key} className="w-full">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[10px] font-mono text-gray-400">{lane.name}</div>
                  <div className="text-[10px] font-mono text-gray-600">{lane.easing}</div>
                </div>
                <div className="w-full h-14 bg-black/40 rounded-lg border border-white/[0.03] relative flex items-center overflow-visible">
                  <div className="absolute left-[30px] text-lg opacity-60">🏁</div>
                  <div className="absolute left-[60px] right-[110px] h-2 bg-white/5 rounded-full mx-4">
                    <div style={{ width: isPlaying ? '85%' : '6%', transition: isPlaying ? `width ${duration}s ${lane.easing}` : 'width 0.08s ease-out' }} className="h-full bg-gradient-to-r from-sky-500 to-pink-500 rounded-full" />
                  </div>
                  <div style={{ left: isPlaying ? 'calc(100% - 110px)' : '60px', transition: isPlaying ? `left ${duration}s ${lane.easing}` : 'left 0.08s ease-out' }} className="absolute text-2xl">{Array.from(selectedObjects)[0] === 'block' ? '⬛' : Array.from(selectedObjects)[0] === 'circle' ? '⚪' : '🏎️'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Normal multi-object single-lane view: all selected objects race together
          <div className="flex flex-col gap-3">
            {lanes.slice(0,1).map((lane) => (
              <div key={lane.key}>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[10px] font-mono text-gray-400">{lane.name}</div>
                  <div className="text-[10px] font-mono text-gray-600">{lane.easing}</div>
                </div>
                <div className="w-full h-24 bg-black/40 rounded-lg border border-white/[0.03] relative flex items-center overflow-visible">
                  <div className="absolute left-[30px] text-lg opacity-60">🏁</div>

                  <div className="absolute left-[60px] right-[110px] h-2 bg-white/5 rounded-full mx-4">
                    <div style={{ width: isPlaying ? '85%' : '6%', transition: isPlaying ? `width ${duration}s ${lane.easing}` : 'width 0.08s ease-out' }} className="h-full bg-gradient-to-r from-sky-500 to-pink-500 rounded-full" />
                  </div>

                  {/* Render all selected objects spaced slightly by index */}
                  {Array.from(selectedObjects).map((id, idx) => {
                    const icons = { car: '🏎️', block: '⬛', circle: '⚪' };
                    const leftStyle = isPlaying ? `calc(100% - 110px + ${idx * 18}px)` : `calc(60px + ${idx * 18}px)`;
                    return (
                      <div key={id} style={{ left: leftStyle, transition: isPlaying ? `left ${duration}s ${lane.easing}` : 'left 0.08s ease-out' }} className="absolute text-2xl z-20">
                        {icons[id]}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
