'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@lardosanjos/ui';
import { logoutAdmin } from '../lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/configuracoes/pix', label: 'Pix' },
  { href: '/financeiro', label: 'Financeiro' },
  { href: '/financeiro/despesas', label: 'Despesas' },
  { href: '/financeiro/categorias', label: 'Categorias' },
  { href: '/financeiro/relatorios', label: 'Relatórios' },
  { href: '/financeiro/conciliacao-asaas', label: 'Conciliação Asaas' },
  { href: '/financeiro/pix-confirm', label: 'Confirmar Pix' },
  { href: '/financeiro/webhooks', label: 'Webhooks Asaas' },
  { href: '/animais', label: 'Animais' },
  { href: '/campanhas', label: 'Campanhas' },
  { href: '/mural', label: 'Mural' },
  { href: '/selos', label: 'Selos' },
];

export function AdminLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logoutAdmin();
    router.replace('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: '#6A4F36',
          color: '#fff',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <strong>Lar dos Anjos — Admin</strong>
          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{user.name}</div>
        </div>
        <Button onClick={handleLogout} style={{ backgroundColor: '#263238' }}>
          Sair
        </Button>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <nav
          style={{
            width: 220,
            background: '#fff',
            borderRight: '1px solid #e0e0e0',
            padding: '1rem 0',
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '0.75rem 1.5rem',
                color: pathname === item.href ? '#2AA98C' : '#263238',
                fontWeight: pathname === item.href ? 'bold' : 'normal',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
      </div>
    </div>
  );
}
