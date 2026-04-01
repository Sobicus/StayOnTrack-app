'use client';

import { useRef, useState } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { ShareCard, type ShareCardData } from './share-card';
import { useShareCard } from '@/hooks/use-share-card';
import { useTranslations } from 'next-intl';

interface ShareButtonProps {
  data: ShareCardData;
  filename?: string;
  /** small = icon only, default = icon + label */
  size?: 'sm' | 'default';
  className?: string;
}

export function ShareButton({ data, filename, size = 'default', className = '' }: ShareButtonProps) {
  const t = useTranslations('common');
  const { cardRef, share, sharing } = useShareCard();
  const [preview, setPreview] = useState(false);

  const handleShare = async () => {
    // On mobile with Web Share API → share directly
    if ('share' in navigator) {
      await share(data, filename);
      return;
    }
    // Desktop → show preview modal first
    setPreview(true);
  };

  return (
    <>
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium
          hover:bg-primary/20 transition-colors disabled:opacity-50 ${className}`}
      >
        <Share2 className="w-4 h-4" />
        {size !== 'sm' && <span>{sharing ? t('sharing') : t('share')}</span>}
      </button>

      {/* Preview modal (desktop) */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="relative flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setPreview(false)}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center z-10"
            >
              <X className="w-3.5 h-3.5 text-[var(--muted)]" />
            </button>

            {/* Card preview — scaled to fit screen */}
            <div style={{ transform: 'scale(0.6)', transformOrigin: 'top center', marginBottom: -216 }}>
              <ShareCard data={data} cardRef={cardRef} />
            </div>

            {/* Download button */}
            <button
              onClick={() => { share(data, filename); setPreview(false); }}
              disabled={sharing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {t('downloadPng')}
            </button>
          </div>
        </div>
      )}

      {/* Hidden card for mobile share (always in DOM when needed) */}
      {!preview && (
        <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none' }}>
          <ShareCard data={data} cardRef={cardRef} />
        </div>
      )}
    </>
  );
}
