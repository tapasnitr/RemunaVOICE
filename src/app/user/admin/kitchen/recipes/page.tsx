"use client";

import { useState } from "react";
import RecipeTable from "./table";
import AddRecipe from "./add";
import BackPageName from "@/components/BackHeaderButton";

export default function RecipePage() {
  const [refresh, setRefresh] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 bg-white rounded shadow">
      <BackPageName title="Recipes" link="/user/admin/kitchen" />
      <div className="flex justify-between mb-4">
        {/* <h2 className="text-xl font-bold">Recipes</h2> */}

        <button
          onClick={() => setOpen(true)}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          + Add Recipe
        </button>
      </div>

      <RecipeTable refresh={refresh} setRefresh={setRefresh} />

      {open && (
        <AddRecipe
          onClose={() => setOpen(false)}
          onSuccess={() => setRefresh(!refresh)}
        />
      )}
    </div>
  );
}