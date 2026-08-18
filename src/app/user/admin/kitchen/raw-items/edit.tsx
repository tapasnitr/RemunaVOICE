"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/Modal";
import Input from "@/components/Input";

/* ✅ SAME CONSTANTS AS ADD */
const UNITS = [
  "kg",
  "gram",
  "liter",
  "ml",
  "piece",
  "packet",
  "dozen",
];

const MATERIAL_TYPES = [
  "Vegetable",
  "Fruits",
  "Milk Item",
  "Grocery",
];

export default function EditRawMaterial({ data, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    ...data,
    name: data.name || "",
    unit: data.unit || "",
    type: data.type || "",
  });

  const handleUpdate = async () => {
    if (!form.name || !form.unit || !form.type) {
      alert("Please fill all fields");
      return;
    }

    await updateDoc(doc(db, "rawMaterials", data.id), {
      name: form.name,
      unit: form.unit,
      type: form.type, // 🔥 NEW
    });

    onSuccess();
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="font-bold mb-3">Edit Raw Material</h2>

      {/* NAME */}
      <Input
        label="Name"
        value={form.name}
        onChange={(v: any) =>
          setForm((prev: any) => ({ ...prev, name: v }))
        }
      />

      {/* TYPE */}
      <div className="mt-2">
        <label className="text-sm block mb-1">Type</label>
        <select
          value={form.type}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, type: e.target.value }))
          }
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

      {/* UNIT */}
      <div className="mt-2">
        <label className="text-sm block mb-1">Unit</label>
        <select
          value={form.unit}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, unit: e.target.value }))
          }
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
        onClick={handleUpdate}
        className="bg-yellow-700 text-white px-4 py-2 mt-4 w-full rounded"
      >
        Update
      </button>
    </Modal>
  );
}