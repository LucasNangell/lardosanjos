import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@lardosanjos/ui';
import { fetchApi, Campaign } from '@/lib/api';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const campaign = await fetchApi<Campaign>(`/public/campaigns/${params.slug}`);
    return {
      title: `${campaign.title} — Lar dos Anjos Pet`,
      description: campaign.description.slice(0, 160),
    };
  } catch {
    return { title: 'Campanha — Lar dos Anjos Pet' };
  }
}

export default async function CampanhaDetailPage({ params }: { params: { slug: string } }) {
  let campaign: Campaign;
  try {
    campaign = await fetchApi<Campaign>(`/public/campaigns/${params.slug}`);
  } catch {
    notFound();
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/campanhas" style={{ color: '#2AA98C', textDecoration: 'none' }}>
        ← Voltar às campanhas
      </Link>

      <h1 style={{ color: '#6A4F36', marginTop: '1rem' }}>{campaign.title}</h1>

      {campaign.coverImageUrl && (
        <img
          src={campaign.coverImageUrl}
          alt={campaign.title}
          style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '0.5rem', margin: '1rem 0' }}
        />
      )}

      <div style={{ background: '#eee', borderRadius: '999px', height: '12px', marginBottom: '0.5rem' }}>
        <div
          style={{
            background: '#2AA98C',
            height: '100%',
            borderRadius: '999px',
            width: `${campaign.progressPercent}%`,
          }}
        />
      </div>
      <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#6A4F36', marginBottom: '1.5rem' }}>
        R$ {campaign.raisedAmount.toFixed(2)} arrecadados de R$ {campaign.goalAmount.toFixed(2)}
      </p>

      <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>{campaign.description}</p>

      <Link href={`/doar-unica?campaign=${campaign.id}`}>
        <Button>Doar para esta campanha</Button>
      </Link>
    </main>
  );
}
