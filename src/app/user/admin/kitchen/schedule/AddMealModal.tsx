"use client";

import { useState } from "react";
import { ScheduledMeal, MealType, MEAL_TYPES } from "./types";
import { getMealLabel, getDefaultTime } from "./utils";
import { IoClose } from "react-icons/io5";

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mealType: MealType, time: string, notes?: string) => void;
  existingMealTypes: MealType[];
}

export default function AddMealModal({
  isOpen,
  onClose,
  onAdd,
  existingMealTypes,
}: AddMealModalProps) {
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [time, setTime] = useState("08:00");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const availableMeals = MEAL_TYPES.filter(
    (m) => !existingMealTypes.includes(m.id as MealType)
  );

  function handleAdd() {
    if (!mealType || !time) {
      setError("Please select meal type and time");
      return;
    }

    onAdd(mealType, time, notes || undefined);
    setMealType("breakfast");
    setTime("08:00");
    setNotes("");
    setError("");
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Add Meal</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <IoClose size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {availableMeals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            All meals are already added. Remove one to add another.
          </div>
        ) : (
          <>
            {/* MEAL TYPE SELECT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Meal Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableMeals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => {
                      setMealType(meal.id as MealType);
                      setTime(meal.default);
                    }}
                    className={`py-3 px-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                      mealType === meal.id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{meal.emoji}</span>
                    <span className="text-sm font-semibold">{meal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TIME INPUT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 font-semibold"
              />
            </div>

            {/* NOTES */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Special dietary requirements, preparation notes..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none"
                rows={3}
              />
            </div>

            {/* FOOTER */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Add Meal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
