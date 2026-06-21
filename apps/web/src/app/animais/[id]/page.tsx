import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@lardosanjos/ui';
import { fetchApi, Animal, SPECIES_LABELS, SIZE_LABELS, GENDER_LABELS } from '@/lib/api';
import { AdoptionInterestForm } from '@/components/animals/AdoptionInterestForm';

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const animal = await fetchApi<Animal>(`/public/animals/${params.id}`);
    return {
      title: `${animal.name} — Lar dos Anjos Pet`,
      description: animal.story.slice(0, 160),
    };
  } catch {
    return { title: 'Animal — Lar dos Anjos Pet' };
  }
}

export default async function AnimalDetailPage({ params }: { params: { id: string } }) {
  let animal: Animal;
  try {
    animal = await fetchApi<Animal>(`/public/animals/${params.id}`);
  } catch {
    notFound();
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/animais" style={{ color: '#2AA98C', textDecoration: 'none' }}>
        ← Voltar aos animais
      </Link>

      <article style={{ marginTop: '1rem' }}>
        <h1
          style={{
            color: '#6A4F36',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-poppins)',
          }}
        >
          {animal.name}
        </h1>
        <p style={{ color: '#777', marginBottom: '1.5rem' }}>
          {SPECIES_LABELS[animal.species]} · {GENDER_LABELS[animal.gender]}
          {animal.size ? ` · ${SIZE_LABELS[animal.size]}` : ''}
          {animal.age ? ` · ${animal.age}` : ''} · {animal.status}
        </p>

        {animal.coverImageUrl && (
          <img
            src={animal.coverImageUrl}
            alt={animal.name}
            loading="lazy"
            style={{
              width: '100%',
              maxHeight: '420px',
              objectFit: 'cover',
              borderRadius: 12,
              marginBottom: '1.5rem',
            }}
          />
        )}

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#6A4F36', fontSize: '1.2rem' }}>História</h2>
          <p style={{ lineHeight: 1.75, whiteSpace: 'pre-wrap', color: '#333' }}>
            {animal.story}
          </p>
        </section>

        {animal.needs && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#6A4F36', fontSize: '1.2rem' }}>Necessidades</h2>
            <p style={{ lineHeight: 1.75, color: '#333' }}>{animal.needs}</p>
          </section>
        )}

        {animal.images.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#6A4F36', fontSize: '1.2rem' }}>Galeria</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {animal.images.map((img) =>
                img.url ? (
                  <img
                    key={img.id}
                    src={img.url}
                    alt=""
                    loading="lazy"
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                ) : null,
              )}
            </div>
          </section>
        )}

        <section
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}
        >
          <Link href="/doar-unica">
            <Button>Quero ajudar — Doar</Button>
          </Link>
          <Link href="/seja-um-anjo">
            <Button style={{ backgroundColor: '#6A4F36' }}>
              Doar para animais como {animal.name}
            </Button>
          </Link>
        </section>

        <AdoptionInterestForm animalId={animal.id} animalName={animal.name} />
      </article>
    </main>
  );
}
