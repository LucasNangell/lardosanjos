'use client';

import * as React from 'react';
import { Badge } from '@lardosanjos/ui';
import { DonorCardData } from '@/lib/donor-api';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export const DonorMembershipCard = React.forwardRef<
  HTMLDivElement,
  { card: DonorCardData; compact?: boolean }
>(function DonorMembershipCard({ card, compact = false }, ref) {
  const isActive = card.valid && card.status === 'ACTIVE';

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-brand-primary via-[#6b4fa3] to-brand-brown p-[1px] shadow-xl ${
        compact ? 'max-w-sm' : 'w-full max-w-md'
      }`}
    >
      <div className="relative rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-white/95 via-brand-primary-light/30 to-white/90 p-6 backdrop-blur">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-primary/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-brand-secondary/30 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">
              Lar dos Anjos Pet
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-brand-text/60">
              Carteirinha digital do anjo
            </p>
          </div>
          <Badge variant={isActive ? 'success' : 'default'}>{card.status_label}</Badge>
        </div>

        <div className="relative mt-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-text/50">Nome público</p>
            <p className="font-heading text-xl font-bold text-brand-brown">{card.display_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-text/50">Plano</p>
              <p className="font-medium text-brand-brown">{card.plan_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-text/50">Membro desde</p>
              <p className="font-medium text-brand-brown">{formatDate(card.started_at)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-brand-text/50">Nº de membro</p>
              <p className="font-mono text-sm font-semibold tracking-wider text-brand-primary">
                {card.card_number}
              </p>
            </div>
          </div>

          {card.badges.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-brand-text/50">Selos</p>
              <div className="flex flex-wrap gap-2">
                {card.badges.map((badge) => (
                  <Badge key={badge.id} variant="accent">
                    {badge.icon ? `${badge.icon} ` : ''}
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end justify-between gap-4 border-t border-brand-primary-light/60 pt-4">
            <div className="text-[10px] leading-relaxed text-brand-text/55">
              <p>Validação pública via QR Code.</p>
              <p>Sem exposição de dados sensíveis.</p>
              <p className="mt-1">Emitida em {formatDate(card.issued_at)}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.qr_code_data_url}
              alt="QR Code de validação da carteirinha"
              className="h-24 w-24 rounded-xl border border-brand-primary-light bg-white p-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export function PublicValidationCard({
  displayName,
  planName,
  memberSince,
  statusLabel,
  cardNumber,
  badges,
}: {
  displayName: string;
  planName: string | null;
  memberSince: string;
  statusLabel: string;
  cardNumber: string;
  badges: { name: string; icon: string | null }[];
}) {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-brand-primary-light bg-white shadow-lg">
      <div className="bg-gradient-to-r from-brand-primary to-brand-brown px-6 py-8 text-center text-white">
        <p className="font-heading text-sm uppercase tracking-[0.25em] opacity-90">
          Lar dos Anjos Pet
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold">Validação de carteirinha</h1>
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="rounded-2xl bg-green-50 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-green-800">{statusLabel}</p>
          <p className="text-xs text-green-700">Carteirinha verificada com sucesso</p>
        </div>
        <div>
          <p className="text-xs uppercase text-brand-text/50">Nome público</p>
          <p className="font-heading text-lg font-semibold text-brand-brown">{displayName}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-brand-text/50">Plano</p>
            <p className="font-medium">{planName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-brand-text/50">Membro desde</p>
            <p className="font-medium">{formatDate(memberSince)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase text-brand-text/50">Nº de membro</p>
          <p className="font-mono text-sm font-semibold text-brand-primary">{cardNumber}</p>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge.name} variant="accent">
                {badge.icon ? `${badge.icon} ` : ''}
                {badge.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
