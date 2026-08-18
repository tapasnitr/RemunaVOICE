"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Info } from "lucide-react";

/* ================= TYPES ================= */

interface SadhanaDaily {
  userId: string;
  date: string;

  japaTime: number;
  personalHearingMin: number;
  spBookReadingMin: number;
  slokaLearntCount: number;

  bookReadingClass: number;
  dayRestBelow30: number;
  sleptBeforeTime: number;
  wakeUpBeforeTime: number;
  studyOrPreaching1hr: number;
}

/* ================= UTIL ================= */

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

function percent(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

function color(p: number) {
  if (p >= 90) return "text-green-600";
  if (p >= 60) return "text-yellow-600";
  return "text-red-600";
}

/* ================= PAGE ================= */

export default function MySadhanaAnalysis() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SadhanaDaily[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] =
    useState<SadhanaDaily | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const snap = await getDocs(
        collection(db, "sadhana_entries")
      );
      setRecords(
        snap.docs
          .map((d) => d.data() as SadhanaDaily)
          .filter((r) => r.userId === user.uid)
      );
    };

    load();
  }, [user]);

  /* ---------- WEEK DATA ---------- */
  const weekData = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - weekOffset * 7);

    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    return days.map((d) => {
      const r = records.find((x) => x.date === d);

      const soul =
        (r?.japaTime === 2 ? 2 : r?.japaTime === 1 ? 1 : 0) +
        (r?.personalHearingMin || 0) / 60 +
        (r?.spBookReadingMin || 0) / 60 +
        (r?.slokaLearntCount || 0);

      const body =
        (r?.bookReadingClass || 0) +
        (r?.dayRestBelow30 || 0) +
        (r?.sleptBeforeTime || 0) +
        (r?.wakeUpBeforeTime || 0) +
        (r?.studyOrPreaching1hr || 0);

      return {
        date: d,
        soul: Math.round(soul),
        body,
        total: Math.round(soul + body),
        raw: r || null,
      };
    });
  }, [records, weekOffset]);

  const totalFilled = weekData.filter((d) => d.raw).length;

  const avgTotal =
    weekData.reduce((s, d) => s + d.total, 0) / 7;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-center text-yellow-800">
        🌸 My Sadhana Progress
      </h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Consistency" value={`${totalFilled}/7`} />
        <SummaryCard
          label="Avg Score"
          value={avgTotal.toFixed(1)}
        />
        <SummaryCard label="Status" value="Steady 🌱" />
      </div>

      {/* GRAPH */}
      <div className="bg-white p-4 rounded shadow">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weekData}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
            />
            <YAxis />
            <Tooltip />
            <Line
              dataKey="soul"
              stroke="#ca8a04"
              strokeWidth={2}
            />
            <Line
              dataKey="body"
              stroke="#16a34a"
              strokeWidth={2}
            />
            <Line
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* DAILY LIST */}
      <div className="space-y-2">
        {weekData.map((d) => (
          <div
            key={d.date}
            className="flex justify-between items-center bg-white p-3 rounded shadow"
          >
            <span className="font-medium">
              {formatDate(d.date)}
            </span>

            <span
              className={`font-bold ${color(
                percent(d.total, 10)
              )}`}
            >
              {d.total}
            </span>

            {d.raw ? (
              <button onClick={() => setSelected(d.raw)}>
                <Info className="text-blue-600" size={18} />
              </button>
            ) : (
              <span className="text-xs text-gray-400">
                Not Filled
              </span>
            )}
          </div>
        ))}
      </div>

      {/* DAY DETAIL */}
      {selected && (
        <DayDetailModal
          record={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded shadow p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}

function DayDetailModal({
  record,
  onClose,
}: {
  record: SadhanaDaily;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[360px] p-5 rounded shadow">
        <h3 className="font-bold mb-3">
          Sadhana Details
        </h3>

        {Object.entries(record)
          .filter(([k]) => k !== "userId")
          .map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b py-1 text-sm"
            >
              <span className="capitalize">
                {k.replace(/([A-Z])/g, " $1")}
              </span>
              <span>{v}</span>
            </div>
          ))}

        <button
          onClick={onClose}
          className="mt-4 w-full bg-yellow-700 text-white py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
