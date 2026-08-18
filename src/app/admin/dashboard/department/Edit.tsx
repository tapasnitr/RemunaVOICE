"use client";

import { useState } from "react";

import {
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import Modal from "@/components/Modal";
import Input from "@/components/Input";

interface Props {
  data: any;

  onClose: () => void;

  onSuccess: () => void;
}

export default function EditDepartment({
  data,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] =
    useState(data.name);

  const [incharge, setIncharge] =
    useState(data.incharge || "");

  const [assistants, setAssistants] =
    useState<string[]>(
      data.assistants || [""]
    );

  const [description, setDescription] =
    useState(
      data.description || ""
    );

  const addAssistant = () => {
    setAssistants((prev) => [
      ...prev,
      "",
    ]);
  };

  const changeAssistant = (
    index: number,
    value: string
  ) => {
    const updated = [...assistants];

    updated[index] = value;

    setAssistants(updated);
  };

  const removeAssistant = (
    index: number
  ) => {
    setAssistants((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleUpdate = async () => {
    await updateDoc(
      doc(
        db,
        "departments",
        data.id
      ),
      {
        name,

        incharge,

        assistants: assistants.filter(
          (a) => a.trim() !== ""
        ),

        description,
      }
    );

    onSuccess();
  };

  return (
    <Modal>
      <div className="bg-white p-5 rounded-xl w-full md:w-[700px]">
        <h2 className="font-bold mb-4 text-lg">
          Edit Department
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Department Name"
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
          />
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleUpdate}
            className="bg-yellow-700 text-white px-4 py-2 rounded"
          >
            Update
          </button>

          <button
            onClick={onClose}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}