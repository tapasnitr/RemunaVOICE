"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EditRecipe from "./edit";
import MobileList from "./mobile-list";

/* ================= VIEW MODAL ================= */

function ViewModal({ data, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded w-[450px] max-h-[90vh] overflow-y-auto relative">

        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-gray-600 hover:text-red-600"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold mb-2">{data.name}</h2>

        <p className="text-sm text-blue-600 mb-2">{data.type}</p>

        {/* INGREDIENTS */}
        <h4 className="font-semibold mt-3">Ingredients</h4>
        <ul className="text-sm mt-1 space-y-1">
          {data.ingredients?.map((i: any, idx: number) => (
            <li key={idx} className={i.isOptional ? "opacity-60" : ""}>
              • {i.name} - {i.quantity} {i.unit}{" "}
              {i.isOptional && "(Optional)"}
            </li>
          ))}
        </ul>

        {/* STEPS */}
        {data.steps && (
          <>
            <h4 className="font-semibold mt-3">Steps</h4>
            <p className="text-sm whitespace-pre-line">{data.steps}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= MAIN ================= */

export default function RecipeTable({ refresh, setRefresh }: any) {
  const [data, setData] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [view, setView] = useState<any>(null);

  const fetchData = async () => {
    const snap = await getDocs(collection(db, "recipes"));
    setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete recipe?")) return;
    await deleteDoc(doc(db, "recipes", id));
    setRefresh((p: boolean) => !p);
  };

  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border rounded-lg shadow">

          {/* HEADER */}
          <thead className="bg-yellow-700 text-white">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-center">Items</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No recipes found
                </td>
              </tr>
            ) : (
              data.map((d, i) => (
                <tr
                  key={d.id}
                  className={`border-t ${
                    i % 2 ? "bg-white" : "bg-yellow-50"
                  } hover:bg-yellow-100 transition`}
                >
                  <td className="p-3 font-medium">{d.name}</td>

                  <td className="p-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {d.type}
                    </span>
                  </td>

                  <td className="p-3 text-center font-semibold">
                    {d.ingredients?.length || 0}
                  </td>

                  <td className="p-3">
                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() => setView(d)}
                        className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                      >
                        👁 View
                      </button>

                      <button
                        onClick={() => setEdit(d)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleDelete(d.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        🗑 Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="md:hidden">
        <MobileList
          data={data}
          onEdit={setEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* EDIT MODAL */}
      {edit && (
        <EditRecipe
          data={edit}
          onClose={() => setEdit(null)}
          onSuccess={() => {
            setEdit(null);
            setRefresh((p: boolean) => !p);
          }}
        />
      )}

      {/* VIEW MODAL */}
      {view && (
        <ViewModal
          data={view}
          onClose={() => setView(null)}
        />
      )}
    </>
  );
}