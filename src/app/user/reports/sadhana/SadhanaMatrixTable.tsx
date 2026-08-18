"use client";

/* =====================
 TYPES
===================== */

type YesNo = 0 | 1;
type JapaTime = 0 | 1 | 2;

export interface SadhanaRecord {
  userId: string;
  date: string; // YYYY-MM-DD
  japaBefore10: JapaTime;
  personalHearing1hr: YesNo;
  spBookReading1hr: YesNo;
  bookReadingAttended: YesNo;
  slokaLearnt: YesNo;
  dayRestBelow30: YesNo;
  sleptBeforeTime: YesNo;
  wakeUpBeforeTime: YesNo;
  studyOrPreaching1hr: YesNo;
}

export interface Devotee {
  id: string;
  firstName: string;
  lastName?: string;
  features?: {
    sadhana?: boolean;
  };
}

/* =====================
 CONFIG
===================== */

const SOUL_KEYS = [
  { key: "japaBefore10", label: "Japa", marks: 2 },
  { key: "personalHearing1hr", label: "Hearing", marks: 1 },
  { key: "spBookReading1hr", label: "SP Reading", marks: 1 },
  { key: "bookReadingAttended", label: "Book Class", marks: 1 },
  { key: "slokaLearnt", label: "Sloka", marks: 1 },
] as const;

const BODY_KEYS = [
  { key: "dayRestBelow30", label: "Day Rest", marks: 1 },
  { key: "sleptBeforeTime", label: "Sleep", marks: 1 },
  { key: "wakeUpBeforeTime", label: "Wake Up", marks: 1 },
  { key: "studyOrPreaching1hr", label: "Study / Preach", marks: 1 },
] as const;

const DAILY_TOTAL = 10;

/* =====================
 HELPERS
===================== */

function percent(obtained: number, total: number) {
  return total === 0 ? 0 : Math.round((obtained / total) * 100);
}

function colorByPercent(p: number) {
  if (p >= 90) return "bg-green-500 text-white";
  if (p >= 60) return "bg-yellow-400 text-black";
  if (p >= 40) return "bg-orange-400 text-black";
  return "bg-red-600 text-white";
}

function calcItemScore(
  records: SadhanaRecord[],
  key: keyof SadhanaRecord,
  marks: number
) {
  return records.reduce(
    (sum, r) => sum + (r[key] === 1 ? marks : 0),
    0
  );
}

/* =====================
 COMPONENT
===================== */

export default function SadhanaMatrixTable({
  devotees,
  records,
  weekMode,
}: {
  devotees: Devotee[];
  records: SadhanaRecord[];
  weekMode?: boolean;
}) {
  /* =====================
   FIXED TOTAL DAYS LOGIC
  ===================== */

  const today = new Date();

  // Get dates present in records (to know which week/month we are viewing)
  const recordDates = records.map((r) => new Date(r.date));

  let totalDays = 0;

  if (weekMode) {
    if (recordDates.length === 0) {
      totalDays = 0;
    } else {
      const maxDate = new Date(
        Math.max(...recordDates.map((d) => d.getTime()))
      );

      const isCurrentWeek =
        maxDate.toDateString() === today.toDateString();

      totalDays = isCurrentWeek
        ? today.getDay() + 1 // Sunday → Today
        : 7; // Past weeks → full week
    }
  } else {
    if (recordDates.length === 0) {
      totalDays = 0;
    } else {
      const maxDate = new Date(
        Math.max(...recordDates.map((d) => d.getTime()))
      );

      const isCurrentMonth =
        maxDate.getMonth() === today.getMonth() &&
        maxDate.getFullYear() === today.getFullYear();

      totalDays = isCurrentMonth
        ? today.getDate()
        : new Date(
            maxDate.getFullYear(),
            maxDate.getMonth() + 1,
            0
          ).getDate();
    }
  }

  const maxTotalMarks = totalDays * DAILY_TOTAL;

  /* ONLY Sadhana-enabled devotees */
  const eligibleDevotees = devotees.filter(
    (d) => d.features?.sadhana
  );

  return (
    <div className="overflow-auto bg-white rounded shadow p-3">
      {/* LEGEND */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs font-semibold">
        <Legend color="bg-green-500" label="Excellent (≥ 90%)" />
        <Legend color="bg-yellow-400" label="Good (60% – 89%)" />
        <Legend color="bg-orange-400" label="Needs Improvement (40% – 59%)" />
        <Legend color="bg-red-600" label="Poor (< 40%)" />
      </div>

      <table className="min-w-full text-xs border-separate border-spacing-y-2">
        <thead className="bg-yellow-100 sticky top-0 z-10">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Days ({totalDays})</th>
            {[...SOUL_KEYS, ...BODY_KEYS].map((k) => (
              <th key={k.key} className="p-2 border">
                {k.label}
              </th>
            ))}
            <th className="p-2 border">Total</th>
            <th className="p-2 border">%</th>
          </tr>
        </thead>

        {eligibleDevotees.map((d) => {
          const userRecords = records.filter(
            (r) => r.userId === d.id
          );

          const daysFilled = new Set(
            userRecords.map((r) => r.date)
          ).size;

          const totalObtained = [...SOUL_KEYS, ...BODY_KEYS].reduce(
            (s, k) =>
              s +
              calcItemScore(
                userRecords,
                k.key as keyof SadhanaRecord,
                k.marks
              ),
            0
          );

          const totalPct = percent(
            totalObtained,
            maxTotalMarks
          );

          return (
            <tbody
              key={d.id}
              className="bg-white border border-gray-300 rounded-lg shadow-sm"
            >
              <tr className="hover:bg-yellow-50">
                <td className="p-2 font-semibold border">
                  {d.firstName} {d.lastName ?? ""} Pr
                </td>

                <td className="p-2 text-center font-semibold border">
                  {daysFilled} / {totalDays}
                </td>

                {[...SOUL_KEYS, ...BODY_KEYS].map((k) => {
                  const obtained = calcItemScore(
                    userRecords,
                    k.key as keyof SadhanaRecord,
                    k.marks
                  );
                  const max = totalDays * k.marks;
                  const pct = percent(obtained, max);

                  return (
                    <td
                      key={k.key}
                      className={`p-2 text-center border ${colorByPercent(
                        pct
                      )}`}
                    >
                      {obtained}
                    </td>
                  );
                })}

                <td className="p-2 text-center font-semibold border">
                  {totalObtained} / {maxTotalMarks}
                </td>

                <td
                  className={`p-2 text-center font-bold border ${colorByPercent(
                    totalPct
                  )}`}
                >
                  {totalPct}%
                </td>
              </tr>
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

/* =====================
 UI HELPERS
===================== */

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}
