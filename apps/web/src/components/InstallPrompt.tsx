'use client';

import * as React from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        background: '#fff',
        border: '1px solid #7BBAA9',
        borderRadius: '0.5rem',
        padding: '1rem',
        maxWidth: '280px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        zIndex: 9998,
      }}
    >
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#263238' }}>
        Instale o app Lar dos Anjos para acesso rápido às doações!
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={install}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: '#2AA98C',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
          }}
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            padding: '0.5rem',
            background: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
