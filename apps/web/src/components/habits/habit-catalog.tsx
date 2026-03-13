'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface CatalogItem {
  emoji: string;
  titleKey: string;
  category: string;
  calories: number;
  price: number;
}

const CATALOG: CatalogItem[] = [
  // Fast food
  { emoji: '🍔', titleKey: 'bigMac', category: 'FASTFOOD', calories: 550, price: 5.50 },
  { emoji: '🍟', titleKey: 'fries', category: 'FASTFOOD', calories: 365, price: 2.50 },
  { emoji: '🍕', titleKey: 'pizzaSlice', category: 'FASTFOOD', calories: 285, price: 3.00 },
  { emoji: '🌯', titleKey: 'burrito', category: 'FASTFOOD', calories: 450, price: 7.00 },
  { emoji: '🌭', titleKey: 'hotDog', category: 'FASTFOOD', calories: 290, price: 3.50 },
  { emoji: '🍗', titleKey: 'friedChicken', category: 'FASTFOOD', calories: 400, price: 5.00 },
  // Sweets
  { emoji: '🍩', titleKey: 'donut', category: 'SWEETS', calories: 250, price: 2.00 },
  { emoji: '🍫', titleKey: 'chocolate', category: 'SWEETS', calories: 230, price: 2.50 },
  { emoji: '🍪', titleKey: 'cookies', category: 'SWEETS', calories: 200, price: 1.50 },
  { emoji: '🍰', titleKey: 'cakeSlice', category: 'SWEETS', calories: 350, price: 4.50 },
  { emoji: '🧁', titleKey: 'cupcake', category: 'SWEETS', calories: 300, price: 3.00 },
  // Drinks
  { emoji: '🥤', titleKey: 'cola', category: 'DRINKS', calories: 140, price: 2.00 },
  { emoji: '☕', titleKey: 'latte', category: 'DRINKS', calories: 190, price: 4.50 },
  { emoji: '🧃', titleKey: 'juice', category: 'DRINKS', calories: 120, price: 3.00 },
  { emoji: '🥤', titleKey: 'energyDrink', category: 'DRINKS', calories: 110, price: 3.00 },
  // Alcohol
  { emoji: '🍺', titleKey: 'beer', category: 'ALCOHOL', calories: 150, price: 4.00 },
  { emoji: '🍷', titleKey: 'wine', category: 'ALCOHOL', calories: 125, price: 6.00 },
  { emoji: '🍸', titleKey: 'cocktail', category: 'ALCOHOL', calories: 200, price: 10.00 },
  // Snacks
  { emoji: '🥐', titleKey: 'croissant', category: 'SNACKS', calories: 230, price: 2.50 },
  { emoji: '🍿', titleKey: 'popcorn', category: 'SNACKS', calories: 400, price: 5.00 },
  { emoji: '🧀', titleKey: 'nachos', category: 'SNACKS', calories: 350, price: 4.00 },
  // Other
  { emoji: '🚬', titleKey: 'cigarette', category: 'CUSTOM', calories: 0, price: 0.50 },
  { emoji: '📱', titleKey: 'onlineShopping', category: 'CUSTOM', calories: 0, price: 30.00 },
];

interface HabitCatalogProps {
  onQuickAdd: (item: CatalogItem) => void;
}

export function HabitCatalog({ onQuickAdd }: HabitCatalogProps) {
  const t = useTranslations('habits');
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? CATALOG : CATALOG.slice(0, 8);

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
        {t('catalog.title')}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {displayItems.map((item, idx) => (
          <button
            key={`${item.titleKey}-${idx}`}
            onClick={() => onQuickAdd(item)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
          >
            <span className="text-xl flex-shrink-0">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {t(`catalog.${item.titleKey}`)}
              </p>
              <p className="text-[10px] text-[var(--muted)]">
                {item.calories > 0 ? `${item.calories} kcal · ` : ''}€{item.price.toFixed(2)}
              </p>
            </div>
            <Plus className="w-4 h-4 text-[var(--muted)] group-hover:text-primary flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>
      {CATALOG.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mx-auto mt-3 text-xs text-[var(--muted)] hover:text-primary transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              {t('catalog.showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              {t('catalog.showAll', { count: CATALOG.length })}
            </>
          )}
        </button>
      )}
    </div>
  );
}
