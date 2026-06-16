import React from 'react';

export default function ExportPanel({ x1, y1, x2, y2, activeTab, setActiveTab }) {
  const bezierStr = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;

  const tabs = [
    { id: 'css', label: 'CSS' },
    { id: 'tailwind', label: 'Tailwind' },
    { id: 'framer', label: 'Framer Motion' },
    { id: 'gsap', label: 'GSAP' },
  ];

  const getCode = () => {
    switch (activeTab) {
      case 'css':
        return `transition: all 1.5s ${bezierStr};`;
      case 'tailwind':
        return `ease-[${bezierStr.replace(/\s+/g, '')}] duration-[1500ms]`;
      case 'framer':
        return `transition={{\n  ease: [${x1}, ${y1}, ${x2}, ${y2}],\n  duration: 1.5\n}}`;
      case 'gsap':
        return `gsap.to(element, {\n  duration: 1.5,\n  ease: \"cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})\"\n});`;
      default:
        return bezierStr;
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getCode());
      // small visual feedback could be added later
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const downloadJSON = () => {
    const data = { x1, y1, x2, y2 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bezier-curve.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-card shadow-lg glass-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Export</h3>
          <div className="text-xs text-gray-500">Ready for production</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copy} className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-gray-200 hover:bg-white/10 transition">Copy</button>
          <button onClick={downloadJSON} className="px-3 py-1 rounded bg-gradient-to-r from-sky-500 to-pink-500 text-xs font-semibold text-white">Download JSON</button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-3 mb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1 rounded-t-md text-xs font-mono ${activeTab === t.id ? 'bg-surface-hover text-white border border-white/5' : 'text-gray-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--code-bg)] rounded-md p-3 font-mono text-sm text-gray-100 overflow-auto" style={{ minHeight: 88 }}>
        <pre className="whitespace-pre-wrap">{getCode()}</pre>
      </div>
    </div>
  );
}
