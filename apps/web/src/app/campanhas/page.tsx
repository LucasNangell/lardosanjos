import Link from 'next/link';
import { fetchApi, Campaign } from '@/lib/api';

export const metadata = {
  title: 'Campanhas — Lar dos Anjos Pet',
  description: 'Campanhas de arrecadação para emergências e tratamentos dos nossos animais.',
};

async function getCampaigns(): Promise<Campaign[]> {
  try {
    return await fetchApi<Campaign[]>('/public/campaigns');
  } catch {
    return [];
  }
}

export default async function CampanhasPage() {
  const campaigns = await getCampaigns();

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ color: '#2AA98C', textDecoration: 'none' }}>
        ← Início
      </Link>
      <h1 style={{ color: '#6A4F36', marginTop: '1rem' }}>Campanhas</h1>
      <p style={{ color: '#555', marginBottom: '2rem' }}>
        Ajude em campanhas específicas de tratamento, cirurgia ou resgate.
      </p>

      {campaigns.length === 0 ? (
        <p>Nenhuma campanha ativa no momento.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campanhas/${campaign.slug}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid #e0e0e0',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                background: '#fff',
              }}
            >
              <h2 style={{ margin: '0 0 0.5rem', color: '#6A4F36' }}>{campaign.title}</h2>
              {campaign.animal && (
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#2AA98C' }}>
                  Para: {campaign.animal.name}
                </p>
              )}
              <div style={{ background: '#eee', borderRadius: '999px', height: '8px', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    background: '#2AA98C',
                    height: '100%',
                    borderRadius: '999px',
                    width: `${campaign.progressPercent}%`,
                  }}
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                R$ {campaign.raisedAmount.toFixed(2)} de R$ {campaign.goalAmount.toFixed(2)} ({campaign.progressPercent}%)
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
