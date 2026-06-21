import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { CookieConsent } from '@/components/CookieConsent';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  organizationJsonLd,
  absoluteUrl,
  getSiteUrl,
} from '@/lib/seo';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: '/manifest.json',
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    images: [{ url: absoluteUrl('/icons/icon-512.png'), width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl('/icons/icon-512.png')],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lar dos Anjos',
  },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/icon-192.png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#2AA98C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        {children}
        <CookieConsent />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
