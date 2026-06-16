import React, { useMemo, useState, useEffect } from 'react';
import { getBezierCoord, getBezierDerivative, getBezierSecondDerivative } from '../utils/bezierMath';

export default function CurveInspector({ x1, y1, x2, y2, currentT: externalT, onTChange }) {
  const [t, setT] = useState(typeof externalT === 'number' ? externalT : 0);

  useEffect(() => {
    if (typeof externalT === 'number') setT(externalT);
  }, [externalT]);

  const handleChange = (val) => {
    const n = parseFloat(val);
    setT(n);
    if (onTChange) onTChange(n);
  };

  const coords = useMemo(() => {
    const tx = getBezierCoord(t, x1, x2);
    const ty = getBezierCoord(t, y1, y2);
    return { x: tx, y: ty };
  }, [t, x1, y1, x2, y2]);

  const derivatives = useMemo(() => {
    // dy/dt and d2y/dt2
    const dy_dt = getBezierDerivative(t, y1, y2);
    const d2y_dt2 = getBezierSecondDerivative(t, y1, y2);

    // To get dy/dx (velocity relative to x) we need dx/dt
    const dx_dt = getBezierDerivative(t, x1, x2);
    const velocity = Math.abs(dx_dt) < 1e-7 ? (dy_dt >= 0 ? 1e6 : -1e6) : dy_dt / dx_dt;

    return { dy_dt, d2y_dt2, dx_dt, velocity };
  }, [t, x1, y1, x2, y2]);

  return (
    <div className="p-4 rounded-2xl border border-[var(--border)] bg-card shadow-lg glass-card w-full max-w-[420px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Curve Inspector</h3>
        <div className="text-xs text-gray-400 font-mono">t = {t.toFixed(3)}</div>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={t}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full"
          aria-label="Parameter t"
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-xs font-mono">
            <div className="text-[10px] text-gray-400">x(t)</div>
            <div className="text-sm font-bold text-white">{coords.x.toFixed(4)}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-xs font-mono">
            <div className="text-[10px] text-gray-400">y(t)</div>
            <div className="text-sm font-bold text-white">{coords.y.toFixed(4)}</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-xs font-mono text-center transition-transform duration-200">
            <div className="text-[10px] text-gray-400">Position</div>
            <div className="text-sm font-bold text-white">{coords.y.toFixed(3)}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-xs font-mono text-center transition-transform duration-200">
            <div className="text-[10px] text-gray-400">Velocity</div>
            <div className="text-sm font-bold text-white">{derivatives.velocity.toFixed(3)}x</div>
          </div>
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-xs font-mono text-center transition-transform duration-200">
            <div className="text-[10px] text-gray-400">Acceleration</div>
            <div className="text-sm font-bold text-white">{derivatives.d2y_dt2.toFixed(3)}x</div>
          </div>
        </div>
      </div>
    </div>
  );
}
