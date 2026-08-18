"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/Modal";

/* ================= TYPES ================= */

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

export default function EditRecipe({ data, onClose, onSuccess }: any) {
  const [name, setName] = useState(data.name || "");
  const [type, setType] = useState(data.type || "");
  const [steps, setSteps] = useState(data.steps || ""); // 🔥 NEW

  const [materials, setMaterials] = useState<any[]>([]);

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    data.ingredients?.map((i: any) => ({
      ...i,
      quantity: String(i.quantity),
      isOptional: i.isOptional || false,
    })) || [
      {
        materialId: "",
        name: "",
        unit: "",
        quantity: "",
        isOptional: false,
      },
    ]
  );

  /* FETCH RAW MATERIALS */
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "rawMaterials"));
      setMaterials(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    };
    fetch();
  }, []);

  /* HANDLE CHANGE */
  const handleChange = (i: number, field: string, value: any) => {
    const updated = [...ingredients];

    if (field === "materialId") {
      const m = materials.find((x: any) => x.id === value);

      updated[i] = {
        materialId: value,
        name: m?.name || "",
        unit: m?.unit || "",
        quantity: "",
        isOptional: false,
      };
    } else {
      updated[i] = {
        ...updated[i],
        [field]: value,
      };
    }

    setIngredients(updated);
  };

  const addRow = () => {
    setIngredients([
      ...ingredients,
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
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  /* UPDATE */
  const handleUpdate = async () => {
    if (!name || !type) {
      alert("Please fill all fields");
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
      alert("Add at least one ingredient");
      return;
    }

    await updateDoc(doc(db, "recipes", data.id), {
      name,
      type,
      serves: 10,
      ingredients: cleanedIngredients,
      steps: steps || "", // 🔥 SAVE
    });

    onSuccess();
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="font-bold mb-3">Edit Recipe</h2>

      {/* NAME */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Recipe Name"
        className="w-full border p-2 mb-2 rounded"
      />

      {/* TYPE */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full border p-2 mb-2 rounded"
      >
        <option value="" disabled>
          Select Type *
        </option>
        {RECIPE_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      {/* 🔥 STEPS FIELD */}
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
            className="border p-2 w-1/2"
          >
            <option value="">Select Item</option>
            {materials.map((m: any) => (
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
            className="border p-2 w-1/4"
          />

          <input
            value={ing.unit}
            disabled
            className="border p-2 w-1/4 bg-gray-100"
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
        className="text-blue-600 text-sm mt-1"
      >
        + Add Ingredient
      </button>

      <button
        onClick={handleUpdate}
        className="bg-yellow-700 text-white px-4 py-2 mt-4 w-full rounded"
      >
        Update Recipe
      </button>
    </Modal>
  );
}