import React, { useRef, useState } from 'react';

export default function CurveGraph({ x1, y1, x2, y2, onChange, isPlaying, duration, themeMode, currentT = 0, onTChange }) {
  const svgRef = useRef(null);
  const [activeHandle, setActiveHandle] = useState(null);
  const [hoveredHandle, setHoveredHandle] = useState(null);

  // SVG coordinate system configurations
  const padding = 65; // margin around the grid for overshoot handles
  const size = 280;   // width/height of the core [0,1] grid
  const svgSize = size + padding * 2; // total SVG canvas size

  // Helper conversions: normalized coordinate [0..1] to SVG pixel coordinate
  const toSvgX = (x) => padding + x * size;
  const toSvgY = (y) => padding + (1 - y) * size;

  // Helper conversions: SVG pixel coordinate to normalized coordinate
  const toNormX = (svgX) => {
    const val = (svgX - padding) / size;
    return Math.max(0, Math.min(1, val)); // strict clamp X in [0..1]
  };
  const toNormY = (svgY) => {
    const val = 1 - (svgY - padding) / size;
    // Allow Y to overshoot but clamp to a reasonable sandbox limit (e.g., -1.5 to 2.5) to keep within sight
    return Math.max(-1.5, Math.min(2.5, val));
  };

  const handlePointerDown = (handleName, e) => {
    e.preventDefault();
    setActiveHandle(handleName);
    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!activeHandle || !svgRef.current) return;
    
    // Create an SVGPoint and translate client screen coordinates to local SVG coordinates
    const point = svgRef.current.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    
    const svgPoint = point.matrixTransform(ctm.inverse());
    
    const normX = parseFloat(toNormX(svgPoint.x).toFixed(3));
    const normY = parseFloat(toNormY(svgPoint.y).toFixed(3));

    if (activeHandle === 'p1') {
      onChange({ x1: normX, y1: normY, x2, y2 });
    } else if (activeHandle === 'p2') {
      onChange({ x1, y1, x2: normX, y2: normY });
    }
  };

  const handlePointerUp = (e) => {
    if (activeHandle && svgRef.current) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    setActiveHandle(null);
  };

  // SVG coordinates for drawing elements
  const svgP0 = { x: toSvgX(0), y: toSvgY(0) };
  const svgP1 = { x: toSvgX(x1), y: toSvgY(y1) };
  const svgP2 = { x: toSvgX(x2), y: toSvgY(y2) };
  const svgP3 = { x: toSvgX(1), y: toSvgY(1) };

  // Generate cubic bezier curve path
  const pathD = `M ${svgP0.x},${svgP0.y} C ${svgP1.x},${svgP1.y} ${svgP2.x},${svgP2.y} ${svgP3.x},${svgP3.y}`;

  // Calculate dynamic viewBox bounding box to prevent clipping on overshoot
  const minY = Math.min(0, y1, y2);
  const maxY = Math.max(1, y1, y2);
  
  // Convert normalized boundary coordinates to local SVG coordinates
  const minSvgY = Math.min(0, toSvgY(maxY) - 45); // extra padding for tooltip and handles
  const maxSvgY = Math.max(svgSize, toSvgY(minY) + 45);
  
  const vHeight = maxSvgY - minSvgY;
  // Preserve square aspect ratio by centering the grid horizontally
  const viewBoxX = (svgSize / 2) - (vHeight / 2);
  const viewBoxY = minSvgY;
  const viewBoxWidth = vHeight;
  const viewBoxHeight = vHeight;

  const customEasing = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;

  // Theme-specific colors
  const isLight = themeMode === 'light';
  // Make grid subtler (15% opacity) and increase contrast for the curve
  const gridBorderColor = isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  const gridLineColor = isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  const overshootGridLineColor = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  const diagonalLineColor = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  const textColor = isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.65)';
  const overshootPatternColor = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(248, 113, 113, 0.22)';

  return (
    <div className="flex flex-col items-center select-none w-full max-w-full">
      <div className="relative w-full max-w-[420px] aspect-square rounded-2xl border border-[var(--border)] bg-card shadow-2xl p-4 overflow-hidden border-glow glass-card">
        
        {/* Graph background highlights (Sky Blue / Pink subtle gradients) */}
  <div className="absolute inset-0 bg-gradient-to-tr" style={{background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(99,102,241,0.03))'}} pointerEvents="none" />

        <svg
          ref={svgRef}
          viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full overflow-visible touch-none cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Grid Overshoot Shaded Areas */}
          <rect
            x={padding}
            y={padding - size * 1.5}
            width={size}
            height={size * 1.5}
            fill="url(#overshoot-top-pattern)"
            opacity="0.1"
          />
          <rect
            x={padding}
            y={padding + size}
            width={size}
            height={size * 1.5}
            fill="url(#overshoot-bottom-pattern)"
            opacity="0.1"
          />

          <defs>
            {/* Patterns for overshoot zones (diagonal stripes) */}
            <pattern id="overshoot-top-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0,10 L 10,0 M -2,2 L 2,-2 M 8,12 L 12,8" stroke={overshootPatternColor} strokeWidth="1" />
            </pattern>
            <pattern id="overshoot-bottom-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0,10 L 10,0 M -2,2 L 2,-2 M 8,12 L 12,8" stroke={overshootPatternColor} strokeWidth="1" />
            </pattern>
            
            {/* Glow filters */}
            <filter id="glow-p1" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-p2" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="curve-glow" x="-20%" y="-20%" width="140%" height="140%">
              {/* Stronger, softer neon glow behind the main curve */}
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.0  0 0 0 0 0.83  0 0 0 0 0.84  0 0 0 0.9 0" result="colored"/>
              <feMerge>
                <feMergeNode in="colored" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient for the main curve: cyan -> purple */}
            <linearGradient id="curve-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>

          {/* Grid coordinate lines */}
          {/* Main 0..1 bounding box */}
          <rect
            x={padding}
            y={padding}
            width={size}
            height={size}
            fill="none"
            stroke={gridBorderColor}
            strokeWidth="2"
          />

          {/* Helper subdivisions */}
          {[0.25, 0.5, 0.75].map((val) => (
            <React.Fragment key={val}>
              {/* Vertical grids extending to overshoot limits */}
              <line
                x1={toSvgX(val)}
                y1={toSvgY(-1.5)}
                x2={toSvgX(val)}
                y2={toSvgY(2.5)}
                stroke={overshootGridLineColor}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={toSvgX(val)}
                y1={toSvgY(0)}
                x2={toSvgX(val)}
                y2={toSvgY(1)}
                stroke={gridLineColor}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              
              {/* Horizontal grid subdivisions */}
              <line
                x1={toSvgX(0)}
                y1={toSvgY(val)}
                x2={toSvgX(1)}
                y2={toSvgY(val)}
                stroke={gridLineColor}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}

          {/* Additional horizontal grids for overshoot indicators */}
          {[-1.5, -1.0, -0.5, 1.5, 2.0, 2.5].map((val) => (
            <React.Fragment key={val}>
              <line
                x1={toSvgX(0)}
                y1={toSvgY(val)}
                x2={toSvgX(1)}
                y2={toSvgY(val)}
                stroke={overshootGridLineColor}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              {/* Only show these labels if they fall within the visible vertical range */}
              {toSvgY(val) >= minSvgY + 10 && toSvgY(val) <= maxSvgY - 10 && (
                <text
                  x={toSvgX(-0.12)}
                  y={toSvgY(val) + 4}
                  fill={textColor}
                  fontSize="9"
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  {val.toFixed(1)}
                </text>
              )}
            </React.Fragment>
          ))}

          {/* Linear helper diagonal line */}
          <line
            x1={svgP0.x}
            y1={svgP0.y}
            x2={svgP3.x}
            y2={svgP3.y}
            stroke={diagonalLineColor}
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />

          {/* Easing progress indicator limits */}
          <text x={toSvgX(-0.12)} y={toSvgY(0) + 4} fill={textColor} fontSize="10" textAnchor="end" fontFamily="var(--mono)">0.0</text>
          <text x={toSvgX(-0.12)} y={toSvgY(1) + 4} fill={textColor} fontSize="10" textAnchor="end" fontFamily="var(--mono)">1.0</text>
          <text x={toSvgX(0)} y={toSvgY(-0.08)} fill={textColor} fontSize="10" textAnchor="middle" fontFamily="var(--mono)">0.0</text>
          <text x={toSvgX(1)} y={toSvgY(-0.08)} fill={textColor} fontSize="10" textAnchor="middle" fontFamily="var(--mono)">1.0 (Time)</text>

          {/* Vector Handle Lines */}
          <line
            x1={svgP0.x}
            y1={svgP0.y}
            x2={svgP1.x}
            y2={svgP1.y}
            stroke="var(--accent)"
            strokeWidth="1.5"
            opacity="0.55"
          />
          <line
            x1={svgP3.x}
            y1={svgP3.y}
            x2={svgP2.x}
            y2={svgP2.y}
            stroke="#f472b6"
            strokeWidth="1.5"
            opacity="0.55"
          />

          {/* The Easing Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#curve-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#curve-glow)"
          />
            {/* Visual marker for inspector t value */}
            {typeof currentT === 'number' && (
              (() => {
                // compute point along bezier for given t param
                const mt = 1 - currentT;
                const cx = 3 * mt * mt * currentT * x1 + 3 * mt * currentT * currentT * x2 + currentT * currentT * currentT;
                const cy = 3 * mt * mt * currentT * y1 + 3 * mt * currentT * currentT * y2 + currentT * currentT * currentT;
                const px = toSvgX(cx);
                const py = toSvgY(cy);
                return (
                  <g pointerEvents="none">
                    <circle cx={px} cy={py} r="10" fill="none" stroke="url(#curve-gradient)" strokeWidth="2" opacity="0.9" filter="url(#curve-glow)" />
                    <circle cx={px} cy={py} r="5" fill="#fff" stroke="url(#curve-gradient)" strokeWidth="2" />
                    {/* Tooltip near marker */}
                    <g>
                      <rect x={px + 10} y={py - 28} rx="6" ry="6" width="120" height="24" fill="#09090c" opacity="0.95" stroke="rgba(255,255,255,0.04)" />
                      <text x={px + 16} y={py - 12} fill="#00D4FF" fontSize="10" fontFamily="var(--mono)">
                        t={currentT.toFixed(3)}
                      </text>
                      <text x={px + 68} y={py - 12} fill="#A855F7" fontSize="10" fontFamily="var(--mono)">
                        x:{(cx).toFixed(4)} y:{(cy).toFixed(4)}
                      </text>
                    </g>
                  </g>
                );
              })()
            )}
          

          {/* P0 and P3 endpoints */}
          <circle cx={svgP0.x} cy={svgP0.y} r="5" fill="var(--accent)" />
          <circle cx={svgP3.x} cy={svgP3.y} r="5" fill="var(--accent-secondary)" />

          {/* Animated Progress Dot traveling along the curve */}
          {isPlaying && (
            <g
              style={{
                offsetPath: `path('${pathD}')`,
                offsetRotate: '0deg',
                animation: `move-progress-dot ${duration}s ${customEasing} infinite`
              }}
            >
              {/* Outer pulsing ring */}
              <circle
                r="11"
                fill="none"
                stroke="url(#curve-gradient)"
                strokeWidth="2"
                opacity="0.8"
                className="animate-ping"
              />
              {/* Inner glowing core */}
              <circle
                r="6.5"
                fill="#ffffff"
                stroke="url(#curve-gradient)"
                strokeWidth="2.5"
                filter="url(#curve-glow)"
              />
            </g>
          )}

          {/* Interactive Handle 1 (Sky Blue) */}
          <g
            className="cursor-pointer group"
            onPointerDown={(e) => handlePointerDown('p1', e)}
            onPointerEnter={() => setHoveredHandle('p1')}
            onPointerLeave={() => setHoveredHandle(null)}
          >
            <circle
              cx={svgP1.x}
              cy={svgP1.y}
              r="24"
              fill="transparent"
            />
              <circle
                cx={svgP1.x}
                cy={svgP1.y}
                r="10"
                fill="var(--accent)"
                stroke="#ffffff"
                strokeWidth="2.5"
                filter={activeHandle === 'p1' ? 'url(#glow-p1)' : ''}
                className="transition-[r] duration-150 group-hover:r-[12] active:r-[10]"
              />
            <circle
              cx={svgP1.x}
              cy={svgP1.y}
              r="16"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              className="opacity-0 group-hover:opacity-60 transition-opacity duration-150"
            />
          </g>

          {/* Interactive Handle 2 (Pink) */}
          <g
            className="cursor-pointer group"
            onPointerDown={(e) => handlePointerDown('p2', e)}
            onPointerEnter={() => setHoveredHandle('p2')}
            onPointerLeave={() => setHoveredHandle(null)}
          >
            <circle
              cx={svgP2.x}
              cy={svgP2.y}
              r="24"
              fill="transparent"
            />
            <circle
              cx={svgP2.x}
              cy={svgP2.y}
              r="10"
              fill="var(--accent-secondary)"
              stroke="#ffffff"
              strokeWidth="2.5"
              filter={activeHandle === 'p2' ? 'url(#glow-p2)' : ''}
              className="transition-[r] duration-150 group-hover:r-[12] active:r-[10]"
            />
            <circle
              cx={svgP2.x}
              cy={svgP2.y}
              r="16"
              fill="none"
              stroke="#f472b6"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              className="opacity-0 group-hover:opacity-60 transition-opacity duration-150"
            />
          </g>

          {/* Interactive Tooltip / Badge for Handle 1 */}
          {(activeHandle === 'p1' || hoveredHandle === 'p1') && (
            <g pointerEvents="none" className="transition-opacity duration-150">
              <rect
                x={svgP1.x - 38}
                y={svgP1.y - 36}
                width="76"
                height="21"
                rx="6"
                fill={isLight ? '#f8fafc' : '#09090c'}
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.95"
              />
              <text
                x={svgP1.x}
                y={svgP1.y - 22}
                fill="#38bdf8"
                fontSize="10"
                fontFamily="var(--mono)"
                fontWeight="bold"
                textAnchor="middle"
              >
                {x1.toFixed(2)}, {y1.toFixed(2)}
              </text>
            </g>
          )}

          {/* Interactive Tooltip / Badge for Handle 2 */}
          {(activeHandle === 'p2' || hoveredHandle === 'p2') && (
            <g pointerEvents="none" className="transition-opacity duration-150">
              <rect
                x={svgP2.x - 38}
                y={svgP2.y - 36}
                width="76"
                height="21"
                rx="6"
                fill={isLight ? '#f8fafc' : '#09090c'}
                stroke="#f472b6"
                strokeWidth="1.5"
                opacity="0.95"
              />
              <text
                x={svgP2.x}
                y={svgP2.y - 22}
                fill="#f472b6"
                fontSize="10"
                fontFamily="var(--mono)"
                fontWeight="bold"
                textAnchor="middle"
              >
                {x2.toFixed(2)}, {y2.toFixed(2)}
              </text>
            </g>
          )}
        </svg>

        {/* Labels for coordinates */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/5 text-xs text-gray-400 font-mono font-bold select-text z-10">
          <div>
            <span className="text-sky-400">P1</span>({x1.toFixed(2)}, {y1.toFixed(2)})
          </div>
          <div>
            <span className="text-pink-400">P2</span>({x2.toFixed(2)}, {y2.toFixed(2)})
          </div>
        </div>
      </div>
    </div>
  );
}
