"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackPageName from "@/components/BackHeaderButton";
import { useAuth } from "@/context/AuthContext";
import {
  IoAdd,
  IoAlertCircle,
  IoCalendarClear,
  IoCheckmarkCircle,
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoCopyOutline,
  IoFastFoodOutline,
  IoRefresh,
  IoSearch,
  IoTrashOutline,
} from "react-icons/io5";

type MealType = "breakfast" | "lunch" | "dinner";
type PlannerMode = "week" | "month";

interface MealItem {
  recipeId: string;
  recipeName: string;
  servings: number;
  portionSize?: string;
  isCustom?: boolean;
}

interface ScheduledMeal {
  mealType: MealType;
  time: string;
  items: MealItem[];
  notes?: string;
}

interface Recipe {
  id: string;
  name: string;
  type?: string;
  ingredients?: Array<{
    materialId: string;
    name: string;
    unit: string;
    quantity: string | number;
    isOptional: boolean;
  }>;
  steps?: string;
}

interface DayPlan {
  id?: string;
  date: string;
  totalDevotees: number;
  meals: ScheduledMeal[];
}

const MEAL_TYPES: Array<{
  id: MealType;
  label: string;
  shortLabel: string;
  defaultTime: string;
  tone: string;
  plannedTone: string;
  badgeTone: string;
}> = [
  {
    id: "breakfast",
    label: "Breakfast",
    shortLabel: "B",
    defaultTime: "08:00",
    tone: "border-orange-200 bg-orange-50 text-orange-950",
    plannedTone:
      "border-orange-500 bg-orange-100 text-orange-950 ring-1 ring-orange-300 shadow-sm",
    badgeTone: "bg-orange-600 text-white",
  },
  {
    id: "lunch",
    label: "Lunch",
    shortLabel: "L",
    defaultTime: "12:30",
    tone: "border-teal-200 bg-teal-50 text-teal-950",
    plannedTone:
      "border-teal-500 bg-teal-100 text-teal-950 ring-1 ring-teal-300 shadow-sm",
    badgeTone: "bg-teal-700 text-white",
  },
  {
    id: "dinner",
    label: "Dinner",
    shortLabel: "D",
    defaultTime: "19:30",
    tone: "border-violet-200 bg-violet-50 text-violet-950",
    plannedTone:
      "border-violet-500 bg-violet-100 text-violet-950 ring-1 ring-violet-300 shadow-sm",
    badgeTone: "bg-violet-700 text-white",
  },
];

function toYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromYMD(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function getVisibleDates(anchorDate: Date, mode: PlannerMode) {
  if (mode === "week") {
    const start = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  const days = [];

  for (let date = start; date <= end; date = addDays(date, 1)) {
    days.push(new Date(date));
  }

  return days;
}

function formatRange(dates: Date[], mode: PlannerMode) {
  if (dates.length === 0) return "";

  if (mode === "month") {
    return dates[0].toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  const first = dates[0];
  const last = dates[dates.length - 1];
  return `${first.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} - ${last.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function getMealMeta(mealType: MealType) {
  return MEAL_TYPES.find((meal) => meal.id === mealType) || MEAL_TYPES[0];
}

function makeEmptyMeal(mealType: MealType): ScheduledMeal {
  const meta = getMealMeta(mealType);
  return {
    mealType,
    time: meta.defaultTime,
    items: [],
    notes: "",
  };
}

function getMeal(plan: DayPlan | undefined, mealType: MealType) {
  return plan?.meals.find((meal) => meal.mealType === mealType);
}

function sortMeals(meals: ScheduledMeal[]) {
  const order: Record<MealType, number> = {
    breakfast: 0,
    lunch: 1,
    dinner: 2,
  };

  return [...meals].sort((a, b) => order[a.mealType] - order[b.mealType]);
}

function compactMeals(meals: ScheduledMeal[]) {
  return sortMeals(meals)
    .map((meal) => ({
      ...meal,
      items: meal.items.filter((item) => item.recipeId),
      notes: meal.notes?.trim() || "",
    }))
    .filter((meal) => meal.items.length > 0 || meal.notes);
}

export default function MenuPlannerPage() {
  const { userData, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<PlannerMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [plansByDate, setPlansByDate] = useState<Record<string, DayPlan>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [defaultDevotees, setDefaultDevotees] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);

  const hasKitchenAccess =
    Boolean(userData?.features?.kitchen) ||
    Boolean(userData?.adminFeatures?.includes("kitchen"));

  const visibleDates = useMemo(
    () => getVisibleDates(anchorDate, mode),
    [anchorDate, mode]
  );
  const visibleYMDs = useMemo(() => visibleDates.map(toYMD), [visibleDates]);
  const rangeLabel = formatRange(visibleDates, mode);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (authLoading || !hasKitchenAccess) return;
    loadPlans();
  }, [authLoading, hasKitchenAccess, mode, anchorDate]);

  async function fetchRecipes() {
    try {
      const snap = await getDocs(collection(db, "recipes"));
      const list = snap.docs
        .map((recipeDoc) => ({
          id: recipeDoc.id,
          ...recipeDoc.data(),
        })) as Recipe[];

      list.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );

      setRecipes(list);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError("Unable to load recipes. Please try again.");
    }
  }

  async function loadPlans() {
    if (visibleYMDs.length === 0) return;

    try {
      setLoading(true);
      setError("");

      const startDate = visibleYMDs[0];
      const endDate = visibleYMDs[visibleYMDs.length - 1];
      const plansQuery = query(
        collection(db, "kitchenSchedules"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
      const snap = await getDocs(plansQuery);
      const loaded: Record<string, DayPlan> = {};

      snap.docs.forEach((scheduleDoc) => {
        const data = scheduleDoc.data();
        if (!data.date || loaded[data.date]) return;

        loaded[data.date] = {
          id: scheduleDoc.id,
          date: data.date,
          totalDevotees: Number(data.totalDevotees || defaultDevotees || 10),
          meals: sortMeals((data.meals || []) as ScheduledMeal[]).filter((meal) =>
            MEAL_TYPES.some((meta) => meta.id === meal.mealType)
          ),
        };
      });

      setPlansByDate((current) => {
        const next = { ...current };
        visibleYMDs.forEach((date) => {
          if (loaded[date]) {
            next[date] = loaded[date];
          } else {
            delete next[date];
          }
        });
        return next;
      });
    } catch (err: any) {
      console.error("Error loading menu plans:", err);
      setError(err.message || "Unable to load menu planner.");
    } finally {
      setLoading(false);
    }
  }

  function getOrCreatePlan(date: string) {
    return (
      plansByDate[date] || {
        date,
        totalDevotees: defaultDevotees,
        meals: [],
      }
    );
  }

  async function handleDevoteesChange(value: number) {
    const safeValue = Math.max(1, Number(value) || 1);
    setDefaultDevotees(safeValue);

    const updatedPlans = visibleYMDs.map((date) => ({
      date,
      plan: {
        ...getOrCreatePlan(date),
        totalDevotees: safeValue,
      },
    }));

    setPlansByDate((current) => {
      const next = { ...current };
      updatedPlans.forEach(({ date, plan }) => {
        next[date] = plan;
      });
      return next;
    });

    try {
      setSaving(true);
      setError("");
      await Promise.all(
        updatedPlans
          .filter(({ plan }) => plan.id || plan.meals.length > 0)
          .map(({ date, plan }) => saveDatePlan(date, plan))
      );
      setSuccess("Devotee count saved.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      console.error("Error saving devotee count:", err);
      setError(err.message || "Unable to save devotee count.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMeal(date: string, meal: ScheduledMeal) {
    const currentPlan = getOrCreatePlan(date);
    const existing = currentPlan.meals.filter(
      (item) => item.mealType !== meal.mealType
    );
    const nextPlan = {
      ...currentPlan,
      meals: compactMeals([...existing, meal]),
    };

    try {
      setSaving(true);
      setError("");
      setPlansByDate((current) => ({
        ...current,
        [date]: nextPlan,
      }));

      await saveDatePlan(date, nextPlan);
      setSuccess("Meal saved.");
      setTimeout(() => setSuccess(""), 2500);
      setEditingSlot(null);
    } catch (err: any) {
      console.error("Error saving meal:", err);
      setError(err.message || "Unable to save meal.");
    } finally {
      setSaving(false);
    }
  }

  function applySavedPlan(date: string, plan: DayPlan, id?: string) {
    setPlansByDate((current) => ({
      ...current,
      [date]: {
        ...plan,
        id: id || plan.id,
        meals: compactMeals(plan.meals),
      },
    }));
  }

  async function clearMeal(date: string, mealType: MealType) {
    const nextPlan = {
      ...getOrCreatePlan(date),
      meals: getOrCreatePlan(date).meals.filter((meal) => meal.mealType !== mealType),
    };

    try {
      setSaving(true);
      setError("");
      setPlansByDate((current) => ({
        ...current,
        [date]: nextPlan,
      }));
      await saveDatePlan(date, nextPlan);
      setSuccess("Meal cleared.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      console.error("Error clearing meal:", err);
      setError(err.message || "Unable to clear meal.");
    } finally {
      setSaving(false);
    }
  }

  async function copyPreviousDay(date: string) {
    const previousDate = toYMD(addDays(fromYMD(date), -1));
    const previousPlan = plansByDate[previousDate];

    if (!previousPlan || previousPlan.meals.length === 0) {
      setError("Previous day has no planned meals to copy.");
      return;
    }

    const nextPlan = {
      ...getOrCreatePlan(date),
      totalDevotees: previousPlan.totalDevotees,
      meals: previousPlan.meals.map((meal) => ({
        ...meal,
        items: meal.items.map((item) => ({ ...item })),
      })),
    };

    try {
      setSaving(true);
      setError("");
      setPlansByDate((current) => ({
        ...current,
        [date]: nextPlan,
      }));
      await saveDatePlan(date, nextPlan);
      setSuccess("Previous day copied.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      console.error("Error copying previous day:", err);
      setError(err.message || "Unable to copy previous day.");
    } finally {
      setSaving(false);
    }
  }

  function movePeriod(direction: -1 | 1) {
    setAnchorDate((current) => {
      const next = new Date(current);
      if (mode === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else {
        next.setMonth(next.getMonth() + direction);
      }
      return next;
    });
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  async function saveDatePlan(date: string, plan: DayPlan) {
    const meals = compactMeals(plan.meals);

    if (meals.length === 0) {
      if (plan.id) {
        await deleteDoc(doc(db, "kitchenSchedules", plan.id));
      }
      setPlansByDate((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });
      return;
    }

    const payload = {
      date,
      dayName: fromYMD(date).toLocaleDateString("en-IN", { weekday: "long" }),
      meals,
      totalDevotees: Math.max(1, Number(plan.totalDevotees || defaultDevotees || 10)),
      updatedAt: Timestamp.now(),
    };

    if (plan.id) {
      await updateDoc(doc(db, "kitchenSchedules", plan.id), payload);
      applySavedPlan(date, { ...plan, meals });
    } else {
      const docRef = await addDoc(collection(db, "kitchenSchedules"), {
        ...payload,
        createdAt: Timestamp.now(),
      });

      applySavedPlan(date, { ...plan, meals }, docRef.id);
    }
  }

  if (!authLoading && !hasKitchenAccess) {
    return (
      <div className="min-h-screen bg-yellow-50">
        <BackPageName title="Menu Planner" link="/user/admin/kitchen" />
        <div className="mx-auto max-w-xl p-4">
          <div className="rounded-lg border border-red-200 bg-white p-5 text-red-700">
            You do not have kitchen access for this page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <BackPageName title="Menu Planner" link="/user/admin/kitchen" />

      <div className="mx-auto max-w-7xl px-3 pb-6 pt-3 sm:px-5">
        <div className="mb-4 rounded-lg border border-yellow-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-yellow-900">
                <IoCalendarClear size={18} />
                {rangeLabel}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Plan breakfast, lunch and dinner directly from saved recipes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                {(["week", "month"] as PlannerMode[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setMode(item)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${
                      mode === item
                        ? "bg-yellow-700 text-white shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => movePeriod(-1)}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
                  aria-label="Previous"
                >
                  <IoChevronBack size={18} />
                </button>
                <button
                  onClick={goToday}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => movePeriod(1)}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
                  aria-label="Next"
                >
                  <IoChevronForward size={18} />
                </button>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                Devotees
                <input
                  type="number"
                  min="1"
                  value={defaultDevotees}
                  onChange={(event) => handleDevoteesChange(Number(event.target.value))}
                  className="w-16 rounded border border-gray-200 px-2 py-1 text-sm"
                />
              </label>

              {saving && (
                <span className="rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-800">
                  Saving...
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <IoAlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
            <IoCheckmarkCircle size={18} className="mt-0.5 flex-shrink-0" />
            {success}
          </div>
        )}

        {loading || authLoading ? (
          <div className="rounded-lg border border-yellow-200 bg-white py-16 text-center text-gray-600">
            <IoRefresh size={30} className="mx-auto mb-3 animate-spin text-yellow-700" />
            Loading menu planner...
          </div>
        ) : (
          <div className="space-y-3">
            {visibleDates.map((date) => {
              const ymd = toYMD(date);
              const plan = plansByDate[ymd];
              const isToday = ymd === toYMD(new Date());
              const plannedMeals = MEAL_TYPES.filter(
                (mealMeta) => (getMeal(plan, mealMeta.id)?.items.length || 0) > 0
              ).length;

              return (
                <section
                  key={ymd}
                  className={`rounded-lg border p-3 shadow-sm ${
                    isToday
                      ? "border-yellow-500 bg-white"
                      : "border-yellow-200 bg-white"
                  }`}
                >
                  <div className="grid gap-3 lg:grid-cols-[190px_1fr] lg:items-start">
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-yellow-950">
                            {date.toLocaleDateString("en-IN", { weekday: "long" })}
                          </p>
                          {isToday && (
                            <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-[10px] font-bold text-yellow-900">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-2xl font-bold text-gray-950">
                          {date.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {plannedMeals}/3 meals set
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 lg:mt-4 lg:justify-start">
                        <button
                          onClick={() => setDetailDate(ymd)}
                          className="rounded-lg bg-yellow-700 px-3 py-2 text-xs font-bold text-white hover:bg-yellow-800"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => copyPreviousDay(ymd)}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          title="Copy previous day"
                        >
                          <IoCopyOutline size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                      {MEAL_TYPES.map((mealMeta) => {
                        const meal = getMeal(plan, mealMeta.id);
                        const itemNames = meal?.items.map((item) => item.recipeName) || [];
                        const hasRecipes = itemNames.length > 0;

                        return (
                          <div
                            key={mealMeta.id}
                            className={`flex min-h-[120px] flex-col justify-between rounded-lg border p-3 transition ${
                              hasRecipes ? mealMeta.plannedTone : mealMeta.tone
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold">
                                      {mealMeta.shortLabel}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold">
                                        {mealMeta.label}
                                      </p>
                                      <p className="text-xs opacity-75">
                                        {meal?.time || mealMeta.defaultTime}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  {hasRecipes && (
                                    <span
                                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${mealMeta.badgeTone}`}
                                    >
                                      Planned
                                    </span>
                                  )}
                                  {meal && (
                                    <button
                                      onClick={() => clearMeal(ymd, mealMeta.id)}
                                      className="rounded-md p-1.5 hover:bg-white/70"
                                      title="Clear meal"
                                    >
                                      <IoTrashOutline size={15} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {!hasRecipes && (
                                <div className="mt-3 rounded-lg border border-dashed border-current/20 bg-white/50 px-3 py-2 text-xs font-semibold opacity-75">
                                  Not planned
                                </div>
                              )}
                              {hasRecipes && (
                                <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold">
                                  {itemNames.length} item
                                  {itemNames.length !== 1 ? "s" : ""}
                                  {" selected"}
                                </div>
                              )}

                              {itemNames.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  {itemNames.slice(0, 2).map((name, index) => (
                                    <p
                                      key={`${name}-${index}`}
                                      className="truncate text-xs font-medium"
                                    >
                                      {name}
                                    </p>
                                  ))}
                                  {itemNames.length > 2 && (
                                    <p className="text-xs font-semibold">
                                      +{itemNames.length - 2} more
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() =>
                                  setEditingSlot({
                                    date: ymd,
                                    mealType: mealMeta.id,
                                  })
                                }
                                className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-gray-50"
                              >
                                {meal ? "Edit" : "Plan"}
                              </button>
                              <button
                                onClick={() => setDetailDate(ymd)}
                                className="rounded-lg bg-white/70 px-3 py-2 text-xs font-bold hover:bg-white"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {editingSlot && (
        <MealPlannerModal
          date={editingSlot.date}
          mealType={editingSlot.mealType}
          recipes={recipes}
          existingMeal={
            getMeal(plansByDate[editingSlot.date], editingSlot.mealType) ||
            makeEmptyMeal(editingSlot.mealType)
          }
          saving={saving}
          onClose={() => setEditingSlot(null)}
          onSave={(meal) => handleSaveMeal(editingSlot.date, meal)}
        />
      )}

      {detailDate && (
        <DayDetailModal
          date={detailDate}
          plan={getOrCreatePlan(detailDate)}
          onClose={() => setDetailDate(null)}
          onEditMeal={(mealType) => {
            setEditingSlot({ date: detailDate, mealType });
          }}
          onClearMeal={(mealType) => clearMeal(detailDate, mealType)}
        />
      )}
    </div>
  );
}

function DayDetailModal({
  date,
  plan,
  onClose,
  onEditMeal,
  onClearMeal,
}: {
  date: string;
  plan: DayPlan;
  onClose: () => void;
  onEditMeal: (mealType: MealType) => void;
  onClearMeal: (mealType: MealType) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <div className="max-h-[90vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-lg">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {fromYMD(date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {plan.totalDevotees} devotees planned
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <IoClose size={22} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-82px)] space-y-3 overflow-y-auto p-4">
          {MEAL_TYPES.map((mealMeta) => {
            const meal = getMeal(plan, mealMeta.id);
            const mealItems = meal?.items || [];
            const hasItems = mealItems.length > 0;

            return (
              <section
                key={mealMeta.id}
                className={`rounded-lg border p-3 ${
                  hasItems ? mealMeta.plannedTone : mealMeta.tone
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold">
                        {mealMeta.shortLabel}
                      </span>
                      <h4 className="font-bold">{mealMeta.label}</h4>
                    </div>
                    <p className="mt-1 text-xs opacity-75">
                      {meal?.time || mealMeta.defaultTime}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {meal && (
                      <button
                        onClick={() => onClearMeal(mealMeta.id)}
                        className="rounded-lg bg-white/80 px-3 py-2 text-xs font-bold text-red-600 hover:bg-white"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => onEditMeal(mealMeta.id)}
                      className="rounded-lg bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-gray-50"
                    >
                      {meal ? "Edit" : "Plan"}
                    </button>
                  </div>
                </div>

                {hasItems ? (
                  <div className="mt-3 space-y-2">
                    {mealItems.map((item, index) => (
                      <div
                        key={`${item.recipeId}-${index}`}
                        className="rounded-lg bg-white/75 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-950">
                              {item.recipeName}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              {item.isCustom ? "Custom item" : "Saved recipe"}
                              {item.portionSize ? ` - ${item.portionSize}` : ""}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-700">
                            {item.servings}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-white/80 p-3 text-sm opacity-75">
                    No menu items added.
                  </p>
                )}

                {meal?.notes && (
                  <div className="mt-3 rounded-lg bg-white/75 p-3 text-sm text-gray-800">
                    <span className="font-bold">Notes: </span>
                    {meal.notes}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MealPlannerModal({
  date,
  mealType,
  recipes,
  existingMeal,
  saving,
  onClose,
  onSave,
}: {
  date: string;
  mealType: MealType;
  recipes: Recipe[];
  existingMeal: ScheduledMeal;
  saving: boolean;
  onClose: () => void;
  onSave: (meal: ScheduledMeal) => void;
}) {
  const mealMeta = getMealMeta(mealType);
  const [time, setTime] = useState(existingMeal.time || mealMeta.defaultTime);
  const [items, setItems] = useState<MealItem[]>(
    existingMeal.items.length > 0 ? existingMeal.items : []
  );
  const [notes, setNotes] = useState(existingMeal.notes || "");
  const [search, setSearch] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [servings, setServings] = useState(1);
  const [portionSize, setPortionSize] = useState("");
  const [customText, setCustomText] = useState("");
  const [customPortionSize, setCustomPortionSize] = useState("");
  const [error, setError] = useState("");

  const filteredRecipes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recipes;

    return recipes.filter((recipe) => {
      const name = recipe.name?.toLowerCase() || "";
      const type = recipe.type?.toLowerCase() || "";
      return name.includes(term) || type.includes(term);
    });
  }, [recipes, search]);

  function addSelectedRecipe() {
    const recipe = recipes.find((item) => item.id === selectedRecipeId);
    if (!recipe) {
      setError("Select a recipe first.");
      return;
    }

    setItems((current) => [
      ...current,
      {
        recipeId: recipe.id,
        recipeName: recipe.name,
        servings: Math.max(1, Number(servings) || 1),
        portionSize: portionSize.trim(),
      },
    ]);
    setSelectedRecipeId("");
    setServings(1);
    setPortionSize("");
    setError("");
  }

  function addCustomItem() {
    const name = customText.trim();
    if (!name) {
      setError("Write the custom menu item first.");
      return;
    }

    setItems((current) => [
      ...current,
      {
        recipeId: `custom-${Date.now()}`,
        recipeName: name,
        servings: 1,
        portionSize: customPortionSize.trim(),
        isCustom: true,
      },
    ]);
    setCustomText("");
    setCustomPortionSize("");
    setError("");
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateItem(index: number, field: keyof MealItem, value: string | number) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "servings") {
          return {
            ...item,
            servings: Math.max(1, Number(value) || 1),
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  function handleSave() {
    const cleanedItems = items.filter((item) => item.recipeId);
    if (cleanedItems.length === 0 && !notes.trim()) {
      setError("Add at least one recipe or note for this meal.");
      return;
    }

    onSave({
      mealType,
      time,
      items: cleanedItems,
      notes: notes.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-lg">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {mealMeta.label} -{" "}
              {fromYMD(date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Pick from recipe master or write a custom menu item.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <IoClose size={22} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-140px)] overflow-y-auto p-4">
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">
                  Meal Time
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Special instructions"
                  className="h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 text-sm font-bold text-gray-800">
                  Add Saved Recipe
                </div>
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <IoSearch size={17} className="text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search recipes"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_90px_120px_auto]">
                  <select
                    value={selectedRecipeId}
                    onChange={(event) => setSelectedRecipeId(event.target.value)}
                    className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Choose recipe</option>
                    {filteredRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                        {recipe.type ? ` (${recipe.type})` : ""}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(event) => setServings(Number(event.target.value))}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    aria-label="Servings"
                  />

                  <input
                    value={portionSize}
                    onChange={(event) => setPortionSize(event.target.value)}
                    placeholder="Portion"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />

                  <button
                    onClick={addSelectedRecipe}
                    className="flex items-center justify-center gap-2 rounded-lg bg-yellow-700 px-3 py-2 text-sm font-bold text-white hover:bg-yellow-800"
                  >
                    <IoAdd size={17} />
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-3">
                <div className="mb-2 text-sm font-bold text-yellow-950">
                  Add Custom Item
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                  <input
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="Write item name or short instruction"
                    className="rounded-lg border border-yellow-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={customPortionSize}
                    onChange={(event) => setCustomPortionSize(event.target.value)}
                    placeholder="Portion"
                    className="rounded-lg border border-yellow-300 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    onClick={addCustomItem}
                    className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800"
                  >
                    <IoAdd size={17} />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                  <IoFastFoodOutline size={17} />
                  Selected Menu Items
                </div>

                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                    No recipes selected for this meal.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={`${item.recipeId}-${index}`}
                        className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_90px_120px_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {item.recipeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.isCustom ? "Custom item" : `Recipe ${index + 1}`}
                          </p>
                        </div>

                        <input
                          type="number"
                          min="1"
                          value={item.servings}
                          onChange={(event) =>
                            updateItem(index, "servings", Number(event.target.value))
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          aria-label="Servings"
                        />

                        <input
                          value={item.portionSize || ""}
                          onChange={(event) =>
                            updateItem(index, "portionSize", event.target.value)
                          }
                          placeholder="Portion"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                        <button
                          onClick={() => removeItem(index)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                          aria-label="Remove recipe"
                        >
                          <IoTrashOutline size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-200 bg-white p-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-yellow-700 py-3 text-sm font-bold text-white hover:bg-yellow-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Meal"}
          </button>
        </div>
      </div>
    </div>
  );
}
