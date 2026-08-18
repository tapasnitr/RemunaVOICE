"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/Modal";
import Input from "@/components/Input";

export default function EditBatch({ data, onClose, onSuccess }: any) {
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description || "");

  const handleUpdate = async () => {
    await updateDoc(doc(db, "batches", data.id), {
      name,
      description,
    });

    onSuccess();
  };

  return (
    <Modal>
      <h2 className="font-bold mb-3">Edit Batch</h2>

      <Input label="Name" value={name} onChange={setName} />
      <Input
        label="Description"
        value={description}
        onChange={setDescription}
      />

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleUpdate}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          Update
        </button>

        <button onClick={onClose} className="border px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </Modal>
  );
}