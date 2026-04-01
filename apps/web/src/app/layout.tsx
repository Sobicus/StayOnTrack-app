import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';
import { ClientProviders } from '@/components/common/client-providers';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366F1',
};

export const metadata: Metadata = {
  title: {
    default: 'StayOnTrack — Track What You Avoided',
    template: '%s | StayOnTrack',
  },
  description: 'Track what you avoided, not what you consumed. See saved calories, money, and potential weight avoided — all in real time.',
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4801'),
  openGraph: {
    type: 'website',
    siteName: 'StayOnTrack',
    title: 'StayOnTrack — Track What You Avoided',
    description: 'Track what you avoided, not what you consumed. See saved calories, money, and potential weight avoided — all in real time.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'StayOnTrack — Track What You Avoided',
    description: 'Track what you avoided, not what you consumed.',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StayOnTrack',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Restore color theme instantly to avoid flash of default colors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var ct=localStorage.getItem('color-theme');
  if(ct&&ct!=='system'){
    document.documentElement.setAttribute('data-color-theme',ct);
    var ak='color-theme-'+ct+'-accent';
    var acc=localStorage.getItem(ak);
    if(acc)document.documentElement.style.setProperty('--accent-color',acc);
  } else {
    var ac=localStorage.getItem('accent-theme');
    var map={'default':'#3b82f6','emerald':'#10b981','amber':'#f59e0b','rose':'#f43f5e','violet':'#8b5cf6','crimson':'#dc2626'};
    if(ac&&map[ac])document.documentElement.style.setProperty('--accent-color',map[ac]);
  }
}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.className} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <ToastProvider>
                <ServiceWorkerRegister />
                <ClientProviders>
                  {children}
                </ClientProviders>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
