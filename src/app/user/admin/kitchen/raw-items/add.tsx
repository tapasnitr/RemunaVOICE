"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Input from "@/components/Input";
import Modal from "@/components/Modal";

/* ✅ UNITS */
const UNITS = [
  "kg",
  "gram",
  "liter",
  "ml",
  "piece",
  "packet",
  "dozen",
];

/* ✅ TYPES */
const MATERIAL_TYPES = [
  "Vegetable",
  "Fruits",
  "Milk Item",
  "Grocery",
];

export default function AddRawMaterial({ onClose, onSuccess }: any) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState("");

  const handleSubmit = async () => {
    if (!name || !unit || !type) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "rawMaterials"), {
      name,
      unit,
      type,        // 🔥 NEW FIELD
      stock: 0,
      createdAt: new Date(),
    });

    onSuccess();
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="font-bold mb-3">Add Raw Material</h2>

      {/* NAME */}
      <Input label="Name" value={name} onChange={setName} />

      {/* TYPE SELECT */}
      <div className="mt-2">
        <label className="text-sm block mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Select Type</option>
          {MATERIAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* UNIT SELECT */}
      <div className="mt-2">
        <label className="text-sm block mb-1">Unit</label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Select Unit</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* SAVE */}
      <button
        onClick={handleSubmit}
        className="bg-yellow-700 text-white px-4 py-2 mt-4 w-full rounded"
      >
        Save
      </button>
    </Modal>
  );
}