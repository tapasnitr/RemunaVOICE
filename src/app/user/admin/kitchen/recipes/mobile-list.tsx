"use client";

import { useState } from "react";

/* ================= VIEW MODAL ================= */

function ViewModal({ data, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded w-[90%] max-h-[90vh] overflow-y-auto relative">

        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-gray-600"
        >
          ✕
        </button>

        <h2 className="font-bold text-lg">{data.name}</h2>
        <p className="text-blue-600 text-sm">{data.type}</p>

        {/* INGREDIENTS */}
        <h4 className="font-semibold mt-3">Ingredients</h4>
        <ul className="text-sm space-y-1">
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

export default function MobileList({ data, onEdit, onDelete }: any) {
  const [view, setView] = useState<any>(null);

  return (
    <>
      <div className="space-y-3">
        {data.map((d: any) => (
          <div
            key={d.id}
            className="border rounded-lg p-3 shadow bg-white"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">{d.name}</p>

              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {d.type}
              </span>
            </div>

            {/* INFO */}
            <p className="text-sm text-gray-500 mt-1">
              {d.ingredients?.length || 0} items
            </p>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-3">

              <button
                onClick={() => setView(d)}
                className="flex-1 text-xs bg-gray-100 py-2 rounded"
              >
                👁 View
              </button>

              <button
                onClick={() => onEdit(d)}
                className="flex-1 text-xs bg-blue-100 text-blue-700 py-2 rounded"
              >
                ✏️ Edit
              </button>

              <button
                onClick={() => onDelete(d.id)}
                className="flex-1 text-xs bg-red-100 text-red-700 py-2 rounded"
              >
                🗑 Delete
              </button>

            </div>
          </div>
        ))}
      </div>

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