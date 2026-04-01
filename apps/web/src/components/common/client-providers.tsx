'use client';

import dynamic from 'next/dynamic';

const OfflineBanner = dynamic(
  () => import('@/components/common/offline-banner').then((m) => ({ default: m.OfflineBanner })),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OfflineBanner />
    </>
  );
}
