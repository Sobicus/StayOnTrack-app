/**
 * ShareCard — off-screen component rendered to PNG via html-to-image.
 * Fixed 1080×1080 px (rendered at 0.5× in DOM → actual export 2× scale).
 */

import React from 'react';

export type ShareCardData =
  | { kind: 'achievement'; emoji: string; title: string; description: string; category: string; username: string }
  | { kind: 'streak'; days: number; username: string }
  | { kind: 'stats'; kcal: number; money: number; currency: string; kg: number; username: string }
  | { kind: 'challenge'; title: string; username: string; opponentUsername?: string };

// Category → gradient pairs
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  CALORIES:   ['#7F1D1D', '#EA580C'],
  STREAK:     ['#1E1B4B', '#7C3AED'],
  CHECKINS:   ['#064E3B', '#059669'],
  MONEY:      ['#1C1917', '#D97706'],
  SOCIAL:     ['#4A044E', '#DB2777'],
  CHALLENGES: ['#450A0A', '#DC2626'],
  DISCIPLINE: ['#0C4A6E', '#0EA5E9'],
  DEFAULT:    ['#0F172A', '#6366F1'],
};

function getGradient(category: string): [string, string] {
  return CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.DEFAULT;
}

interface ShareCardProps {
  data: ShareCardData;
  /** ref forwarded to the root div for html-to-image capture */
  cardRef: React.RefObject<HTMLDivElement>;
}

export function ShareCard({ data, cardRef }: ShareCardProps) {
  const size = 540; // rendered at 540px in DOM, exported at 2× = 1080px

  // Pick gradient based on data type
  const [gradStart, gradEnd] =
    data.kind === 'achievement' ? getGradient(data.category) :
    data.kind === 'streak'      ? CATEGORY_GRADIENTS.STREAK :
    data.kind === 'stats'       ? CATEGORY_GRADIENTS.MONEY :
    CATEGORY_GRADIENTS.CHALLENGES;

  return (
    <div
      ref={cardRef}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%)`,
        borderRadius: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 44px',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 220, height: 220, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}>
        {data.kind === 'achievement' && <AchievementContent data={data} />}
        {data.kind === 'streak'      && <StreakContent data={data} />}
        {data.kind === 'stats'       && <StatsContent data={data} />}
        {data.kind === 'challenge'   && <ChallengeContent data={data} />}
      </div>

      {/* Branding footer */}
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
        }}>S</div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
          StayOnTrack
        </span>
      </div>
    </div>
  );
}

// ── Card content variants ─────────────────────────────────────────────────────

function AchievementContent({ data }: { data: Extract<ShareCardData, { kind: 'achievement' }> }) {
  return (
    <>
      <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 20 }}>{data.emoji}</div>
      <div style={{
        display: 'inline-block', padding: '4px 14px', borderRadius: 20,
        background: 'rgba(255,255,255,0.12)', marginBottom: 16,
        fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>
        Achievement Unlocked
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10 }}>
        {data.title}
      </div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
        {data.description}
      </div>
      <div style={{ marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
        @{data.username}
      </div>
    </>
  );
}

function StreakContent({ data }: { data: Extract<ShareCardData, { kind: 'streak' }> }) {
  return (
    <>
      <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 12 }}>🔥</div>
      <div style={{
        fontSize: 88, fontWeight: 900, color: '#fff', lineHeight: 1,
        marginBottom: 8, letterSpacing: '-0.02em',
      }}>
        {data.days}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 28,
      }}>
        Day Streak
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
        @{data.username}
      </div>
    </>
  );
}

function StatsContent({ data }: { data: Extract<ShareCardData, { kind: 'stats' }> }) {
  return (
    <>
      <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 20 }}>📊</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        My Progress
      </div>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', width: '100%', marginBottom: 28 }}>
        <StatPill value={`${Math.round(data.kcal / 1000)}k`} label="kcal saved" />
        <StatPill value={`${data.currency}${Math.round(data.money)}`} label="money saved" />
        <StatPill value={`${data.kg.toFixed(1)}kg`} label="not gained" />
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
        @{data.username}
      </div>
    </>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.1)',
      borderRadius: 16, padding: '14px 8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ChallengeContent({ data }: { data: Extract<ShareCardData, { kind: 'challenge' }> }) {
  return (
    <>
      <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 16 }}>👑</div>
      <div style={{
        display: 'inline-block', padding: '4px 14px', borderRadius: 20,
        background: 'rgba(255,255,255,0.12)', marginBottom: 16,
        fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>
        Challenge Won!
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
        {data.title}
      </div>
      {data.opponentUsername && (
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
          vs @{data.opponentUsername}
        </div>
      )}
      <div style={{ marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
        @{data.username}
      </div>
    </>
  );
}
