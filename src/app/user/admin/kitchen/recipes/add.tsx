"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/Modal";

/* ================= TYPES ================= */

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
}

interface Ingredient {
  materialId: string;
  name: string;
  unit: string;
  quantity: string;
  isOptional: boolean;
}

/* ================= CONSTANT ================= */

const RECIPE_TYPES = [
  "Beverages",
  "Breakfast Items",
  "Chutneys",
  "Dal",
  "Ekadashi",
  "Jam & Pickles",
  "Kadhi / Raita",
  "Khichadi",
  "Masalas",
  "Rice",
  "Rotis",
  "Sabji's Dry",
  "Sabji's Wet",
  "Soups / Salads",
  "Sweets",
];

/* ================= COMPONENT ================= */

export default function AddRecipe({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [steps, setSteps] = useState(""); // 🔥 NEW
  const [error, setError] = useState("");

  const [materials, setMaterials] = useState<RawMaterial[]>([]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {
      materialId: "",
      name: "",
      unit: "",
      quantity: "",
      isOptional: false,
    },
  ]);

  /* FETCH RAW MATERIALS */
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "rawMaterials"));

      const list: RawMaterial[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RawMaterial, "id">),
      }));

      setMaterials(list);
    };

    fetch();
  }, []);

  /* HANDLE CHANGE */
  const handleChange = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredients];

    if (field === "materialId") {
      const selected = materials.find((m) => m.id === value);

      updated[index] = {
        materialId: value,
        name: selected?.name || "",
        unit: selected?.unit || "",
        quantity: "",
        isOptional: false,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }

    setIngredients(updated);
  };

  const addRow = () => {
    setIngredients((prev) => [
      ...prev,
      {
        materialId: "",
        name: "",
        unit: "",
        quantity: "",
        isOptional: false,
      },
    ]);
  };

  const removeRow = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  /* SUBMIT */
  const handleSubmit = async () => {
    if (!name) {
      setError("Recipe name is required");
      return;
    }

    if (!type) {
      setError("Please select a recipe type");
      return;
    }

    const cleanedIngredients = ingredients
      .filter((i) => i.materialId && i.quantity)
      .map((i) => ({
        materialId: i.materialId,
        name: i.name,
        unit: i.unit,
        quantity: Number(i.quantity),
        isOptional: i.isOptional,
      }));

    if (cleanedIngredients.length === 0) {
      setError("Add at least one ingredient");
      return;
    }

    setError("");

    await addDoc(collection(db, "recipes"), {
      name,
      type,
      serves: 10,
      ingredients: cleanedIngredients,
      steps: steps || "", // 🔥 OPTIONAL FIELD
      createdAt: new Date(),
    });

    onSuccess();
    onClose();
  };

  /* UI */

  return (
    <Modal onClose={onClose}>
      <h2 className="font-bold mb-3">Add Recipe</h2>

      {error && (
        <p className="text-red-600 text-sm mb-2">{error}</p>
      )}

      {/* NAME */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Recipe Name"
        className="border w-full mb-2 p-2 rounded"
      />

      {/* TYPE */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border w-full mb-2 p-2 rounded"
      >
        <option value="" disabled>
          Select Type *
        </option>
        {RECIPE_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      {/* 🔥 STEPS (NEW) */}
      <textarea
        value={steps}
        onChange={(e) => setSteps(e.target.value)}
        placeholder="Steps / Process (optional)"
        className="border w-full mb-3 p-2 rounded h-24"
      />

      {/* INGREDIENTS */}
      <h4 className="font-semibold mt-2">Ingredients</h4>

      <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-sm mb-2">
        📌 Quantities are for <b>10 devotees</b>
      </div>

      {ingredients.map((ing, i) => (
        <div
          key={i}
          className={`flex gap-2 mb-2 items-center ${
            ing.isOptional ? "opacity-60" : ""
          }`}
        >
          <select
            value={ing.materialId}
            onChange={(e) =>
              handleChange(i, "materialId", e.target.value)
            }
            className="w-1/2 border p-2 rounded"
          >
            <option value="">Select Item</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Qty"
            value={ing.quantity}
            onChange={(e) =>
              handleChange(i, "quantity", e.target.value)
            }
            className="w-1/4 border p-2 rounded"
          />

          <input
            value={ing.unit}
            disabled
            className="w-1/4 border p-2 bg-gray-100 rounded"
          />

          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={ing.isOptional}
              onChange={(e) => {
                const updated = [...ingredients];
                updated[i].isOptional = e.target.checked;
                setIngredients(updated);
              }}
            />
            <span className="text-xs">Opt</span>
          </div>

          {ingredients.length > 1 && (
            <button
              onClick={() => removeRow(i)}
              className="text-red-600"
            >
              ❌
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addRow}
        className="text-blue-600 text-sm"
      >
        + Add Ingredient
      </button>

      <button
        onClick={handleSubmit}
        className="bg-yellow-700 text-white px-4 py-2 mt-3 w-full rounded"
      >
        Save
      </button>
    </Modal>
  );
}