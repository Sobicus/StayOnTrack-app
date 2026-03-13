'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState('0');
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || value === 0) {
      // Format immediately for zero or if already animated
      setDisplay(formatNumber(value, decimals));
      return;
    }

    hasAnimated.current = true;
    let start: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = easedProgress * value;

      setDisplay(formatNumber(current, decimals));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, duration, decimals]);

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

function formatNumber(num: number, decimals: number): string {
  if (decimals > 0) {
    return num.toFixed(decimals);
  }
  return Math.round(num).toLocaleString();
}
