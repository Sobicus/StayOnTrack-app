'use client';

import { getFrameById, getFrameWidth } from '@/lib/frames';

interface AvatarFrameProps {
  /** Frame id from FRAMES array. null/undefined = no frame. */
  frameId: string | null | undefined;
  /** Diameter of the avatar in px */
  size?: number;
  /** Avatar image src. If null, shows fallback letter. */
  avatarSrc?: string | null;
  /** Fallback letter (e.g. first char of username) */
  fallback: string;
  className?: string;
}

export function AvatarFrame({
  frameId,
  size = 80,
  avatarSrc,
  fallback,
  className = '',
}: AvatarFrameProps) {
  const frame = getFrameById(frameId);
  const hasFrame = frame.id !== 'none';
  const borderW = hasFrame ? getFrameWidth(frame.tier) : 0;
  const gapW = hasFrame ? 2 : 0;
  const totalSize = size + (borderW + gapW) * 2;

  const innerSize = size;

  // Animation class
  const animClass =
    frame.animation === 'spin'
      ? 'frame-spin'
      : frame.animation === 'pulse'
        ? 'frame-pulse'
        : frame.animation === 'spin-pulse'
          ? 'frame-spin-pulse'
          : '';

  const avatarContent = (
    <div
      style={{
        width: innerSize,
        height: innerSize,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt={fallback}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span
          style={{
            fontSize: Math.round(innerSize * 0.4),
            fontWeight: 700,
            color: 'white',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {fallback.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  if (!hasFrame) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {avatarContent}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: totalSize,
        height: totalSize,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        // Glow effect for frames that have a glow color
        boxShadow: frame.glowColor
          ? `0 0 ${borderW * 4}px ${borderW * 2}px ${frame.glowColor}`
          : undefined,
      }}
    >
      {/* Spinning / static gradient ring */}
      <div
        className={animClass}
        style={{
          position: 'absolute',
          // Oversized so it fills the clip circle when rotating
          top: '50%',
          left: '50%',
          width: '160%',
          height: '160%',
          background: frame.gradient,
          // Static frames: translate without rotation
          ...(frame.animation === 'none'
            ? { transform: 'translate(-50%, -50%)' }
            : {}),
          // Spin speed via CSS custom prop
          '--frame-speed': `${frame.spinSpeed ?? 4}s`,
        } as React.CSSProperties}
      />

      {/* Card-colored gap ring + avatar */}
      <div
        style={{
          position: 'absolute',
          inset: borderW,
          borderRadius: '50%',
          backgroundColor: 'var(--card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: gapW,
          overflow: 'hidden',
        }}
      >
        {avatarContent}
      </div>
    </div>
  );
}
