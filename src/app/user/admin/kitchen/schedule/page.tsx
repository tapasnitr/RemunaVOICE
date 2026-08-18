"use client";

import { useEffect, useState } from "react";
import BackPageName from "@/components/BackHeaderButton";
import MealCard from "./MealCard";
import MealItemsModal from "./MealItemsModal";
import AddMealModal from "./AddMealModal";
import {
  MEAL_TYPES,
  KitchenSchedule,
  ScheduledMeal,
  MealType,
  MealItem,
} from "./types";
import {
  todayYMD,
  getNextDays,
  fetchSchedule,
  saveSchedule,
  deleteSchedule,
  validateSchedule,
  getMealLabel,
  getMealsSorted,
} from "./utils";
import {
  IoAdd,
  IoTrash,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoCalendar,
  IoRefresh,
  IoDownload,
} from "react-icons/io5";

export default function KitchenSchedulePlannerPage() {
  const [selectedDate, setSelectedDate] = useState(todayYMD());
  const [schedule, setSchedule] = useState<ScheduledMeal[]>([]);
  const [totalDevotees, setTotalDevotees] = useState(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [editingMealType, setEditingMealType] = useState<MealType | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);

  const dates = getNextDays(14);
  const existingMealTypes = schedule.map((m) => m.mealType);

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  async function loadSchedule() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchSchedule(selectedDate);

      if (data.schedule) {
        setSchedule(data.schedule.meals || []);
        setTotalDevotees(data.schedule.totalDevotees || 10);
      } else {
        setSchedule([]);
        setTotalDevotees(10);
      }
      setValidationErrors([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setError("");
      setSuccess("");
      const errors = validateSchedule(schedule);

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      setSaving(true);
      await saveSchedule(selectedDate, schedule, totalDevotees);
      setSuccess(`Schedule saved for ${selectedDate}`);
      setValidationErrors([]);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddMeal(mealType: MealType, time: string, notes?: string) {
    const newMeal: ScheduledMeal = {
      mealType,
      time,
      items: [],
      notes,
    };
    setSchedule([...schedule, newMeal]);
    setValidationErrors([]);
  }

  function handleEditItems(mealType: MealType) {
    setEditingMealType(mealType);
    setShowItemsModal(true);
  }

  function handleSaveItems(items: MealItem[]) {
    if (editingMealType === null) return;

    setSchedule(
      schedule.map((meal) =>
        meal.mealType === editingMealType ? { ...meal, items } : meal
      )
    );
    setValidationErrors([]);
  }

  function handleRemoveMeal(mealType: MealType) {
    setSchedule(schedule.filter((m) => m.mealType !== mealType));
    setValidationErrors([]);
  }

  function handleDuplicateMeal(mealType: MealType) {
    const original = schedule.find((m) => m.mealType === mealType);
    if (!original) return;

    const availableMeal = MEAL_TYPES.find(
      (m) => !existingMealTypes.includes(m.id as MealType)
    );
    if (!availableMeal) {
      setError("All meal types are already added");
      return;
    }

    const duplicate: ScheduledMeal = {
      ...original,
      mealType: availableMeal.id as MealType,
      items: original.items.map((item) => ({ ...item })),
    };
    setSchedule([...schedule, duplicate]);
  }

  function handleUpdateTime(mealType: MealType, newTime: string) {
    setSchedule(
      schedule.map((meal) =>
        meal.mealType === mealType ? { ...meal, time: newTime } : meal
      )
    );
  }

  function handleUpdateNotes(mealType: MealType, newNotes: string) {
    setSchedule(
      schedule.map((meal) =>
        meal.mealType === mealType ? { ...meal, notes: newNotes } : meal
      )
    );
  }

  const sortedMeals = getMealsSorted({ meals: schedule } as any);

  const currentMeal = editingMealType
    ? schedule.find((m) => m.mealType === editingMealType)
    : null;

  return (
    <div className="min-h-screen bg-yellow-50">
      <BackPageName title="Kitchen Schedule Planner" link="/user/admin/kitchen" />

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* DATE SELECTOR */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Date
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map(({ ymd, label }) => (
              <button
                key={ymd}
                onClick={() => setSelectedDate(ymd)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                  selectedDate === ymd
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-gray-300 hover:border-purple-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* DEVOTEES COUNT */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Total Devotees
          </label>
          <input
            type="number"
            min="1"
            value={totalDevotees}
            onChange={(e) => setTotalDevotees(Math.max(1, Number(e.target.value)))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 font-semibold"
          />
          <p className="text-xs text-gray-500 mt-2">
            Recipes will be scaled based on this number (recipes are for 10 devotees)
          </p>
        </div>

        {/* ERRORS & SUCCESS */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg mb-4 flex gap-2">
            <IoAlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-300 text-green-700 p-4 rounded-lg mb-4 flex gap-2">
            <IoCheckmarkCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2">Validation Errors:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-12">
            <IoRefresh size={32} className="mx-auto animate-spin text-purple-600 mb-2" />
            <p>Loading schedule...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* MEALS LIST */}
            {schedule.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-gray-300 mb-6">
                <IoCalendar size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-semibold mb-3">No meals added yet</p>
                <button
                  onClick={() => setShowAddMealModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  <IoAdd size={20} />
                  Add Your First Meal
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {sortedMeals.map((meal) => (
                  <div key={meal.mealType} className="space-y-2">
                    {/* TIME EDITOR */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-3">
                      <div className="text-2xl">
                        {MEAL_TYPES.find((m) => m.id === meal.mealType)?.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600">
                          {getMealLabel(meal.mealType)}
                        </p>
                      </div>
                      <input
                        type="time"
                        value={meal.time}
                        onChange={(e) =>
                          handleUpdateTime(meal.mealType, e.target.value)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm font-semibold"
                      />
                    </div>

                    {/* MEAL CARD */}
                    <MealCard
                      meal={meal}
                      mealType={meal.mealType}
                      onEdit={() => handleEditItems(meal.mealType)}
                      onRemove={() => handleRemoveMeal(meal.mealType)}
                      onDuplicate={() => handleDuplicateMeal(meal.mealType)}
                    />

                    {/* NOTES EDITOR */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <input
                        type="text"
                        value={meal.notes || ""}
                        onChange={(e) =>
                          handleUpdateNotes(meal.mealType, e.target.value)
                        }
                        placeholder="Add notes for this meal..."
                        className="w-full text-sm border-0 focus:outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
              <div className="max-w-2xl mx-auto flex gap-3">
                {schedule.length < 5 && (
                  <button
                    onClick={() => setShowAddMealModal(true)}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <IoAdd size={20} />
                    Add Meal
                  </button>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || schedule.length === 0}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Schedule"}
                </button>

                {schedule.length > 0 && (
                  <button
                    onClick={() => {
                      setSchedule([]);
                      setValidationErrors([]);
                    }}
                    className="py-3 px-4 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition"
                    title="Clear all meals"
                  >
                    <IoTrash size={20} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* MODALS */}
        <AddMealModal
          isOpen={showAddMealModal}
          onClose={() => setShowAddMealModal(false)}
          onAdd={handleAddMeal}
          existingMealTypes={existingMealTypes}
        />

        {editingMealType && currentMeal && (
          <MealItemsModal
            isOpen={showItemsModal}
            onClose={() => {
              setShowItemsModal(false);
              setEditingMealType(null);
            }}
            onSave={handleSaveItems}
            currentItems={currentMeal.items}
            mealLabel={getMealLabel(editingMealType)}
          />
        )}
      </div>
    </div>
  );
}
