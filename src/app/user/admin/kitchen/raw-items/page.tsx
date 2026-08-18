"use client";

import { useState } from "react";
import RawMaterialTable from "./table";
import AddRawMaterial from "./add";
import BackPageName from "@/components/BackHeaderButton";

export default function RawMaterialPage() {
  const [refresh, setRefresh] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 bg-white rounded shadow">
      <BackPageName title="Raw Materials" link="/user/admin/kitchen" />

      <div className="flex justify-between mb-4">
        {/* <h2 className="text-xl font-bold">Raw Materials</h2> */}

        <button
          onClick={() => setOpen(true)}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          + Add
        </button>
      </div>

      <RawMaterialTable refresh={refresh} setRefresh={setRefresh} />

      {open && (
        <AddRawMaterial
          onClose={() => setOpen(false)}
          onSuccess={() => setRefresh(!refresh)}
        />
      )}
    </div>
  );
}