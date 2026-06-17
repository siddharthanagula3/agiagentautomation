/**
 * DemoModeBanner
 * Shows a persistent banner when the app is running in demo mode (no live Supabase backend).
 */

import { DEMO_MODE } from '@shared/lib/demo-mode';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (!DEMO_MODE || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#1c1917',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      <AlertTriangle size={15} />
      <span>
        🎭 <strong>Demo Mode</strong> — Running locally without a live backend.
        Auth & data are simulated. To restore: create a new Supabase project and
        reconnect.
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1c1917',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
        }}
        aria-label="Dismiss demo mode banner"
      >
        <X size={15} />
      </button>
    </div>
  );
}
