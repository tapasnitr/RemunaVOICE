"use client";

import { ScheduledMeal, MealType } from "./types";
import { getMealLabel, getMealEmoji } from "./utils";
import {
  IoClose,
  IoPencil,
  IoTime,
  IoNutrition,
  IoCopy,
} from "react-icons/io5";

interface MealCardProps {
  meal: ScheduledMeal;
  mealType: MealType;
  onEdit: () => void;
  onRemove: () => void;
  onDuplicate?: () => void;
}

export default function MealCard({
  meal,
  mealType,
  onEdit,
  onRemove,
  onDuplicate,
}: MealCardProps) {
  const label = getMealLabel(mealType);
  const emoji = getMealEmoji(mealType);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:shadow-md transition">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h4 className="font-bold text-gray-800">{label}</h4>
            <div className="flex items-center gap-1 text-sm text-blue-600 font-semibold">
              <IoTime size={16} />
              {meal.time}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
              title="Duplicate meal"
            >
              <IoCopy size={18} />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
            title="Edit recipes"
          >
            <IoPencil size={18} />
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
            title="Remove meal"
          >
            <IoClose size={18} />
          </button>
        </div>
      </div>

      {/* RECIPES */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IoNutrition size={16} />
          <span className="font-semibold">
            {meal.items.length} Recipe{meal.items.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-1">
          {meal.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 mt-0.5">•</span>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{item.recipeName}</p>
                <p className="text-xs text-gray-500">
                  {item.servings} serving{item.servings !== 1 ? "s" : ""}
                  {item.portionSize && ` • ${item.portionSize}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NOTES */}
      {meal.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
          <p className="font-semibold text-xs mb-1">Notes:</p>
          {meal.notes}
        </div>
      )}
    </div>
  );
}
