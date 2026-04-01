'use client';

import { useRef, useState, useCallback } from 'react';
import type { ShareCardData } from '@/components/share/share-card';

export function useShareCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async (data: ShareCardData, filename?: string) => {
    if (!cardRef.current || sharing) return;
    setSharing(true);

    try {
      // Dynamic import — keeps html-to-image out of the initial bundle
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,          // 2× for retina / 1080px output
        cacheBust: true,
        backgroundColor: undefined,
      });

      const fname = filename ?? 'stayontrack-card.png';

      // Try native Web Share API first (mobile — Instagram, Telegram, etc.)
      if (typeof navigator !== 'undefined' && navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fname, { type: 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'StayOnTrack' });
          return;
        }
      }

      // Desktop fallback: download the PNG
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fname;
      a.click();
    } catch (err) {
      console.error('[ShareCard] failed:', err);
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  return { cardRef, share, sharing };
}
