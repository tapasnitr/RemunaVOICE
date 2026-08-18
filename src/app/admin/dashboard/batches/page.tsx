"use client";

import { useState } from "react";
import BatchTable from "./table";
import AddBatch from "./add";

export default function BatchPage() {
  const [refresh, setRefresh] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  return (
    <div className="p-6 bg-white rounded-xl shadow border">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Batches</h1>

        <button
          onClick={() => setOpenAdd(true)}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          + Add Batch
        </button>
      </div>

      <BatchTable refresh={refresh} setRefresh={setRefresh} />

      {openAdd && (
        <AddBatch
          onClose={() => setOpenAdd(false)}
          onSuccess={() => setRefresh(!refresh)}
        />
      )}
    </div>
  );
}