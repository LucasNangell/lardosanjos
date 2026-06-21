import Link from 'next/link';
import {
  PublicHeader,
  PublicFooter,
  Button,
  StatCard,
  DonationPlanCard,
} from '@lardosanjos/ui';
import { fetchApi, Animal, Campaign, MuralEntry } from '@/lib/api';
import type { DonationPlan } from '@/lib/subscription-donation';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Lar dos Anjos Pet — Doe e transforme vidas',
  description:
    'Ajude animais resgatados em Brasília. Doação única via Pix direto, assinatura mensal ou campanhas com transparência total.',
  path: '/',
});

export const revalidate = 300;

async function getHomeData() {
  const [plans, animals, campaigns, mural, transparency] = await Promise.all([
    fetchApi<DonationPlan[]>('/public/plans').catch(() => []),
    fetchApi<Animal[]>('/public/animals?status=Disponível para adoção').catch(() => []),
    fetchApi<Campaign[]>('/public/campaigns?status=ACTIVE').catch(() => []),
    fetchApi<MuralEntry[]>('/public/mural?sort=recent&limit=5').catch(() => []),
    fetchApi<{
      month_income: number;
      month_expense: number;
      goal_progress_percent: number;
      active_donors: number;
    }>('/public/transparency').catch(() => null),
  ]);

  return {
    plans: plans.slice(0, 3).map((p) => ({ ...p, value: Number(p.value) })),
    animals: animals.slice(0, 3),
    campaigns: campaigns.slice(0, 3),
    mural,
    transparency,
  };
}

export default async function HomePage() {
  const { plans, animals, campaigns, mural, transparency } = await getHomeData();

  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-brand-primary-light/40 to-brand-bg px-4 py-16 text-center">
          <h1 className="font-heading mx-auto max-w-3xl text-4xl font-bold text-brand-brown md:text-5xl">
            Cada doação transforma a vida de um anjo de quatro patas
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-text/80">
            O Lar dos Anjos Pet acolhe, trata e prepara animais resgatados em Brasília para uma
            nova família. Sua contribuição financia ração, veterinário e cuidado diário — com
            total transparência.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/doar-unica">
              <Button size="lg">Doar agora</Button>
            </Link>
            <Link href="/seja-um-anjo">
              <Button size="lg" variant="outline">
                Seja um Anjo mensal
              </Button>
            </Link>
          </div>
        </section>

        {transparency && (
          <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-4">
            <StatCard
              label="Receita do mês"
              value={`R$ ${transparency.month_income.toFixed(0)}`}
              hint="Somente valores confirmados"
            />
            <StatCard
              label="Meta mensal"
              value={`${transparency.goal_progress_percent.toFixed(0)}%`}
              hint="Progresso da arrecadação"
            />
            <StatCard
              label="Anjos ativos"
              value={String(transparency.active_donors)}
              hint="Doadores recorrentes"
            />
            <StatCard label="Pix direto" value="Sem taxas" hint="Doação única ao abrigo" />
          </section>
        )}

        {plans.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-brand-brown">Planos mensais</h2>
                <p className="mt-1 text-sm text-brand-text/70">
                  Assinaturas via cartão ou boleto (Asaas). Cancele quando quiser.
                </p>
              </div>
              <Link href="/seja-um-anjo" className="text-sm font-medium text-brand-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <DonationPlanCard
                  key={plan.id}
                  name={plan.name}
                  value={plan.value}
                  description={plan.description ?? undefined}
                  impactText={plan.impactText ?? undefined}
                  featured={plan.isFeatured}
                />
              ))}
            </div>
          </section>
        )}

        <section className="bg-brand-brown/5 px-4 py-12">
          <div className="mx-auto max-w-6xl rounded-2xl border border-brand-primary-light bg-white p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-brown">Doação única</h2>
              <p className="mt-2 max-w-xl text-brand-text/70">
                Pix gerado internamente pelo abrigo (sem Asaas), cartão ou boleto. Escolha o valor
                e apoie agora.
              </p>
            </div>
            <Link href="/doar-unica" className="mt-6 block shrink-0 md:mt-0">
              <Button size="lg">Fazer doação única</Button>
            </Link>
          </div>
        </section>

        {animals.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-heading text-2xl font-bold text-brand-brown">Histórias de esperança</h2>
              <Link href="/animais" className="text-sm font-medium text-brand-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {animals.map((animal) => (
                <Link
                  key={animal.id}
                  href={`/animais/${animal.id}`}
                  className="overflow-hidden rounded-2xl border border-brand-primary-light bg-white shadow-sm transition hover:shadow-md focus-ring"
                >
                  {animal.coverImageUrl && (
                    <div
                      className="aspect-[4/3] bg-brand-primary-light/30 bg-cover bg-center"
                      style={{ backgroundImage: `url(${animal.coverImageUrl})` }}
                      role="img"
                      aria-label={animal.name}
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-brand-brown">{animal.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-brand-text/70">{animal.story}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {campaigns.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-heading text-2xl font-bold text-brand-brown">Campanhas ativas</h2>
              <Link href="/campanhas" className="text-sm font-medium text-brand-primary hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {campaigns.map((c) => (
                <Link
                  key={c.id}
                  href={`/campanhas/${c.slug}`}
                  className="rounded-2xl border border-brand-primary-light bg-white p-5 shadow-sm transition hover:shadow-md focus-ring"
                >
                  <h3 className="font-heading font-semibold text-brand-primary">{c.title}</h3>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-primary-light/50">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${Math.min(c.progressPercent, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-brand-text/60">
                    {c.progressPercent}% da meta · R$ {c.raisedAmount.toFixed(0)} arrecadados
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {mural.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-heading text-2xl font-bold text-brand-brown">Mural dos Anjos</h2>
              <Link href="/mural" className="text-sm font-medium text-brand-primary hover:underline">
                Ver mural →
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mural.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-brand-primary-light bg-white px-4 py-3 text-sm"
                >
                  <strong className="text-brand-brown">{entry.displayName}</strong>
                  {entry.impactMonths ? (
                    <span className="text-brand-text/60"> · {entry.impactMonths} meses de apoio</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-brand-primary px-4 py-14 text-center text-white">
          <h2 className="font-heading text-3xl font-bold">Pronto para fazer a diferença?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Cada real vira cuidado, cada anjo ganha uma chance. Doe, apadrinhe ou compartilhe nossa
            causa.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/doar-unica">
              <Button size="lg" variant="accent">
                Doar agora
              </Button>
            </Link>
            <Link href="/sobre">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Conheça o abrigo
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
