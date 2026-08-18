/* ==================== MEAL TYPES ==================== */

export const MEAL_TYPES = [
  { id: "morning", label: "Morning", emoji: "🌅", default: "06:00" },
  { id: "breakfast", label: "Breakfast", emoji: "🥣", default: "08:00" },
  { id: "lunch", label: "Lunch", emoji: "🍛", default: "12:00" },
  { id: "dinner", label: "Dinner", emoji: "🍲", default: "19:00" },
  { id: "prasadam", label: "Prasadam", emoji: "🙏", default: "21:00" },
] as const;

export type MealType = typeof MEAL_TYPES[number]["id"];

/* ==================== MEAL ITEM ==================== */

export interface MealItem {
  recipeId: string;
  recipeName: string;
  servings: number;
  portionSize?: string;
}

/* ==================== SCHEDULED MEAL ==================== */

export interface ScheduledMeal {
  mealType: MealType;
  time: string; // HH:MM format
  items: MealItem[];
  notes?: string;
}

/* ==================== KITCHEN SCHEDULE ==================== */

export interface KitchenSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  meals: ScheduledMeal[];
  totalDevotees: number;
  createdAt: any;
  updatedAt: any;
}

/* ==================== RECIPE ==================== */

export interface Recipe {
  id: string;
  name: string;
  type: string;
  ingredients: Array<{
    materialId: string;
    name: string;
    unit: string;
    quantity: string;
    isOptional: boolean;
  }>;
  steps?: string;
  createdAt?: any;
}
