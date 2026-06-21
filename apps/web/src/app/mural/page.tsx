import Link from 'next/link';
import { fetchApi, MuralEntry } from '@/lib/api';

export const metadata = {
  title: 'Mural dos Anjos — Lar dos Anjos Pet',
  description: 'Agradecemos a cada anjo que apoia nossa causa com consentimento e respeito.',
};

type MuralEntryExtended = MuralEntry & {
  badges?: Array<{ id: string; name: string; icon: string | null }>;
  impactMonths?: number | null;
};

async function getMural(sort: 'recent' | 'impact'): Promise<MuralEntryExtended[]> {
  try {
    return await fetchApi<MuralEntryExtended[]>(`/public/mural?sort=${sort}&limit=50`);
  } catch {
    return [];
  }
}

export default async function MuralPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort = searchParams.sort === 'impact' ? 'impact' : 'recent';
  const entries = await getMural(sort);

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ color: '#2AA98C', textDecoration: 'none' }}>
        ← Início
      </Link>
      <h1 style={{ color: '#6A4F36', marginTop: '1rem' }}>Mural dos Anjos</h1>
      <p style={{ color: '#555', marginBottom: '1rem', lineHeight: 1.6 }}>
        Apoiadores que consentiram aparecer publicamente. Valores não são exibidos — o
        reconhecimento é pelo tempo de apoio e pela generosidade, não por ranking de valores.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link
          href="/mural?sort=recent"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            background: sort === 'recent' ? '#2AA98C' : '#eee',
            color: sort === 'recent' ? '#fff' : '#333',
            textDecoration: 'none',
          }}
        >
          Mais recentes
        </Link>
        <Link
          href="/mural?sort=impact"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            background: sort === 'impact' ? '#2AA98C' : '#eee',
            color: sort === 'impact' ? '#fff' : '#333',
            textDecoration: 'none',
          }}
        >
          Tempo de apoio
        </Link>
      </div>

      {entries.length === 0 ? (
        <p>Seja o primeiro anjo no nosso mural!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
          {entries.map((entry) => (
            <li
              key={entry.id}
              style={{
                background: '#fff',
                border: '1px solid #7BBAA9',
                borderRadius: 12,
                padding: '1rem 1.25rem',
              }}
            >
              <strong style={{ color: '#6A4F36' }}>{entry.displayName}</strong>
              {entry.impactMonths ? (
                <span style={{ color: '#777', marginLeft: 8, fontSize: '0.85rem' }}>
                  · {entry.impactMonths} {entry.impactMonths === 1 ? 'mês' : 'meses'} de apoio
                </span>
              ) : null}
              {entry.planName && (
                <span style={{ color: '#2AA98C', marginLeft: '0.5rem' }}>
                  · {entry.planName}
                </span>
              )}
              {entry.badges && entry.badges.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {entry.badges.map((badge) => (
                    <span
                      key={badge.id}
                      style={{
                        background: '#f0faf7',
                        color: '#2AA98C',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                      }}
                    >
                      {badge.name}
                    </span>
                  ))}
                </div>
              )}
              {entry.message && (
                <p style={{ margin: '0.5rem 0 0', fontStyle: 'italic', color: '#555' }}>
                  &ldquo;{entry.message}&rdquo;
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
