import { useEffect } from 'react';

export default function Toast({ message, open, onClose, tone = 'info' }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose && onClose(), 1800);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const toneBg = tone === 'success' ? 'rgba(16,185,129,0.12)' : tone === 'danger' ? 'rgba(248,113,113,0.08)' : 'rgba(6,182,212,0.06)';

  return (
    <div aria-live="polite" aria-atomic="true" className="fixed right-4 bottom-6 z-50">
      <div style={{background: toneBg}} className="px-4 py-2 rounded-lg border border-white/6 shadow-md text-sm text-[var(--text-h)] font-medium">
        {message}
      </div>
    </div>
  );
}
