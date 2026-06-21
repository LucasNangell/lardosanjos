import type { Metadata } from 'next';

export const SITE_NAME = 'Lar dos Anjos Pet';
export const SITE_DESCRIPTION =
  'ONG de resgate e adoção de animais em Brasília. Doe via Pix direto, assine mensalmente ou apoie campanhas com total transparência.';

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    'https://lardosanjos.online'
  ).replace(/\/$/, '');
}

export function absoluteUrl(path = '/') {
  const base = getSiteUrl();
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl('/icons/icon-512.png');

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{ url: ogImage, width: 512, height: 512, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NGO',
  name: SITE_NAME,
  url: getSiteUrl(),
  description: SITE_DESCRIPTION,
  areaServed: {
    '@type': 'City',
    name: 'Brasília',
    containedInPlace: { '@type': 'State', name: 'Distrito Federal' },
  },
  sameAs: [],
};

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
