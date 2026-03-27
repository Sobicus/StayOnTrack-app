'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { api, HabitTemplate } from '@/lib/api';

export interface CatalogItem {
  emoji: string;
  titleKey: string;
  category: string;
  calories: number;
  price: number;
}

const CATEGORY_KEYS = [
  'allCategories',
  'fast_food',
  'sweets',
  'drinks',
  'alcohol',
  'snacks',
  'smoking',
  'shopping',
] as const;

interface HabitCatalogProps {
  onQuickAdd: (item: CatalogItem) => void;
}

export function HabitCatalog({ onQuickAdd }: HabitCatalogProps) {
  const t = useTranslations('habits');
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('allCategories');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.habits
      .templates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = templates.filter((tmpl) => {
    if (activeCategory !== 'allCategories' && tmpl.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        tmpl.nameEn.toLowerCase().includes(q) ||
        tmpl.nameRu.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getDisplayName = (tmpl: HabitTemplate): string => {
    // Detect locale from document lang or default to English
    const locale =
      typeof document !== 'undefined' ? document.documentElement.lang : 'en';
    return locale === 'ru' ? tmpl.nameRu : tmpl.nameEn;
  };

  const handleAdd = (tmpl: HabitTemplate) => {
    onQuickAdd({
      emoji: tmpl.emoji,
      titleKey: getDisplayName(tmpl),
      category: tmpl.category.toUpperCase(),
      calories: tmpl.defaultCalories,
      price: tmpl.defaultMoney,
    });
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="h-6 w-32 bg-[var(--border)] rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--border)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
        {t('catalog.title')}
      </h2>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('catalog.searchTemplates')}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === key
                ? 'bg-primary text-white'
                : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
            }`}
          >
            {t(`catalog.${key}`)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleAdd(tmpl)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
          >
            <span className="text-xl flex-shrink-0">{tmpl.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {getDisplayName(tmpl)}
              </p>
              <p className="text-[10px] text-[var(--muted)]">
                {tmpl.defaultCalories > 0 ? `${tmpl.defaultCalories} kcal · ` : ''}
                €{tmpl.defaultMoney.toFixed(2)}
              </p>
            </div>
            <Plus className="w-4 h-4 text-[var(--muted)] group-hover:text-primary flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)] py-4">
          {search.trim() ? t('catalog.noResults') : t('catalog.noResults')}
        </p>
      )}
    </div>
  );
}
