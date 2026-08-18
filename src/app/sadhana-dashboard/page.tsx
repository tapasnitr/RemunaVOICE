"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SadhanaMatrixTable from "./SadhanaMatrixTable";
import { Devotee, SadhanaRecord } from "./types";

export default function AdminSadhanaDashboard() {
  const [records, setRecords] = useState<SadhanaRecord[]>([]);
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const load = async () => {
      const rSnap = await getDocs(collection(db, "sadhana_cards"));
      setRecords(rSnap.docs.map((d) => d.data() as SadhanaRecord));

      const uSnap = await getDocs(collection(db, "devotees"));
      setDevotees(
        uSnap.docs.map((d) => ({
          id: d.id,
          firstName: d.data().firstName || "Devotee",
          features: d.data().features || {},
        }))
      );
    };
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">
        📊 Admin Sadhana Dashboard
      </h1>

      {/* MONTH SELECT */}
      <div className="flex gap-3 justify-center">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border p-1 rounded"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {new Date(2024, i).toLocaleString("en-IN", {
                month: "long",
              })}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-1 rounded"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      <SadhanaMatrixTable
        records={records.filter((r) => {
          const d = new Date(r.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })}
        devotees={devotees}
        year={year}
        month={month}
      />
    </div>
  );
}
