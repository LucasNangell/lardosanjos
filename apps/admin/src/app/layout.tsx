import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel Administrativo — Lar dos Anjos Pet',
  description: 'Painel administrativo para gestão e auditoria do Lar dos Anjos Pet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'sans-serif', backgroundColor: '#F7FBF9', color: '#263238' }}>
        {children}
      </body>
    </html>
  );
}
