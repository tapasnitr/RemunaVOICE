"use client";

import { useEffect, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import EditDepartment from "./Edit";

interface Department {
  id: string;

  name: string;

  incharge?: string;

  assistants?: string[];

  description?: string;
}

interface Props {
  refresh: boolean;

  setRefresh: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

export default function DepartmentTable({
  refresh,
  setRefresh,
}: Props) {
  const [data, setData] = useState<
    Department[]
  >([]);

  const [editData, setEditData] =
    useState<Department | null>(null);

  /* FETCH */

  const fetchData = async () => {
    const snap = await getDocs(
      collection(db, "departments")
    );

    const list = snap.docs.map((d) => ({
      id: d.id,

      ...(d.data() as Omit<
        Department,
        "id"
      >),
    }));

    setData(list);
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  /* DELETE */

  const handleDelete = async (
    id: string
  ) => {
    const ok = confirm(
      "Delete this department?"
    );

    if (!ok) return;

    await deleteDoc(
      doc(db, "departments", id)
    );

    setRefresh((prev) => !prev);
  };

  return (
    <>
      <div className="overflow-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-yellow-700 text-white">
            <tr>
              <th className="p-3 text-left">
                Department
              </th>

              <th className="p-3 text-left">
                Incharge
              </th>

              <th className="p-3 text-left">
                Assistants
              </th>

              <th className="p-3 text-left">
                Description
              </th>

              <th className="p-3 text-center">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, i) => (
              <tr
                key={item.id}
                className={
                  i % 2
                    ? "bg-white"
                    : "bg-yellow-50"
                }
              >
                <td className="p-3">
                  {item.name}
                </td>

                <td className="p-3">
                  {item.incharge || "-"}
                </td>

                <td className="p-3">
                  {item.assistants?.join(
                    ", "
                  ) || "-"}
                </td>

                <td className="p-3">
                  {item.description ||
                    "-"}
                </td>

                <td className="p-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                      onClick={() =>
                        setEditData(item)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="px-3 py-1 bg-red-100 text-red-700 rounded"
                      onClick={() =>
                        handleDelete(
                          item.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT */}

      {editData && (
        <EditDepartment
          data={editData}
          onClose={() =>
            setEditData(null)
          }
          onSuccess={() => {
            setEditData(null);

            setRefresh(
              (prev) => !prev
            );
          }}
        />
      )}
    </>
  );
}