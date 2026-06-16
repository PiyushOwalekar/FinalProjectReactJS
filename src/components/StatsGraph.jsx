import { useMemo, useCallback } from 'react';
import { sampleBezierCurve } from '../utils/bezierMath';

export default function StatsGraph({ x1, y1, x2, y2, themeMode }) {
  // Generate curve data points
  const points = useMemo(() => {
    return sampleBezierCurve(x1, y1, x2, y2, 80);
  }, [x1, y1, x2, y2]);

  // Width and height of the SVG graph
  const width = 340;
  const height = 110;
  const paddingX = 35;
  const paddingY = 15;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Find boundaries for velocity to autoscale graph vertical axis
  const velocityData = useMemo(() => {
    const vals = points.map((p) => p.velocity);
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    
    // Clamp to reasonable ranges to avoid infinite spikes breaking the layout
    if (min < -4) min = -4;
    if (max > 6) max = 6;
    
    // Keep a minimum range (e.g., 0 to 2) so linear velocity doesn't span full height
    if (max - min < 1) {
      max = Math.max(2, max);
      min = Math.min(0, min);
    }
    
    // Pad margins slightly
    const padding = (max - min) * 0.1 || 0.2;
    return { min: min - padding, max: max + padding, values: vals };
  }, [points]);

  const { min: yMin, max: yMax } = velocityData;

  // Convert (x, velocity) to SVG coordinate points
  const getSvgCoords = useCallback((x, val) => {
    const svgX = paddingX + x * graphWidth;
    
    // Map velocity value to SVG y (val = yMin is bottom, val = yMax is top)
    const normY = (val - yMin) / (yMax - yMin);
    const svgY = paddingY + (1 - normY) * graphHeight;
    return { x: svgX, y: svgY };
  }, [paddingX, graphWidth, paddingY, graphHeight, yMin, yMax]);

  // Generate SVG path for the velocity line and filled area
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };

    let lPath = '';
    let aPath = '';

    const firstPt = getSvgCoords(points[0].x, points[0].velocity);
    lPath += `M ${firstPt.x},${firstPt.y}`;
    
    // Area path starts at baseline
    const baselineY = getSvgCoords(0, 0).y;
    // Clamp baseline inside the graph boundaries for filling
    const clampedBaselineY = Math.max(paddingY, Math.min(height - paddingY, baselineY));
    aPath += `M ${firstPt.x},${clampedBaselineY} L ${firstPt.x},${firstPt.y}`;

    for (let i = 1; i < points.length; i++) {
      const pt = getSvgCoords(points[i].x, points[i].velocity);
      lPath += ` L ${pt.x},${pt.y}`;
      aPath += ` L ${pt.x},${pt.y}`;
    }

    const lastPt = getSvgCoords(points[points.length - 1].x, points[points.length - 1].velocity);
    aPath += ` L ${lastPt.x},${clampedBaselineY} Z`;

    return { linePath: lPath, areaPath: aPath };
  }, [points, getSvgCoords]);

  // Coordinates for labels
  const zeroLineCoords = getSvgCoords(0, 0);

  // Metrics: peak velocity, average velocity, smoothness score (simple heuristic)
  const metrics = useMemo(() => {
    const vals = velocityData.values;
    const peak = Math.max(...vals.map((v) => Math.abs(v)));
    const avg = vals.reduce((s, v) => s + Math.abs(v), 0) / Math.max(1, vals.length);
    // Smoothness: inverse of average absolute second-difference (discrete acceleration changes)
    let accSum = 0;
    for (let i = 2; i < vals.length; i++) {
      const a = vals[i] - vals[i - 1];
      const b = vals[i - 1] - vals[i - 2];
      accSum += Math.abs(a - b);
    }
    const smoothness = Math.max(0, 100 - (accSum / Math.max(1, vals.length)) * 40);
    return { peak, avg, smoothness };
  }, [velocityData]);

  // Theme-specific SVG colors
  const isLight = themeMode === 'light';
  const referenceLineColor = isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.22)';
  // Slightly stronger grid for readability but still subtle (8%)
  const gridLineColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const axisColor = isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.12)';
  const textColor = isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.65)';

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[420px] rounded-xl border border-[var(--border)] bg-card shadow-lg p-3 overflow-hidden mt-3 glass-card animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
            Velocity Profile (dy/dx)
          </h3>
          <span className="text-[10px] text-sky-400 font-mono font-semibold">
            Speed relative to Time
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible select-none">
          <defs>
            {/* Area fills: positive and negative with soft fades */}
            <linearGradient id="velocity-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="velocity-area-negative-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F87171" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#F87171" stopOpacity="0.12" />
            </linearGradient>

            {/* Glow filter for the velocity line to echo the main bezier curve */}
            <filter id="vel-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0.82  0 0 0 0 0.83  0 0 0 0.9 0" result="col" />
              <feMerge>
                <feMergeNode in="col" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Stroke gradient for the line (cyan -> purple) */}
            <linearGradient id="velocity-line-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>

          {/* Zero Velocity Reference Line */}
          {zeroLineCoords.y >= paddingY && zeroLineCoords.y <= height - paddingY && (
            <line
              x1={paddingX}
              y1={zeroLineCoords.y}
              x2={width - paddingX}
              y2={zeroLineCoords.y}
              stroke={referenceLineColor}
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Vertical Time dividers */}
          {[0.25, 0.5, 0.75].map((xVal) => {
            const pt = getSvgCoords(xVal, 0);
            return (
              <line
                key={xVal}
                x1={pt.x}
                y1={paddingY}
                x2={pt.x}
                y2={height - paddingY}
                stroke={gridLineColor}
                strokeWidth="1"
              />
            );
          })}

          {/* Shaded Area under Velocity Curve */}
          <path d={areaPath} fill="url(#velocity-area-grad)" opacity="0.95" />

          {/* Main Velocity Curve Line (stronger + glow) */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#velocity-line-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#vel-glow)"
          />

          {/* Peak velocity marker */}

          {/* X and Y Axes grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={paddingX}
            y2={height - paddingY}
            stroke={axisColor}
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke={axisColor}
            strokeWidth="1"
          />

          {/* Peak marker (dot + dotted guide) */}
          {(() => {
            const maxIdx = velocityData.values.indexOf(Math.max(...velocityData.values));
            const pt = getSvgCoords(points[maxIdx].x, points[maxIdx].velocity);
            return (
              <g key="peak">
                <line x1={pt.x} y1={paddingY} x2={pt.x} y2={height - paddingY} stroke={gridLineColor} strokeDasharray="3 3" strokeWidth="1" opacity="0.25" />
                <circle cx={pt.x} cy={pt.y} r="4" fill="#00D4FF" stroke="#fff" strokeWidth="1" />
              </g>
            );
          })()}

          {/* Labels */}
          {/* Max Velocity Label */}
          <text
            x={paddingX - 6}
            y={paddingY + 8}
            fill={textColor}
            fontSize="8"
            fontFamily="monospace"
            textAnchor="end"
          >
            {yMax.toFixed(1)}x
          </text>
          
          {/* Zero/Baseline velocity Label */}
          <text
            x={paddingX - 6}
            y={zeroLineCoords.y + 3}
            fill={textColor}
            fontSize="8"
            fontFamily="monospace"
            textAnchor="end"
          >
            0.0
          </text>

          {/* Min Velocity Label */}
          <text
            x={paddingX - 6}
            y={height - paddingY}
            fill={textColor}
            fontSize="8"
            fontFamily="monospace"
            textAnchor="end"
          >
            {yMin.toFixed(1)}x
          </text>

          {/* Time axis labels */}
          <text
            x={paddingX}
            y={height - paddingY + 12}
            fill={textColor}
            fontSize="8"
            fontFamily="monospace"
            textAnchor="middle"
          >
            t=0
          </text>
          <text
            x={width - paddingX}
            y={height - paddingY + 12}
            fill={textColor}
            fontSize="8"
            fontFamily="monospace"
            textAnchor="middle"
          >
            t=1
          </text>
        </svg>

        {/* Metrics Footer */}
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-gray-300">
          <div>
            <div className="text-[10px] text-gray-400">Peak Velocity</div>
            <div className="text-sm font-bold text-white">{metrics.peak.toFixed(2)}x</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Average Velocity</div>
            <div className="text-sm font-bold text-white">{metrics.avg.toFixed(2)}x</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Smoothness</div>
            <div className="text-sm font-bold text-white">{Math.round(metrics.smoothness)} / 100</div>
          </div>
        </div>
      </div>

      {/* Acceleration Profile Card */}
      <div className="w-full max-w-[420px] rounded-xl border border-[var(--border)] bg-card shadow-lg p-3 overflow-hidden mt-3 glass-card animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Acceleration Profile (d²y/dt²)</h3>
          <span className="text-[10px] text-sky-400 font-mono font-semibold">Relative to t</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible select-none">
          <defs>
            <linearGradient id="acc-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="acc-line-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
          </defs>

          {/* Build acceleration path */}
          {(() => {
            const accVals = points.map((p) => p.acc || 0);
            let accMin = Math.min(...accVals);
            let accMax = Math.max(...accVals);
            if (accMax - accMin < 0.1) {
              accMax = accMin + 0.1;
            }
            const accToSvg = (x, a) => {
              const svgX = paddingX + x * graphWidth;
              const normY = (a - accMin) / (accMax - accMin);
              const svgY = paddingY + (1 - normY) * graphHeight;
              return { x: svgX, y: svgY };
            };

            let accLine = '';
            let accArea = '';
            const baseY = paddingY + graphHeight;
            for (let i = 0; i < points.length; i++) {
              const pt = accToSvg(points[i].x, accVals[i]);
              if (i === 0) {
                accLine += `M ${pt.x},${pt.y}`;
                accArea += `M ${pt.x},${baseY} L ${pt.x},${pt.y}`;
              } else {
                accLine += ` L ${pt.x},${pt.y}`;
                accArea += ` L ${pt.x},${pt.y}`;
              }
            }
            const last = accToSvg(points[points.length - 1].x, accVals[points.length - 1]);
            accArea += ` L ${last.x},${baseY} Z`;

            const peakAcc = accMax;
            const minAcc = accMin;
            const avgAcc = accVals.reduce((s, v) => s + v, 0) / Math.max(1, accVals.length);

            return (
              <g>
                <path d={accArea} fill="url(#acc-area-grad)" opacity="0.9" />
                <path d={accLine} fill="none" stroke="url(#acc-line-grad)" strokeWidth="3" strokeLinecap="round" />

                {/* Labels */}
                <text x={paddingX - 6} y={paddingY + 8} fill={textColor} fontSize="8" fontFamily="monospace" textAnchor="end">{accMax.toFixed(2)}</text>
                <text x={paddingX - 6} y={height - paddingY} fill={textColor} fontSize="8" fontFamily="monospace" textAnchor="end">{accMin.toFixed(2)}</text>
                <text x={paddingX} y={height - paddingY + 12} fill={textColor} fontSize="8" fontFamily="monospace" textAnchor="middle">t=0</text>
                <text x={width - paddingX} y={height - paddingY + 12} fill={textColor} fontSize="8" fontFamily="monospace" textAnchor="middle">t=1</text>

                {/* Metrics Footer */}
                <g transform={`translate(0, ${height + 8})`}>
                  <text x={paddingX} y={12} fill={textColor} fontSize="11" fontFamily="monospace">Peak Acceleration: <tspan fill="#fff">{peakAcc.toFixed(3)}</tspan></text>
                  <text x={paddingX + 180} y={12} fill={textColor} fontSize="11" fontFamily="monospace">Min Acceleration: <tspan fill="#fff">{minAcc.toFixed(3)}</tspan></text>
                  <text x={paddingX + 340} y={12} fill={textColor} fontSize="11" fontFamily="monospace">Avg Acceleration: <tspan fill="#fff">{avgAcc.toFixed(3)}</tspan></text>
                </g>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
