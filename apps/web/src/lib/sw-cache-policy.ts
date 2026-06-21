/** Rotas e padrões que nunca devem ser cacheados pelo service worker. */
const PRIVATE_PATH_PREFIXES = ['/dashboard', '/entrar', '/anjo/validar'];
const PRIVATE_PATH_EXACT = new Set(['/doacao/sucesso', '/doacao/pendente', '/doacao/falha']);

export function shouldBypassServiceWorkerCache(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    if (parsed.pathname.startsWith('/api') || parsed.pathname.startsWith('/_next/data')) {
      return true;
    }

    if (parsed.searchParams.has('_rsc') || parsed.searchParams.has('token')) {
      return true;
    }

    if (PRIVATE_PATH_EXACT.has(path)) return true;

    return PRIVATE_PATH_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
  } catch {
    return true;
  }
}

export function isStaticAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/') ||
    pathname === '/offline.html'
  );
}
