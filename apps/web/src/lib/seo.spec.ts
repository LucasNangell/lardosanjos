import { shouldBypassServiceWorkerCache, isStaticAssetPath } from './sw-cache-policy';
import { buildPageMetadata, getSiteUrl, faqJsonLd } from './seo';

describe('sw-cache-policy', () => {
  it('bypasses dashboard and login routes', () => {
    expect(shouldBypassServiceWorkerCache('https://lardosanjos.online/dashboard')).toBe(true);
    expect(shouldBypassServiceWorkerCache('https://lardosanjos.online/dashboard/doacoes')).toBe(true);
    expect(shouldBypassServiceWorkerCache('https://lardosanjos.online/entrar')).toBe(true);
  });

  it('bypasses API and RSC requests', () => {
    expect(shouldBypassServiceWorkerCache('https://lardosanjos.online/api/v1/x')).toBe(true);
    expect(shouldBypassServiceWorkerCache('https://lardosanjos.online/?_rsc=abc')).toBe(true);
  });

  it('allows public pages to be cached', () => {
    expect(shouldBypassServiceWorkerCache('https://lardosanjos.online/faq')).toBe(false);
    expect(shouldBypassServiceWorkerCache('https://lardosanjos.online/sobre')).toBe(false);
  });

  it('identifies static assets', () => {
    expect(isStaticAssetPath('/_next/static/chunks/main.js')).toBe(true);
    expect(isStaticAssetPath('/manifest.json')).toBe(true);
    expect(isStaticAssetPath('/dashboard')).toBe(false);
  });
});

describe('seo helpers', () => {
  it('builds metadata with canonical and noindex', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://lardosanjos.online';
    const meta = buildPageMetadata({
      title: 'FAQ',
      description: 'Perguntas frequentes',
      path: '/faq',
    });
    expect(meta.alternates?.canonical).toBe('https://lardosanjos.online/faq');
    expect(meta.openGraph?.url).toBe('https://lardosanjos.online/faq');

    const privateMeta = buildPageMetadata({
      title: 'Sucesso',
      description: 'Ok',
      path: '/doacao/sucesso',
      noIndex: true,
    });
    expect(privateMeta.robots).toEqual({ index: false, follow: false });
  });

  it('generates FAQ JSON-LD', () => {
    const ld = faqJsonLd([{ question: 'Q?', answer: 'A.' }]);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(1);
  });

  it('normalizes site url', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://lardosanjos.online/';
    expect(getSiteUrl()).toBe('https://lardosanjos.online');
  });
});
