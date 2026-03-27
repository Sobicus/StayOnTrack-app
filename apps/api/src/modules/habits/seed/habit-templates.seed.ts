import { DataSource } from 'typeorm';
import { HabitTemplate } from '../entities/habit-template.entity';

export async function seedHabitTemplates(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(HabitTemplate);
  const count = await repo.count();
  if (count > 0) return; // Already seeded

  const templates: Partial<HabitTemplate>[] = [
    // Fast Food
    { nameEn: 'Big Mac', nameRu: 'Биг Мак', defaultCalories: 550, defaultMoney: 5.50, emoji: '🍔', category: 'fast_food', sortOrder: 1 },
    { nameEn: 'Pizza Slice', nameRu: 'Кусок пиццы', defaultCalories: 285, defaultMoney: 3.00, emoji: '🍕', category: 'fast_food', sortOrder: 2 },
    { nameEn: 'Burrito', nameRu: 'Буррито', defaultCalories: 450, defaultMoney: 7.00, emoji: '🌯', category: 'fast_food', sortOrder: 3 },
    { nameEn: 'Hot Dog', nameRu: 'Хот-дог', defaultCalories: 290, defaultMoney: 3.50, emoji: '🌭', category: 'fast_food', sortOrder: 4 },
    { nameEn: 'French Fries', nameRu: 'Картофель фри', defaultCalories: 385, defaultMoney: 2.50, emoji: '🍟', category: 'fast_food', sortOrder: 5 },
    { nameEn: 'Fried Chicken', nameRu: 'Жареная курица', defaultCalories: 400, defaultMoney: 5.00, emoji: '🍗', category: 'fast_food', sortOrder: 6 },

    // Sweets
    { nameEn: 'Donut', nameRu: 'Пончик', defaultCalories: 250, defaultMoney: 2.00, emoji: '🍩', category: 'sweets', sortOrder: 1 },
    { nameEn: 'Chocolate Bar', nameRu: 'Шоколадка', defaultCalories: 230, defaultMoney: 2.50, emoji: '🍫', category: 'sweets', sortOrder: 2 },
    { nameEn: 'Ice Cream', nameRu: 'Мороженое', defaultCalories: 350, defaultMoney: 4.00, emoji: '🍦', category: 'sweets', sortOrder: 3 },
    { nameEn: 'Cake Slice', nameRu: 'Кусок торта', defaultCalories: 400, defaultMoney: 5.00, emoji: '🍰', category: 'sweets', sortOrder: 4 },
    { nameEn: 'Cookies', nameRu: 'Печенье', defaultCalories: 200, defaultMoney: 1.50, emoji: '🍪', category: 'sweets', sortOrder: 5 },

    // Drinks
    { nameEn: 'Coca-Cola', nameRu: 'Кока-Кола', defaultCalories: 140, defaultMoney: 2.00, emoji: '🥤', category: 'drinks', sortOrder: 1 },
    { nameEn: 'Latte', nameRu: 'Латте', defaultCalories: 190, defaultMoney: 4.50, emoji: '☕', category: 'drinks', sortOrder: 2 },
    { nameEn: 'Energy Drink', nameRu: 'Энергетик', defaultCalories: 110, defaultMoney: 3.00, emoji: '⚡', category: 'drinks', sortOrder: 3 },
    { nameEn: 'Milkshake', nameRu: 'Молочный коктейль', defaultCalories: 500, defaultMoney: 5.00, emoji: '🥛', category: 'drinks', sortOrder: 4 },

    // Alcohol
    { nameEn: 'Beer', nameRu: 'Пиво', defaultCalories: 150, defaultMoney: 5.00, emoji: '🍺', category: 'alcohol', sortOrder: 1 },
    { nameEn: 'Wine Glass', nameRu: 'Бокал вина', defaultCalories: 125, defaultMoney: 6.00, emoji: '🍷', category: 'alcohol', sortOrder: 2 },
    { nameEn: 'Cocktail', nameRu: 'Коктейль', defaultCalories: 300, defaultMoney: 12.00, emoji: '🍹', category: 'alcohol', sortOrder: 3 },

    // Snacks
    { nameEn: 'Chips', nameRu: 'Чипсы', defaultCalories: 160, defaultMoney: 2.50, emoji: '🥔', category: 'snacks', sortOrder: 1 },
    { nameEn: 'Nachos', nameRu: 'Начос', defaultCalories: 350, defaultMoney: 4.00, emoji: '🧀', category: 'snacks', sortOrder: 2 },

    // Smoking
    { nameEn: 'Cigarette', nameRu: 'Сигарета', defaultCalories: 0, defaultMoney: 0.50, emoji: '🚬', category: 'smoking', sortOrder: 1 },
    { nameEn: 'Vape', nameRu: 'Вейп', defaultCalories: 0, defaultMoney: 1.00, emoji: '💨', category: 'smoking', sortOrder: 2 },

    // Shopping
    { nameEn: 'Impulse Buy', nameRu: 'Импульсивная покупка', defaultCalories: 0, defaultMoney: 20.00, emoji: '🛍️', category: 'shopping', sortOrder: 1 },
    { nameEn: 'Online Shopping', nameRu: 'Онлайн шоппинг', defaultCalories: 0, defaultMoney: 30.00, emoji: '📦', category: 'shopping', sortOrder: 2 },
  ];

  await repo.save(templates.map(t => repo.create(t)));
}
