import Link from 'next/link';
import { fetchApi, Animal, SPECIES_LABELS, SIZE_LABELS } from '@/lib/api';

export const metadata = {
  title: 'Animais para Adoção — Lar dos Anjos Pet',
  description: 'Conheça os animais resgatados pelo Lar dos Anjos Pet em Brasília.',
};

const ANIMAL_STATUS_FILTERS = [
  'Disponível para adoção',
  'Em tratamento',
  'Acolhido',
  'Adotado',
];

async function getAnimals(searchParams: Record<string, string | undefined>): Promise<Animal[]> {
  const params = new URLSearchParams();
  if (searchParams.species) params.set('species', searchParams.species);
  if (searchParams.size) params.set('size', searchParams.size);
  if (searchParams.status) params.set('status', searchParams.status);
  const qs = params.toString();
  try {
    return await fetchApi<Animal[]>(`/public/animals${qs ? `?${qs}` : ''}`);
  } catch {
    return [];
  }
}

export default async function AnimaisPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const animals = await getAnimals(searchParams);

  return (
    <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ color: '#2AA98C', textDecoration: 'none' }}>
        ← Início
      </Link>

      <header style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#6A4F36', marginBottom: '0.5rem', fontFamily: 'var(--font-poppins)' }}>
          Nossos Animais
        </h1>
        <p style={{ color: '#555', maxWidth: 640, lineHeight: 1.6 }}>
          Cada animal tem uma história única de resgate e cuidado. Conheça quem aguarda um lar
          cheio de amor — ou apadrinhe quem ainda precisa de tratamento.
        </p>
      </header>

      <form
        method="GET"
        action="/animais"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2rem',
          background: '#fff',
          padding: '1rem',
          borderRadius: 12,
          border: '1px solid #e8dfd4',
        }}
      >
        <select name="species" defaultValue={searchParams.species || ''} style={{ padding: '0.6rem' }}>
          <option value="">Todas espécies</option>
          <option value="DOG">Cachorros</option>
          <option value="CAT">Gatos</option>
          <option value="OTHER">Outros</option>
        </select>
        <select name="size" defaultValue={searchParams.size || ''} style={{ padding: '0.6rem' }}>
          <option value="">Todos portes</option>
          <option value="SMALL">Pequeno</option>
          <option value="MEDIUM">Médio</option>
          <option value="LARGE">Grande</option>
        </select>
        <select name="status" defaultValue={searchParams.status || ''} style={{ padding: '0.6rem' }}>
          <option value="">Todos status</option>
          {ANIMAL_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          type="submit"
          style={{
            padding: '0.6rem 1rem',
            background: '#2AA98C',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Filtrar
        </button>
      </form>

      {animals.length === 0 ? (
        <p style={{ color: '#666' }}>Nenhum animal encontrado com estes filtros.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {animals.map((animal) => (
            <Link
              key={animal.id}
              href={`/animais/${animal.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid #e8dfd4',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(106,79,54,0.06)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div
                style={{
                  height: 200,
                  background: animal.coverImageUrl
                    ? `url(${animal.coverImageUrl}) center/cover`
                    : 'linear-gradient(135deg, #DEB88F, #f5e6d3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6A4F36',
                  fontSize: '2rem',
                }}
              >
                {!animal.coverImageUrl && '🐾'}
              </div>
              <div style={{ padding: '1rem' }}>
                <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', color: '#6A4F36' }}>
                  {animal.name}
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#777', lineHeight: 1.5 }}>
                  {SPECIES_LABELS[animal.species]} ·{' '}
                  {animal.size ? SIZE_LABELS[animal.size] : '—'} · {animal.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
