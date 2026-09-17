'use client';

import { useEffect, useRef, useState } from 'react';

export default function AppToast() {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleToast = (event) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast(event.detail || null);
      timeoutRef.current = setTimeout(() => setToast(null), 4000);
    };

    window.addEventListener('nihongo-toast', handleToast);
    return () => {
      window.removeEventListener('nihongo-toast', handleToast);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!toast?.message) return null;

  return (
    <div className={`app-toast app-toast-${toast.type || 'info'}`} role="status" aria-live="polite">
      <span aria-hidden="true">{toast.type === 'error' ? '⚠️' : '🌸'}</span>
      <span>{toast.message}</span>
      <button type="button" onClick={() => setToast(null)} aria-label="알림 닫기">✕</button>
    </div>
  );
}
