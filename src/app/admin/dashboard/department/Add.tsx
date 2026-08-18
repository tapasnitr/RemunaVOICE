"use client";

import { useState } from "react";

import {
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import Modal from "@/components/Modal";
import Input from "@/components/Input";

interface Props {
  onClose: () => void;

  onSuccess: () => void;
}

export default function AddDepartment({
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] =
    useState("");

  const [incharge, setIncharge] =
    useState("");

  const [assistants, setAssistants] =
    useState<string[]>([""]);

  const [description, setDescription] =
    useState("");

  /* ADD ASSISTANT */

  const addAssistant = () => {
    setAssistants((prev) => [
      ...prev,
      "",
    ]);
  };

  /* CHANGE ASSISTANT */

  const changeAssistant = (
    index: number,
    value: string
  ) => {
    const updated = [...assistants];

    updated[index] = value;

    setAssistants(updated);
  };

  /* REMOVE ASSISTANT */

  const removeAssistant = (
    index: number
  ) => {
    setAssistants((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* SAVE */

  const handleAdd = async () => {
    if (!name)
      return alert(
        "Department name required"
      );

    await addDoc(
      collection(db, "departments"),
      {
        name,

        incharge,

        assistants: assistants.filter(
          (a) => a.trim() !== ""
        ),

        description,

        createdAt: Timestamp.now(),
      }
    );

    onSuccess();

    onClose();
  };

  return (
    <Modal>
        <h2 className="font-bold mb-4 text-lg">
          Add Department / Role
        </h2>

        <div className="grid md:grid-cols-1 gap-4">
          <Input
            label="Department Name / Role"
            value={name}
            onChange={setName}
          />

          <Input
            label="Incharge"
            value={incharge}
            onChange={setIncharge}
          />
        </div>

        {/* ASSISTANTS */}

        <div className="mt-4">
          <label className="font-medium text-sm">
            Assistant Devotees
          </label>

          <div className="space-y-2 mt-2">
            {assistants.map(
              (item, index) => (
                <div
                  key={index}
                  className="flex gap-2"
                >
                  <input
                    value={item}
                    onChange={(e) =>
                      changeAssistant(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Assistant Name"
                    className="w-full border rounded-lg px-3 py-2"
                  />

                  {assistants.length >
                    1 && (
                    <button
                      onClick={() =>
                        removeAssistant(
                          index
                        )
                      }
                      className="bg-red-100 text-red-700 px-3 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            )}
          </div>

          <button
            onClick={addAssistant}
            className="mt-2 text-blue-700 text-sm"
          >
            + Add Assistant
          </button>
        </div>

        {/* DESCRIPTION */}

        <div className="mt-4">
          <label className="text-sm font-medium">
            Description / Role
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            rows={4}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            placeholder="Department role and responsibilities..."
          />
        </div>

        {/* BUTTONS */}

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleAdd}
            className="bg-yellow-700 text-white px-4 py-2 rounded"
          >
            Save
          </button>

          <button
            onClick={onClose}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
    </Modal>
  );
}