"use client";

export default function MobileList({ data, onEdit, onDelete }: any) {
  return (
    <div className="space-y-3">
      {data.map((d: any) => (
        <div key={d.id} className="border p-3 rounded shadow">

          <p className="font-bold">{d.name}</p>
          <p className="text-sm text-gray-600">
            {d.stock} {d.unit}
          </p>

          <div className="flex gap-2 mt-2">
            <button onClick={() => onEdit(d)} className="bg-blue-100 px-2 py-1 rounded">
              Edit
            </button>

            <button onClick={() => onDelete(d.id)} className="bg-red-100 px-2 py-1 rounded">
              Delete
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}