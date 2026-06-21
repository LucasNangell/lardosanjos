'use client';

import * as React from 'react';

const STORAGE_KEY = 'lardosanjos_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = async (analytics: boolean) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, acceptedAt: Date.now() }));
    setVisible(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      await fetch(`${apiUrl}/public/lgpd/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'anonymous@visitor.local',
          analyticsConsent: analytics,
          marketingConsent: false,
        }),
      });
    } catch {
      // consent stored locally even if API unavailable
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#263238',
        color: '#fff',
        padding: '1rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <p style={{ margin: 0, flex: '1 1 280px', fontSize: '0.9rem', lineHeight: 1.5 }}>
        Utilizamos cookies essenciais e, com seu consentimento, cookies analíticos para melhorar
        sua experiência. Consulte nossa{' '}
        <a href="/privacidade" style={{ color: '#7BBAA9' }}>
          Política de Privacidade
        </a>
        .
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => accept(false)}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #7BBAA9',
            color: '#7BBAA9',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Apenas essenciais
        </button>
        <button
          type="button"
          onClick={() => accept(true)}
          style={{
            padding: '0.5rem 1rem',
            background: '#2AA98C',
            border: 'none',
            color: '#fff',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Aceitar todos
        </button>
      </div>
    </div>
  );
}
