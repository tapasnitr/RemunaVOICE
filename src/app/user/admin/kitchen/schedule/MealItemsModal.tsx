"use client";

import { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MealItem, Recipe } from "./types";
import { IoClose, IoAdd, IoTrash } from "react-icons/io5";

interface MealItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: MealItem[]) => void;
  currentItems: MealItem[];
  mealLabel: string;
}

export default function MealItemsModal({
  isOpen,
  onClose,
  onSave,
  currentItems,
  mealLabel,
}: MealItemsModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<MealItem[]>(currentItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
      setItems(currentItems);
    }
  }, [isOpen, currentItems]);

  async function fetchRecipes() {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "recipes"));
      const recipesList = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Recipe[];
      setRecipes(recipesList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAddItem() {
    setItems([
      ...items,
      {
        recipeId: "",
        recipeName: "",
        servings: 1,
        portionSize: "",
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(
    index: number,
    field: keyof MealItem,
    value: any
  ) {
    const updated = [...items];

    if (field === "recipeId") {
      const recipe = recipes.find((r) => r.id === value);
      updated[index] = {
        ...updated[index],
        recipeId: value,
        recipeName: recipe?.name || "",
      };
    } else if (field === "servings") {
      updated[index][field] = Math.max(1, Number(value) || 0);
    } else {
      updated[index][field] = value;
    }

    setItems(updated);
  }

  function handleSave() {
    const hasEmpty = items.some((item) => !item.recipeId);
    if (hasEmpty) {
      setError("Please select a recipe for all items");
      return;
    }
    onSave(items);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold">Recipes for {mealLabel}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading recipes...</div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recipes available. Add recipes first.
            </div>
          ) : (
            <>
              {/* ITEMS LIST */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Recipe {index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <IoTrash size={18} />
                        </button>
                      )}
                    </div>

                    {/* RECIPE SELECT */}
                    <select
                      value={item.recipeId}
                      onChange={(e) =>
                        handleItemChange(index, "recipeId", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Choose recipe...</option>
                      {recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>

                    {/* SERVINGS */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Servings (for 10 devotees)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.servings}
                        onChange={(e) =>
                          handleItemChange(index, "servings", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* PORTION SIZE (OPTIONAL) */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Portion Size (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 1 bowl, 2 cups"
                        value={item.portionSize || ""}
                        onChange={(e) =>
                          handleItemChange(index, "portionSize", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* ADD MORE BUTTON */}
              <button
                onClick={handleAddItem}
                className="w-full py-3 border border-dashed border-purple-300 rounded-lg text-purple-600 font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
              >
                <IoAdd size={20} />
                Add Another Recipe
              </button>
            </>
          )}
        </div>

        {/* FOOTER */}
        {!loading && recipes.length > 0 && (
          <div className="flex gap-3 p-4 border-t sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Save Recipes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
