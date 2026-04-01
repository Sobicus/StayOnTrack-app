'use client';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

function getLevelColor(level: number): string {
  if (level >= 16) return 'from-yellow-400 to-amber-500 text-amber-950';
  if (level >= 11) return 'from-purple-400 to-purple-600 text-white';
  if (level >= 6) return 'from-blue-400 to-blue-600 text-white';
  return 'from-green-400 to-green-600 text-white';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const colorClass = getLevelColor(level);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center font-bold shadow-sm flex-shrink-0`}
    >
      {level}
    </div>
  );
}
