"use client";

import { useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/Modal";
import Input from "@/components/Input";

export default function AddBatch({ onClose, onSuccess }: any) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = async () => {
    if (!name) return alert("Name required");

    await addDoc(collection(db, "batches"), {
      name,
      description,
      createdAt: Timestamp.now(),
    });

    onSuccess();
    onClose();
  };

  return (
    <Modal>
      <h2 className="font-bold mb-3">Add Batch</h2>

      <Input label="Name" value={name} onChange={setName} />
      <Input
        label="Description"
        value={description}
        onChange={setDescription}
      />

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleAdd}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          Save
        </button>

        <button onClick={onClose} className="border px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </Modal>
  );
}