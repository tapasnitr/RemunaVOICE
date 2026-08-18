import { KitchenSchedule, MEAL_TYPES, MealType, ScheduledMeal } from "./types";

/* ==================== DATE HELPERS ==================== */

export function todayYMD(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export function dateToYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function ymdToDate(ymd: string): Date {
  return new Date(ymd + "T00:00:00Z");
}

export function getNextDays(count: number): Array<{ ymd: string; label: string }> {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const ymd = dateToYMD(d);
    const label = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    days.push({ ymd, label });
  }
  return days;
}

/* ==================== MEAL HELPERS ==================== */

export function getMealLabel(mealType: MealType): string {
  return MEAL_TYPES.find((m) => m.id === mealType)?.label || mealType;
}

export function getMealEmoji(mealType: MealType): string {
  return MEAL_TYPES.find((m) => m.id === mealType)?.emoji || "";
}

export function getDefaultTime(mealType: MealType): string {
  return MEAL_TYPES.find((m) => m.id === mealType)?.default || "12:00";
}

export function getMealsSorted(schedule: KitchenSchedule): ScheduledMeal[] {
  const mealTypeOrder: Record<MealType, number> = {
    morning: 0,
    breakfast: 1,
    lunch: 2,
    dinner: 3,
    prasadam: 4,
  };
  
  return [...schedule.meals].sort(
    (a, b) => mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType]
  );
}

/* ==================== SCHEDULE HELPERS ==================== */

export async function fetchSchedule(date: string): Promise<any> {
  const res = await fetch(`/api/admin/kitchen-schedule?date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch schedule");
  return res.json();
}

export async function fetchScheduleRange(
  startDate: string,
  endDate: string
): Promise<any> {
  const res = await fetch(
    `/api/admin/kitchen-schedule?startDate=${startDate}&endDate=${endDate}`
  );
  if (!res.ok) throw new Error("Failed to fetch schedule range");
  return res.json();
}

export async function saveSchedule(
  date: string,
  meals: ScheduledMeal[],
  totalDevotees: number
): Promise<any> {
  const res = await fetch("/api/admin/kitchen-schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, meals, totalDevotees }),
  });
  if (!res.ok) throw new Error("Failed to save schedule");
  return res.json();
}

export async function deleteSchedule(id: string): Promise<any> {
  const res = await fetch(`/api/admin/kitchen-schedule?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete schedule");
  return res.json();
}

/* ==================== VALIDATION ==================== */

export function validateSchedule(schedule: ScheduledMeal[]): string[] {
  const errors: string[] = [];

  if (schedule.length === 0) {
    errors.push("At least one meal must be added");
  }

  schedule.forEach((meal) => {
    if (!meal.time) errors.push(`${getMealLabel(meal.mealType)}: time is required`);
    if (meal.items.length === 0) {
      errors.push(`${getMealLabel(meal.mealType)}: at least one recipe must be selected`);
    }
    meal.items.forEach((item, idx) => {
      if (!item.recipeId) {
        errors.push(`${getMealLabel(meal.mealType)}: recipe ${idx + 1} is not selected`);
      }
      if (!item.servings || item.servings < 1) {
        errors.push(
          `${getMealLabel(meal.mealType)}: recipe ${idx + 1} servings must be at least 1`
        );
      }
    });
  });

  return errors;
}
