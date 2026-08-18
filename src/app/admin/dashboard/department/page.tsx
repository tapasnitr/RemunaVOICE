"use client";

import { useState } from "react";

import DepartmentTable from "./Table";
import AddDepartment from "./Add";

export default function DepartmentPage() {
  const [refresh, setRefresh] =
    useState(false);

  const [openAdd, setOpenAdd] =
    useState(false);

  return (
    <div className="p-6 bg-white rounded-xl shadow border">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">
          Departments
        </h1>

        <button
          onClick={() =>
            setOpenAdd(true)
          }
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          + Add Department
        </button>
      </div>

      <DepartmentTable
        refresh={refresh}
        setRefresh={setRefresh}
      />

      {openAdd && (
        <AddDepartment
          onClose={() =>
            setOpenAdd(false)
          }
          onSuccess={() =>
            setRefresh(!refresh)
          }
        />
      )}
    </div>
  );
}