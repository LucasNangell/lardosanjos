import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

const STATIC_ROUTES = [
  '/',
  '/sobre',
  '/voluntariado',
  '/faq',
  '/contato',
  '/animais',
  '/campanhas',
  '/mural',
  '/transparencia',
  '/seja-um-anjo',
  '/doar-unica',
  '/politica-de-privacidade',
  '/termos-de-uso',
  '/privacidade',
  '/termos',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  return STATIC_ROUTES.map((path) => ({
    url: `${base}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path.startsWith('/politica') || path.startsWith('/termos') ? 0.5 : 0.8,
  }));
}
