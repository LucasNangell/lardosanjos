'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '../lib/utils';

export function AdminShell({
  children,
  userName,
  onLogout,
  navItems,
}: {
  children: React.ReactNode;
  userName?: string;
  onLogout?: () => void;
  navItems?: { href: string; label: string }[];
}) {
  const defaultNav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/financeiro/pix-confirm', label: 'Pix' },
    { href: '/financeiro/despesas', label: 'Despesas' },
    { href: '/configuracoes/pix', label: 'Config. Pix' },
    { href: '/animais', label: 'Animais' },
    { href: '/campanhas', label: 'Campanhas' },
  ];
  const items = navItems || defaultNav;

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <aside className="hidden w-64 flex-shrink-0 border-r border-brand-primary-light bg-white md:block">
        <div className="border-b border-brand-primary-light p-4">
          <p className="font-heading font-bold text-brand-primary">Admin</p>
          <p className="text-xs text-brand-text/60">Lar dos Anjos Pet</p>
        </div>
        <nav className="p-3" aria-label="Admin">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-brand-brown hover:bg-brand-primary-light/50 focus-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-brand-primary-light bg-white px-4 py-3">
          <p className="text-sm text-brand-text/70">Painel administrativo</p>
          <div className="flex items-center gap-3">
            {userName && <span className="text-sm font-medium">{userName}</span>}
            {onLogout && (
              <button type="button" onClick={onLogout} className="text-sm text-brand-primary focus-ring rounded">
                Sair
              </button>
            )}
          </div>
        </header>
        <main className={cn('flex-1 p-4 md:p-6')}>{children}</main>
      </div>
    </div>
  );
}

export function DonorShell({
  children,
  donorName,
}: {
  children: React.ReactNode;
  donorName?: string;
}) {
  const links = [
    { href: '/dashboard', label: 'Visão geral' },
    { href: '/dashboard/assinatura', label: 'Assinatura' },
    { href: '/dashboard/carteirinha', label: 'Carteirinha' },
    { href: '/dashboard/doacoes', label: 'Minhas doações' },
    { href: '/dashboard/meu-impacto', label: 'Meu impacto' },
    { href: '/dashboard/meus-dados', label: 'Meus dados' },
    { href: '/dashboard/privacidade', label: 'Privacidade' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="border-b border-brand-primary-light bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-heading font-bold text-brand-primary">
            Lar dos Anjos
          </Link>
          {donorName && <span className="text-sm">Olá, {donorName}</span>}
        </div>
        <nav className="mx-auto max-w-5xl overflow-x-auto px-4 pb-3" aria-label="Área do doador">
          <ul className="flex gap-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="whitespace-nowrap text-sm font-medium text-brand-brown hover:text-brand-primary focus-ring rounded">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
