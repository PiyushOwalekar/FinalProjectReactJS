import { useState } from 'react';
import CurveGraph from './components/CurveGraph';
import CurveInspector from './components/CurveInspector';
import StatsGraph from './components/StatsGraph';
import MotionControls from './components/MotionControls';
import AnimationPreview from './components/AnimationPreview';
import ExportPanel from './components/ExportPanel';

// Helper to parse query parameter for coordinates
const getInitialCoordinates = () => {
  const defaultCoords = { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 }; // Ease (Default)

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const curveParam = params.get('curve');
    if (curveParam) {
      const parts = curveParam.split(',').map(Number);
      if (parts.length === 4 && parts.every((val) => !isNaN(val))) {
        // Clamp time anchors in [0, 1] as required by specifications
        const cx1 = Math.max(0, Math.min(1, parts[0]));
        const cy1 = parts[1];
        const cx2 = Math.max(0, Math.min(1, parts[2]));
        const cy2 = parts[3];
        return { x1: cx1, y1: cy1, x2: cx2, y2: cy2 };
      }
    }
  }
  return defaultCoords;
};

export default function App() {
  const [coordinates, setCoordinates] = useState(getInitialCoordinates);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(1.5);
  const [autoLoop, setAutoLoop] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [exportTab, setExportTab] = useState('css');

  // Force a single dark theme; light mode removed
  const themeMode = 'dark';

  const { x1, y1, x2, y2 } = coordinates;
  const [currentT, setCurrentT] = useState(0);

  // Sync state back to the URL query string
  const handleCoordsChange = (newCoords) => {
    // Format coordinate decimals to avoid excessively long URL strings
    const cx1 = parseFloat(newCoords.x1.toFixed(3));
    const cy1 = parseFloat(newCoords.y1.toFixed(3));
    const cx2 = parseFloat(newCoords.x2.toFixed(3));
    const cy2 = parseFloat(newCoords.y2.toFixed(3));

    setCoordinates({ x1: cx1, y1: cy1, x2: cx2, y2: cy2 });

    // Update browser URL query string without reloading page
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('curve', `${cx1},${cy1},${cx2},${cy2}`);
    const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
    window.history.replaceState(null, '', newRelativePathQuery);
  };

  return (
    <div className="container font-sans flex flex-col gap-5" role="application" aria-labelledby="app-title">
      {/* 1. Header with metadata, title and theme toggle */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4 mb-3 border-b border-white/5 pb-4" role="banner">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-xs font-bold border border-sky-500/20 font-mono">
              V1.0 Stable
            </span>
            <span className="text-xs text-gray-500 font-mono">GPU-Accelerated Rendering</span>
          </div>
          <h1 id="app-title" className="text-3xl sm:text-4xl font-bold tracking-tight text-white m-0 text-glow">
            Cubic-Bezier Motion Sandbox
          </h1>
          <p className="text-sm text-gray-400 max-w-[650px] m-0">
            Design custom easing curves, analyze velocity curves, and test them live. Drag handles <span className="text-sky-400 font-semibold">P1 (sky blue)</span> and <span className="text-pink-400 font-semibold">P2 (pink)</span>. Time coordinates are constrained in <code className="text-xs">[0, 1]</code>; progression values support unbounded overshooting elastic bounces.
          </p>
        </div>

        {/* Theme fixed to dark */}
      </header>

      {/* 2. Main Dashboard Interface Layout */}
      <main className="dashboard-grid" role="main">
        {/* Left Column: Curve Editor and Velocity Graph */}
        <section id="left-column" className="flex flex-col gap-4">
          <CurveGraph
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            onChange={handleCoordsChange}
            isPlaying={isPlaying}
            duration={duration}
            themeMode={themeMode}
            snapToGrid={snapToGrid}
            currentT={currentT}
            onTChange={setCurrentT}
          />

          <CurveInspector
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            currentT={currentT}
            onTChange={setCurrentT}
          />

          <StatsGraph
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            themeMode={themeMode}
          />
        </section>

        {/* Right Column: Simulator, Controls, Presets, Export */}
        <section id="right-column" className="flex flex-col gap-5">
          <AnimationPreview
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            duration={duration}
            setDuration={setDuration}
            autoLoop={autoLoop}
            setAutoLoop={setAutoLoop}
          />

          <MotionControls
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            onChange={handleCoordsChange}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
          />

          <ExportPanel
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            activeTab={exportTab}
            setActiveTab={setExportTab}
          />
        </section>
      </main>

      {/* 3. Footer */}
      <footer className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-600 gap-3 font-mono">
        <div>
          Cubic-Bezier Easing Math: <code>S(t) = 3(1-t)²t P₁ + 3(1-t)t² P₂ + t³</code>
        </div>
        <div>
          ReactJS & GPU CSS Easing Sandbox
        </div>
      </footer>
    </div>
  );
}
