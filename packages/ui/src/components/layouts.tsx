'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '../components/button';
import { cn } from '../lib/utils';

export function PublicHeader() {
  const [open, setOpen] = React.useState(false);

  const links = [
    { href: '/sobre', label: 'Sobre' },
    { href: '/animais', label: 'Animais' },
    { href: '/campanhas', label: 'Campanhas' },
    { href: '/transparencia', label: 'Transparência' },
    { href: '/mural', label: 'Mural' },
    { href: '/faq', label: 'FAQ' },
    { href: '/seja-um-anjo', label: 'Seja um Anjo' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-brand-primary-light bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-heading text-xl font-bold text-brand-primary focus-ring rounded">
          Lar dos Anjos Pet
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-brand-brown hover:text-brand-primary focus-ring rounded">
              {l.label}
            </Link>
          ))}
          <Link href="/doar-unica">
            <Button size="sm">Doar agora</Button>
          </Link>
          <Link href="/entrar" className="text-sm font-medium text-brand-brown hover:text-brand-primary focus-ring rounded">
            Minha área
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden focus-ring rounded p-2"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <span className="block h-0.5 w-6 bg-brand-brown" />
          <span className="mt-1.5 block h-0.5 w-6 bg-brand-brown" />
          <span className="mt-1.5 block h-0.5 w-6 bg-brand-brown" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-brand-primary-light px-4 py-4 md:hidden" aria-label="Mobile">
          <ul className="space-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block text-brand-brown" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/doar-unica" onClick={() => setOpen(false)}>
                <Button className="w-full">Doar agora</Button>
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="block text-brand-brown" onClick={() => setOpen(false)}>
                Minha área
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-brand-primary-light bg-brand-brown text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-lg font-semibold">Lar dos Anjos Pet</p>
          <p className="mt-2 text-sm text-white/80">
            Abrigo de animais em Brasília. Transparência, cuidado e amor em cada doação.
          </p>
        </div>
        <div>
          <p className="font-semibold">Institucional</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li><Link href="/sobre" className="hover:text-white focus-ring rounded">Sobre</Link></li>
            <li><Link href="/voluntariado" className="hover:text-white focus-ring rounded">Voluntariado</Link></li>
            <li><Link href="/contato" className="hover:text-white focus-ring rounded">Contato</Link></li>
            <li><Link href="/faq" className="hover:text-white focus-ring rounded">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Legal</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li><Link href="/transparencia" className="hover:text-white focus-ring rounded">Transparência</Link></li>
            <li><Link href="/politica-de-privacidade" className="hover:text-white focus-ring rounded">Privacidade</Link></li>
            <li><Link href="/termos-de-uso" className="hover:text-white focus-ring rounded">Termos de Uso</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Doar</p>
          <p className="mt-2 text-sm text-white/80">
            Pix direto ao abrigo ou assinatura mensal via cartão.
          </p>
          <Link href="/doar-unica" className="mt-3 inline-block">
            <Button variant="accent" size="sm">Fazer doação</Button>
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Lar dos Anjos Pet. Todos os direitos reservados.
      </div>
    </footer>
  );
}

export function DonationPlanCard({
  name,
  value,
  description,
  impactText,
  featured,
  onSelect,
}: {
  name: string;
  value: number;
  description?: string;
  impactText?: string;
  featured?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md',
        featured ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-brand-primary-light',
      )}
    >
      {featured && <span className="text-xs font-semibold uppercase text-brand-primary">Destaque</span>}
      <h3 className="font-heading mt-1 text-xl font-bold text-brand-brown">{name}</h3>
      <p className="mt-2 text-2xl font-bold text-brand-primary">
        R$ {value.toFixed(2).replace('.', ',')}
        <span className="text-sm font-normal text-brand-text/60">/mês</span>
      </p>
      {description && <p className="mt-2 text-sm text-brand-text/80">{description}</p>}
      {impactText && (
        <p className="mt-3 rounded-lg bg-brand-primary-light/50 px-3 py-2 text-sm text-brand-brown">
          {impactText}
        </p>
      )}
      {onSelect && (
        <Button className="mt-4 w-full" onClick={onSelect}>
          Escolher plano
        </Button>
      )}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-brand-primary-light bg-white p-5 shadow-sm">
      <p className="text-sm text-brand-text/70">{label}</p>
      <p className="font-heading mt-1 text-2xl font-bold text-brand-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-brand-text/50">{hint}</p>}
    </div>
  );
}
