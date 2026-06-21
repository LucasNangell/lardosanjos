'use client';

import {
  Button,
  Input,
  Textarea,
  Card,
  CardTitle,
  CardContent,
  Badge,
  Alert,
  Skeleton,
  DonationPlanCard,
  StatCard,
  PublicHeader,
  PublicFooter,
} from '@lardosanjos/ui';

export default function UiPlaygroundPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-4xl flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl font-bold">Design System — Playground</h1>
        <p className="mt-2 text-brand-text/70">Componentes base do Lar dos Anjos Pet (Fase 4)</p>

        <section className="mt-8 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Botões</h2>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Loading</Button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Input label="Nome" placeholder="Seu nome" />
          <Textarea label="Mensagem" placeholder="Opcional" />
        </section>

        <section className="mt-8 flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </section>

        <Alert className="mt-8">Alerta informativo padrão</Alert>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <StatCard label="Doadores" value="128" hint="Confirmados" />
          <DonationPlanCard
            name="Anjo Cuidado"
            value={39.9}
            description="Cuidados veterinários"
            impactText="Vacina 1 pet"
            featured
          />
        </div>

        <Card className="mt-8">
          <CardTitle>Card</CardTitle>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
