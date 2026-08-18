"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackHeader from "@/components/BackHeader";
import SadhanaMatrixTable from "./SadhanaMatrixTable";
import { getWeekRange } from "./utils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* =====================
 TYPES
===================== */

interface SadhanaRecord {
  userId: string;
  date: string;
  japaBefore10: 0 | 1 | 2;
  personalHearing1hr: 0 | 1;
  spBookReading1hr: 0 | 1;
  bookReadingAttended: 0 | 1;
  slokaLearnt: 0 | 1;
  dayRestBelow30: 0 | 1;
  sleptBeforeTime: 0 | 1;
  wakeUpBeforeTime: 0 | 1;
  studyOrPreaching1hr: 0 | 1;
}

interface Devotee {
  id: string;
  firstName: string;
  lastName?: string;
  features?: {
    sadhana?: boolean;
  };
}

/* =====================
 PAGE
===================== */

export default function SadhanaReportPage() {
  const [records, setRecords] = useState<SadhanaRecord[]>([]);
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [loading, setLoading] = useState(true);

  /* MODE */
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");

  /* WEEK STATE */
  const [weekDate, setWeekDate] = useState(new Date());

  /* MONTH STATE */
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const rSnap = await getDocs(collection(db, "sadhana_cards"));
      setRecords(rSnap.docs.map((d) => d.data() as SadhanaRecord));

      const uSnap = await getDocs(collection(db, "devotees"));
      setDevotees(
        uSnap.docs.map((d) => ({
          id: d.id,
          firstName: d.data().firstName || "Devotee",
          lastName: d.data().lastName,
          features: d.data().features || {},
        }))
      );

      setLoading(false);
    };

    load();
  }, []);

  /* WEEK FILTER */
  const { start, end } = getWeekRange(weekDate);
  const weeklyRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d >= start && d <= end;
  });

  /* MONTH FILTER */
  const monthlyRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <div className="p-4 space-y-4">
      <BackHeader title="Sadhana Report" />

      {/* MODE SWITCH */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setMode("weekly")}
          className={`px-4 py-1 rounded font-semibold text-sm ${
            mode === "weekly"
              ? "bg-yellow-700 text-white"
              : "border text-yellow-800"
          }`}
        >
          Weekly Sadhana
        </button>

        <button
          onClick={() => setMode("monthly")}
          className={`px-4 py-1 rounded font-semibold text-sm ${
            mode === "monthly"
              ? "bg-yellow-700 text-white"
              : "border text-yellow-800"
          }`}
        >
          Monthly Sadhana
        </button>
      </div>

      {/* WEEK CONTROLS */}
      {mode === "weekly" && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() =>
              setWeekDate(
                new Date(weekDate.getTime() - 7 * 86400000)
              )
            }
            className="border px-3 py-1 rounded"
          >
            ◀ Prev
          </button>

          <span className="font-semibold text-sm">
            {start.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}{" "}
            –{" "}
            {end.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>

          <button
            onClick={() =>
              setWeekDate(
                new Date(weekDate.getTime() + 7 * 86400000)
              )
            }
            className="border px-3 py-1 rounded"
          >
            Next ▶
          </button>
        </div>
      )}

      {/* MONTH CONTROLS */}
      {mode === "monthly" && (
        <div className="flex justify-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border px-2 py-1 rounded"
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
            className="border px-2 py-1 rounded"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <p className="text-center text-yellow-700">Loading…</p>
      ) : (
        <SadhanaMatrixTable
          records={mode === "weekly" ? weeklyRecords : monthlyRecords}
          devotees={devotees}
          weekMode={mode === "weekly"}
        />
      )}
    </div>
  );
}
