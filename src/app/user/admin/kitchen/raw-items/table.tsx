"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EditRawMaterial from "./edit";
import MobileList from "./mobile-list";

export default function RawMaterialTable({ refresh, setRefresh }: any) {
  const [data, setData] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);

  /* 🔥 SEARCH */
  const [search, setSearch] = useState("");

  /* 🔥 PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = async () => {
    const snap = await getDocs(collection(db, "rawMaterials"));
    setData(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete item?")) return;
    await deleteDoc(doc(db, "rawMaterials", id));
    setRefresh((prev: boolean) => !prev);
  };

  /* 🔥 FILTER DATA */
  const filteredData = data.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* 🔥 PAGINATED DATA */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* 🔍 SEARCH BAR */}
      <div className="flex justify-between items-center mb-3">
        <input
          type="text"
          placeholder="Search material..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full md:w-1/3"
        />
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border rounded-lg shadow">

          <thead className="bg-yellow-700 text-white">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((d, i) => (
                <tr
                  key={d.id}
                  className={`border-t ${
                    i % 2 ? "bg-white" : "bg-yellow-50"
                  } hover:bg-yellow-100`}
                >
                  <td className="p-3 font-medium">{d.name}</td>

                  <td className="p-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {d.type || "-"}
                    </span>
                  </td>

                  <td className="p-3">{d.unit}</td>

                  <td className="p-3 text-green-700 font-semibold">
                    {d.stock} {d.unit}
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
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

      {/* 📱 MOBILE */}
      <div className="md:hidden">
        <MobileList data={paginatedData} onEdit={setEdit} onDelete={handleDelete} />
      </div>

      {/* 🔥 PAGINATION */}
      <div className="flex justify-between items-center mt-4">

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

      {/* EDIT MODAL */}
      {edit && (
        <EditRawMaterial
          data={edit}
          onClose={() => setEdit(null)}
          onSuccess={() => {
            setEdit(null);
            setRefresh((prev: boolean) => !prev);
          }}
        />
      )}
    </>
  );
}