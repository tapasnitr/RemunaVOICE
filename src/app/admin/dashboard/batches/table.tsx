"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import EditBatch from "./edit";

interface Batch {
  id: string;
  name: string;
  description?: string;
}

export default function BatchTable({
  refresh,
  setRefresh,
}: any) {
  const [data, setData] = useState<Batch[]>([]);
  const [editData, setEditData] = useState<Batch | null>(null);

  const fetchData = async () => {
    const snap = await getDocs(collection(db, "batches"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    setData(list);
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  /* DELETE */
  const handleDelete = async (id: string) => {
    const ok = confirm("Delete this batch?");
    if (!ok) return;

    await deleteDoc(doc(db, "batches", id));
    setRefresh((prev: boolean) => !prev);
  };

  return (
    <>
      <table className="w-full border text-sm">
        <thead className="bg-yellow-700 text-white">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Description</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((b, i) => (
            <tr key={b.id} className={i % 2 ? "bg-white" : "bg-yellow-50"}>
              <td className="p-2">{b.name}</td>
              <td className="p-2">{b.description || "-"}</td>

              <td className="p-2">
                <div className="flex gap-2 justify-center">

                  {/* EDIT */}
                  <button
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                    onClick={() => setEditData(b)}
                  >
                    Edit
                  </button>

                  {/* DELETE */}
                  <button
                    className="px-3 py-1 bg-red-100 text-red-700 rounded"
                    onClick={() => handleDelete(b.id)}
                  >
                    Delete
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editData && (
        <EditBatch
          data={editData}
          onClose={() => setEditData(null)}
          onSuccess={() => {
            setEditData(null);
            setRefresh((prev: boolean) => !prev);
          }}
        />
      )}
    </>
  );
}