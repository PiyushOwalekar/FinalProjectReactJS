import { useEffect, useState } from 'react';
import Toast from './Toast';

const PRESETS = {
  Standard: [
    { name: 'Ease (Default)', value: [0.25, 0.1, 0.25, 1.0] },
    { name: 'Linear', value: [0.25, 0.25, 0.75, 0.75] },
    { name: 'Ease-In', value: [0.42, 0.0, 1.0, 1.0] },
    { name: 'Ease-Out', value: [0.0, 0.0, 0.58, 1.0] },
    { name: 'Ease-In-Out', value: [0.42, 0.0, 0.58, 1.0] },
  ],
  Penner: [
    { name: 'In-Quad', value: [0.11, 0.0, 0.5, 0.0] },
    { name: 'Out-Quad', value: [0.5, 1.0, 0.89, 1.0] },
    { name: 'InOut-Quad', value: [0.45, 0.0, 0.55, 1.0] },
    { name: 'In-Cubic', value: [0.32, 0.0, 0.67, 0.0] },
    { name: 'Out-Cubic', value: [0.33, 1.0, 0.68, 1.0] },
    { name: 'InOut-Cubic', value: [0.65, 0.0, 0.35, 1.0] },
  ],
  Overshoot: [
    { name: 'In-Back', value: [0.36, 0.0, 0.66, -0.56] },
    { name: 'Out-Back', value: [0.34, 1.56, 0.64, 1.0] },
    { name: 'InOut-Back', value: [0.68, -0.6, 0.32, 1.6] },
    { name: 'Out-Elastic', value: [0.7, 1.8, 0.3, 1.2] },
    { name: 'Soft-Bounce', value: [0.175, 0.885, 0.32, 1.275] },
  ],
};

