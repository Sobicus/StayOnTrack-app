'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Lazy-load the heavy emoji-mart picker — excluded from initial bundle
const Picker = dynamic(() => import('@emoji-mart/react'), {
  ssr: false,
  loading: () => (
    <div className="w-[352px] h-[435px] rounded-2xl bg-[var(--card)] border border-[var(--border)]" />
  ),
});

interface EmojiPickerButtonProps {
  value: string;
  onChange: (emoji: string) => void;
  /** Size of the trigger button in px (default 44) */
  size?: number;
}

export function EmojiPickerButton({ value, onChange, size = 44 }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [emojiData, setEmojiData] = useState<unknown>(null);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect current color scheme for the picker theme
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains('dark') ||
        !!document.documentElement.getAttribute('data-color-theme'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-color-theme'] });
    return () => observer.disconnect();
  }, []);

  // Lazy-load emoji data only when picker is opened the first time
  useEffect(() => {
    if (open && !emojiData) {
      import('@emoji-mart/data').then((mod) => setEmojiData(mod.default ?? mod));
    }
  }, [open, emojiData]);

  // Close on outside click
  const handleOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, handleOutside]);

  const handleEmojiSelect = (emojiObj: { native?: string }) => {
    if (emojiObj.native) {
      onChange(emojiObj.native);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-center rounded-xl transition-all text-2xl select-none
          bg-[var(--background)] border border-[var(--border)]
          hover:bg-primary/10 hover:border-primary/40
          ${open ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/30' : ''}`}
        style={{ width: size, height: size }}
        aria-label="Pick emoji"
        title="Pick emoji"
      >
        {value}
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute z-50 mt-2"
          style={{ top: '100%', left: 0 }}
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)]">
            {emojiData ? (
              <Picker
                data={emojiData}
                onEmojiSelect={handleEmojiSelect}
                theme={isDark ? 'dark' : 'light'}
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={1}
                perLine={9}
                set="native"
              />
            ) : (
              <div className="w-[352px] h-[435px] bg-[var(--card)] flex items-center justify-center">
                <span className="text-[var(--muted)] text-sm">Loading…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
