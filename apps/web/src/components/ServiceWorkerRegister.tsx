'use client';

import * as React from 'react';

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration optional in dev
      });
    }
  }, []);

  return null;
}