export default function MotionControls({ x1, y1, x2, y2, onChange, snapToGrid, setSnapToGrid }) {
  const [activeTab, setActiveTab] = useState('css');
  const [copyStatus, setCopyStatus] = useState(false);
  const [customName, setCustomName] = useState('');
  const [savedCurves, setSavedCurves] = useState(() => {
    try {
      const s = localStorage.getItem('custom_bezier_curves');
      return s ? JSON.parse(s) : [];
    } catch (e) {
      console.error('Failed to parse saved curves', e);
      return [];
    }
  });

  const [toast, setToast] = useState({ open: false, message: '', tone: 'info' });

  useEffect(() => {
    // persist saved curves when they change
    try {
      localStorage.setItem('custom_bezier_curves', JSON.stringify(savedCurves));
    } catch (e) {
      // ignore
    }
  }, [savedCurves]);

  const change = (patch) => {
    // Call onChange with merged current values + patch
    const next = {
      x1: typeof patch.x1 === 'number' ? patch.x1 : x1,
      y1: typeof patch.y1 === 'number' ? patch.y1 : y1,
      x2: typeof patch.x2 === 'number' ? patch.x2 : x2,
      y2: typeof patch.y2 === 'number' ? patch.y2 : y2,
    };
    onChange(next);
  };

  const handleSliderChange = (key, value) => {
    const floatVal = parseFloat(value);
    if (key === 'x1' || key === 'x2') {
      const clamped = Math.max(0, Math.min(1, floatVal));
      change({ [key]: clamped });
    } else {
      change({ [key]: floatVal });
    }
  };

  const handleNumericInput = (key, value) => {
    let parsed = parseFloat(value);
    if (Number.isNaN(parsed)) parsed = 0;
    if (key === 'x1' || key === 'x2') parsed = Math.max(0, Math.min(1, parsed));
    change({ [key]: parsed });
  };

  const applyPreset = (coords) => change({ x1: coords[0], y1: coords[1], x2: coords[2], y2: coords[3] });

  const handleSaveCurve = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCurve = { id: Date.now().toString(), name: customName.trim(), value: [x1, y1, x2, y2] };
    setSavedCurves((s) => [...s, newCurve]);
    setCustomName('');
    setToast({ open: true, message: 'Curve saved', tone: 'success' });
  };

  const handleDeleteSaved = (id, e) => {
    e.stopPropagation();
    setSavedCurves((s) => s.filter((c) => c.id !== id));
    setToast({ open: true, message: 'Preset deleted', tone: 'info' });
  };

  const getExportCode = () => {
    const bezierStr = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
    switch (activeTab) {
      case 'css':
        return `transition: all 1.5s ${bezierStr};`;
      case 'tailwind':
        return `ease-[${bezierStr.replace(/\s+/g, '')}] duration-[1500ms]`;
      case 'framer':
        return `transition={{\n  ease: [${x1}, ${y1}, ${x2}, ${y2}],\n  duration: 1.5\n}}`;
      case 'gsap':
        return `gsap.to(element, {\n  duration: 1.5,\n  ease: "cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})"\n});`;
      default:
        return bezierStr;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getExportCode());
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 1400);
      setToast({ open: true, message: 'Code copied', tone: 'success' });
    } catch (e) {
      setToast({ open: true, message: 'Copy failed', tone: 'danger' });
    }
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?curve=${x1},${y1},${x2},${y2}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast({ open: true, message: 'Shareable URL copied', tone: 'success' });
    } catch (e) {
      setToast({ open: true, message: 'Copy failed', tone: 'danger' });
    }
  };

  const handleReset = () => {
    change({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 });
    setToast({ open: true, message: 'Reset to default ease', tone: 'info' });
  };

  const getMiniCurvePath = (val) => {
    const [px1, py1, px2, py2] = val;
    const cx1 = Math.max(0, Math.min(1, px1));
    const cy1 = Math.max(0, Math.min(1, py1));
    const cx2 = Math.max(0, Math.min(1, px2));
    const cy2 = Math.max(0, Math.min(1, py2));
    const x0 = 2,
      y0 = 22;
    const x1p = 2 + cx1 * 20,
      y1p = 22 - cy1 * 20;
    const x2p = 2 + cx2 * 20,
      y2p = 22 - cy2 * 20;
    const x3 = 22,
      y3 = 2;
    return `M ${x0},${y0} C ${x1p},${y1p} ${x2p},${y2p} ${x3},${y3}`;
  };

  const renderPresetButton = (preset) => {
    const pathD = getMiniCurvePath(preset.value);
    return (
      <button
        key={preset.name}
        onClick={() => applyPreset(preset.value)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-gray-300 hover:text-white transition-all text-left w-full group"
        aria-label={`Apply preset ${preset.name}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <line x1="2" y1="22" x2="22" y2="2" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" strokeWidth="1" />
          <path d={pathD} fill="none" stroke="url(#mini-curve-grad)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="truncate">{preset.name}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-5 w-full text-left">
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0">
        <defs>
          <linearGradient id="mini-curve-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Controls Card */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-card shadow-lg glass-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Control Handles</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={copyShareLink}
              className="text-xs normal-case font-semibold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20"
            >
              Share Link
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* P1 X */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <label htmlFor="p1x" className="text-sky-400 font-bold">P1 X (Time Anchor)</label>
              <span className="text-gray-300 font-bold">{x1}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="p1x"
                aria-label="P1 X"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={x1}
                onChange={(e) => handleSliderChange('x1', e.target.value)}
                className="w-full h-2"
              />
              <input
                aria-label="P1 X numeric"
                type="number"
                step="0.01"
                value={x1}
                onChange={(e) => handleNumericInput('x1', e.target.value)}
                className="w-20 px-2 py-1 rounded bg-black/30 border border-white/5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* P1 Y */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <label htmlFor="p1y" className="text-sky-400 font-bold">P1 Y (Position Easing)</label>
              <span className="text-gray-300 font-bold">{y1}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="p1y"
                aria-label="P1 Y"
                type="range"
                min="-1.5"
                max="2.5"
                step="0.01"
                value={y1}
                onChange={(e) => handleSliderChange('y1', e.target.value)}
                className="w-full h-2"
              />
              <input
                aria-label="P1 Y numeric"
                type="number"
                step="0.01"
                value={y1}
                onChange={(e) => handleNumericInput('y1', e.target.value)}
                className="w-20 px-2 py-1 rounded bg-black/30 border border-white/5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="h-px bg-white/5 my-1" />

          {/* P2 X */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <label htmlFor="p2x" className="text-pink-400 font-bold">P2 X (Time Anchor)</label>
              <span className="text-gray-300 font-bold">{x2}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="p2x"
                aria-label="P2 X"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={x2}
                onChange={(e) => handleSliderChange('x2', e.target.value)}
                className="w-full h-2"
              />
              <input
                aria-label="P2 X numeric"
                type="number"
                step="0.01"
                value={x2}
                onChange={(e) => handleNumericInput('x2', e.target.value)}
                className="w-20 px-2 py-1 rounded bg-black/30 border border-white/5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* P2 Y */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <label htmlFor="p2y" className="text-pink-400 font-bold">P2 Y (Position Easing)</label>
              <span className="text-gray-300 font-bold">{y2}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="p2y"
                aria-label="P2 Y"
                type="range"
                min="-1.5"
                max="2.5"
                step="0.01"
                value={y2}
                onChange={(e) => handleSliderChange('y2', e.target.value)}
                className="w-full h-2"
              />
              <input
                aria-label="P2 Y numeric"
                type="number"
                step="0.01"
                value={y2}
                onChange={(e) => handleNumericInput('y2', e.target.value)}
                className="w-20 px-2 py-1 rounded bg-black/30 border border-white/5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="h-px bg-white/5 my-1" />

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-mono">
              <input
                type="checkbox"
                checked={!!snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                aria-label="Toggle snap to grid"
              />
              <span className="text-gray-300">Snap to grid</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-gray-200 hover:bg-white/10 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast open={toast.open} message={toast.message} tone={toast.tone} onClose={() => setToast({ ...toast, open: false })} />

      {/* Preset Library Card */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-card shadow-lg flex flex-col gap-4 glass-card">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Preset Library</h3>

        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5 font-mono">Standard CSS</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">{PRESETS.Standard.map((p) => renderPresetButton(p))}</div>
        </div>

        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5 font-mono">Penner / Smooth</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">{PRESETS.Penner.map((p) => renderPresetButton(p))}</div>
        </div>

        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5 font-mono">Overshoot & Wobble</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">{PRESETS.Overshoot.map((p) => renderPresetButton(p))}</div>
        </div>

        {savedCurves.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5 font-mono">Saved Custom Curves</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {savedCurves.map((curve) => (
                <div
                  key={curve.id}
                  onClick={() => applyPreset(curve.value)}
                  className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-[11px] text-sky-300 hover:text-white transition-all cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <line x1="2" y1="22" x2="22" y2="2" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                      <path d={getMiniCurvePath(curve.value)} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span className="truncate">{curve.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSaved(curve.id, e)}
                    className="opacity-50 hover:opacity-100 p-0.5 hover:bg-black/30 rounded shrink-0"
                    title="Delete preset"
                    aria-label={`Delete ${curve.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSaveCurve} className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="Save current curve as..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white focus:outline-none focus:border-sky-500/50 font-sans"
            aria-label="Save curve name"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-pink-500 text-xs font-semibold text-white shadow hover:opacity-90 active:scale-95 transition-all">Save</button>
        </form>
      </div>

      {/* Code Export Compiler */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-card shadow-lg flex flex-col glass-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Code Export Compiler</h3>
          <button
            onClick={copyToClipboard}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${copyStatus ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}
          >
            {copyStatus ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex border-b border-white/5 mb-3">
          {['css', 'tailwind', 'framer', 'gsap'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 capitalize transition-all ${activeTab === tab ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {tab === 'css' ? 'CSS' : tab === 'tailwind' ? 'Tailwind' : tab === 'framer' ? 'Framer' : 'GSAP'}
            </button>
          ))}
        </div>

        <div className="p-3.5 rounded-lg bg-black/60 border border-white/5 font-mono text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap select-all select-text select-glow leading-relaxed">{getExportCode()}</div>
      </div>
    </div>
  );
}
