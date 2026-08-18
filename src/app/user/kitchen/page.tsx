"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackPageName from "@/components/BackHeaderButton";
import { useAuth } from "@/context/AuthContext";
import {
  IoAlertCircle,
  IoCheckmarkCircle,
  IoTime,
  IoPeople,
} from "react-icons/io5";

type MealType = "breakfast" | "lunch" | "dinner";

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
  icon: string;
  tone: string;
  badgeTone: string;
}> = [
  {
    id: "breakfast",
    label: "Breakfast",
    shortLabel: "B",
    icon: "🌅",
    tone: "border-orange-200 bg-orange-50 text-orange-950",
    badgeTone: "bg-orange-600 text-white",
  },
  {
    id: "lunch",
    label: "Lunch",
    shortLabel: "L",
    icon: "☀️",
    tone: "border-teal-200 bg-teal-50 text-teal-950",
    badgeTone: "bg-teal-700 text-white",
  },
  {
    id: "dinner",
    label: "Dinner",
    shortLabel: "D",
    icon: "🌙",
    tone: "border-violet-200 bg-violet-50 text-violet-950",
    badgeTone: "bg-violet-700 text-white",
  },
];

function toYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMealMeta(mealType: MealType) {
  return MEAL_TYPES.find((meal) => meal.id === mealType) || MEAL_TYPES[0];
}

function sortMeals(meals: ScheduledMeal[]) {
  const order: Record<MealType, number> = {
    breakfast: 0,
    lunch: 1,
    dinner: 2,
  };

  return [...meals].sort((a, b) => order[a.mealType] - order[b.mealType]);
}

export default function KitchenDailyPage() {
  const { loading: authLoading } = useAuth();
  const [todaysPlan, setTodaysPlan] = useState<DayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const ymd = toYMD(today);
    setTodayDate(ymd);

    async function loadTodaysItems() {
      if (authLoading) return;

      try {
        setLoading(true);
        setError("");

        const plansQuery = query(
          collection(db, "kitchenSchedules"),
          where("date", "==", ymd)
        );
        const snap = await getDocs(plansQuery);

        if (snap.empty) {
          setTodaysPlan(null);
        } else {
          const data = snap.docs[0].data();
          setTodaysPlan({
            id: snap.docs[0].id,
            date: data.date,
            totalDevotees: Number(data.totalDevotees || 10),
            meals: sortMeals((data.meals || []) as ScheduledMeal[]).filter(
              (meal) =>
                MEAL_TYPES.some((meta) => meta.id === meal.mealType)
            ),
          });
        }
      } catch (err: any) {
        console.error("Error loading today's kitchen items:", err);
        setError(err.message || "Unable to load kitchen items.");
      } finally {
        setLoading(false);
      }
    }

    loadTodaysItems();
  }, [authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
        <BackPageName title={"Today's Kitchen Items"} link="/user/dashboard" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
            <p className="text-gray-600">Loading today&apos;s items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <BackPageName title={"Today's Kitchen Items"} link="/user/dashboard" />

      <div className="max-w-2xl mx-auto p-4">
        {/* TODAY'S DATE */}
        <div className="bg-white rounded-lg border border-yellow-200 shadow-sm p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-2xl font-bold text-yellow-900">
              {new Date(todayDate + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <IoAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* NO ITEMS STATE */}
        {!error && !todaysPlan?.meals.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <IoAlertCircle className="text-blue-600 text-4xl mx-auto mb-3" />
            <p className="text-blue-900 font-medium mb-1">No Items Planned</p>
            <p className="text-blue-700 text-sm">
              No kitchen items have been scheduled for today yet.
            </p>
          </div>
        )}

        {/* MEALS */}
        {todaysPlan && todaysPlan.meals.length > 0 && (
          <div className="space-y-4">
            {/* DEVOTEES INFO */}
            <div className="bg-white rounded-lg border border-yellow-200 shadow-sm p-4 flex items-center gap-3">
              <IoPeople className="text-2xl text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Devotees</p>
                <p className="text-xl font-bold text-yellow-900">
                  {todaysPlan.totalDevotees} people
                </p>
              </div>
            </div>

            {/* EACH MEAL */}
            {todaysPlan.meals.map((meal) => {
              const meta = getMealMeta(meal.mealType);
              const hasItems = meal.items && meal.items.length > 0;

              return (
                <div
                  key={meal.mealType}
                  className={`rounded-lg border-2 overflow-hidden shadow-sm ${meta.tone}`}
                >
                  {/* MEAL HEADER */}
                  <div className="px-4 py-3 bg-opacity-20 flex items-center justify-between border-b-2 border-opacity-20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{meta.label}</p>
                        <div className="flex items-center gap-1 text-xs opacity-75">
                          <IoTime className="text-sm" />
                          {meal.time}
                        </div>
                      </div>
                    </div>
                    {hasItems && (
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${meta.badgeTone}`}
                      >
                        {meal.items.length} items
                      </div>
                    )}
                  </div>

                  {/* MEAL CONTENT */}
                  <div className="px-4 py-4">
                    {hasItems ? (
                      <div className="space-y-3">
                        {meal.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white bg-opacity-50 rounded-lg p-3 border border-opacity-20 flex items-start gap-3"
                          >
                            <IoCheckmarkCircle className="text-green-600 text-lg flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm break-words">
                                {item.recipeName}
                              </p>
                              {(item.servings || item.portionSize) && (
                                <p className="text-xs opacity-75 mt-1">
                                  {item.servings && `Servings: ${item.servings}`}
                                  {item.servings && item.portionSize && " • "}
                                  {item.portionSize && `Portion: ${item.portionSize}`}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* MEAL NOTES */}
                        {meal.notes && (
                          <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-opacity-20 text-sm italic">
                            <span className="font-medium">Note: </span>
                            {meal.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm opacity-75 italic">
                        No items for this meal
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
