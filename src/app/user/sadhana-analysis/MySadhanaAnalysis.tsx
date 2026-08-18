"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Info } from "lucide-react";
import SadhanaDayDetailsModal from "./SadhanaDayDetailsModal";

/* ---------- TYPES ---------- */
interface SadhanaRecord {
  userId: string;
  date: string;

  // Soul
  japaBefore10?: number;
  personalHearing1hr?: number;
  spBookReading1hr?: number;
  bookReadingAttended?: number;
  slokaLearnt?: number;

  // Body
  dayRestBelow30?: number;
  sleptBeforeTime?: number;
  wakeUpBeforeTime?: number;
  studyOrPreaching1hr?: number;
}

interface WeeklyRow {
  date: string;
  soul: number;
  body: number;
  total: number;
  raw: SadhanaRecord | null;
}

interface Props {
  records: SadhanaRecord[];
}

/* ---------- UTILS ---------- */
const soulKeys: (keyof SadhanaRecord)[] = [
  "japaBefore10",
  "personalHearing1hr",
  "spBookReading1hr",
  "bookReadingAttended",
  "slokaLearnt",
];

const bodyKeys: (keyof SadhanaRecord)[] = [
  "dayRestBelow30",
  "sleptBeforeTime",
  "wakeUpBeforeTime",
  "studyOrPreaching1hr",
];

const calcScore = (
  r: SadhanaRecord,
  keys: (keyof SadhanaRecord)[]
) =>
  keys.reduce((s, k) => s + (r[k] === 1 ? 1 : 0), 0);

// 🇮🇳 Indian date format → "2 Jan"
const formatDateIN = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

/* ---------- COMPONENT ---------- */
export default function MySadhanaAnalysis({ records }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] =
    useState<SadhanaRecord | null>(null);

  const weeklyData: WeeklyRow[] = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - weekOffset * 7);

    const week: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      week.push(d.toISOString().split("T")[0]);
    }

    return week.map((d) => {
      const r = records.find((x) => x.date === d) || null;

      return {
        date: d,
        soul: r ? calcScore(r, soulKeys) : 0,
        body: r ? calcScore(r, bodyKeys) : 0,
        total: r ? calcScore(r, [...soulKeys, ...bodyKeys]) : 0,
        raw: r,
      };
    });
  }, [records, weekOffset]);

  const weekRange =
    weeklyData.length > 0
      ? `${formatDateIN(weeklyData[0].date)} – ${formatDateIN(
          weeklyData[weeklyData.length - 1].date
        )}`
      : "";

  return (
    <div className="space-y-6">
      {/* WEEK SELECTOR */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="text-sm px-3 py-1 bg-yellow-100 rounded"
        >
          ⬅ Previous Week
        </button>

        <div className="text-center">
          <p className="font-semibold text-yellow-800">
            Weekly Analysis
          </p>
          <p className="text-xs text-gray-600">{weekRange}</p>
        </div>

        <button
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="text-sm px-3 py-1 bg-yellow-100 rounded disabled:opacity-40"
        >
          Next Week ➡
        </button>
      </div>

      {/* GRAPH */}
      <div className="bg-white p-4 rounded shadow">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weeklyData}>
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDateIN(v)}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(l) => formatDateIN(l as string)}
            />
            <Line dataKey="soul" stroke="#ca8a04" strokeWidth={2} />
            <Line dataKey="body" stroke="#16a34a" strokeWidth={2} />
            <Line dataKey="total" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* DAILY LIST */}
      <div className="space-y-2">
        {weeklyData.map((d) => (
          <div
            key={d.date}
            className="flex justify-between items-center bg-white p-3 rounded shadow"
          >
            <span className="font-medium">
              {formatDateIN(d.date)}
            </span>
            <span className="font-bold text-indigo-700">
              {d.total}
            </span>
            {d.raw && (
              <button onClick={() => setSelectedDay(d.raw)}>
                <Info size={18} className="text-blue-600" />
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedDay && (
        <SadhanaDayDetailsModal
          record={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
