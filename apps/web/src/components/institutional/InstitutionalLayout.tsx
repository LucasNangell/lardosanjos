import { PublicHeader, PublicFooter } from '@lardosanjos/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function InstitutionalLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-10">
        <Link href="/" className="text-sm font-medium text-brand-primary hover:underline focus-ring rounded">
          ← Início
        </Link>
        <h1 className="font-heading mt-4 text-3xl font-bold text-brand-brown">{title}</h1>
        {description && (
          <p className="mt-2 text-brand-text/70">{description}</p>
        )}
        <div className="prose-brand mt-8 space-y-6 text-brand-text/90 leading-relaxed">
          {children}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
