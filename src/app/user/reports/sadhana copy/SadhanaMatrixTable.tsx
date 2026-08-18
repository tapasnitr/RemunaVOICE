"use client";

/* =======================
 TYPES
======================= */

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

/* =======================
 CONFIG
======================= */

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

const DAILY_TOTAL_MARKS = 10;

/* =======================
 HELPERS
======================= */

function daysTillDate(year: number, month: number): number {
  const today = new Date();
  if (
    today.getFullYear() === year &&
    today.getMonth() === month
  ) {
    return today.getDate();
  }
  return new Date(year, month + 1, 0).getDate();
}

function percent(obtained: number, total: number): number {
  return total === 0 ? 0 : Math.round((obtained / total) * 100);
}

function colorByPercent(p: number): string {
  if (p >= 90) return "bg-green-500 text-white";
  if (p >= 60) return "bg-yellow-400 text-black";
  if (p >= 40) return "bg-orange-400 text-black";
  return "bg-red-600 text-white";
}

function calcItemScore(
  records: SadhanaRecord[],
  key: keyof SadhanaRecord,
  marks: number
): number {
  return records.reduce(
    (sum: number, r) => sum + (r[key] === 1 ? marks : 0),
    0
  );
}

/* =======================
 COMPONENT
======================= */

interface Props {
  devotees: Devotee[];
  records: SadhanaRecord[];
  year: number;
  month: number; // 0-based
}

export default function SadhanaMatrixTable({
  devotees,
  records,
  year,
  month,
}: Props) {
  const totalDays = daysTillDate(year, month);
  const maxTotalMarks = totalDays * DAILY_TOTAL_MARKS;

  // ✅ ONLY devotees with sadhana permission
  console.log(devotees);
  const eligibleDevotees = devotees.filter(
    (d) => d.features?.sadhana == true
  );

  return (
    <div>  <div className="flex flex-wrap gap-3 items-center mb-3 text-xs font-semibold">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 bg-green-500 rounded"></span>
        <span>Excellent (≥ 90%)</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-4 h-4 bg-yellow-400 rounded"></span>
        <span>Good (60% – 89%)</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-4 h-4 bg-orange-400 rounded"></span>
        <span>Needs Improvement (40% – 59%)</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-4 h-4 bg-red-600 rounded"></span>
        <span>Poor (&lt; 40%)</span>
      </div>
    </div>

      <div className="overflow-auto bg-white rounded shadow">

        <table className="min-w-full text-xs border">
          <thead>
            <tr>
              <th rowSpan={2} className="bg-yellow-300 p-2 border sticky left-0 z-10">
                Name
              </th>

              <th rowSpan={2} className="bg-purple-300 p-2 border">
                Days Filled
              </th>

              <th colSpan={SOUL_KEYS.length} className="bg-blue-300 p-2 border">
                SOUL
              </th>

              <th colSpan={BODY_KEYS.length} className="bg-green-300 p-2 border">
                BODY
              </th>

              <th rowSpan={2} className="bg-gray-300 p-2 border">
                Total<br />Marks
              </th>

              <th rowSpan={2} className="bg-gray-400 p-2 border">
                %
              </th>
            </tr>

            <tr>
              {SOUL_KEYS.map((k) => (
                <th key={k.key} className="bg-blue-100 p-1 border">
                  {k.label}
                </th>
              ))}
              {BODY_KEYS.map((k) => (
                <th key={k.key} className="bg-green-100 p-1 border">
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {eligibleDevotees.map((d) => {
              const userRecords = records.filter(
                (r) => r.userId === d.id
              );

              // Days filled (unique dates)
              const daysFilled = new Set(
                userRecords.map((r) => r.date)
              ).size;

              /* ---- TOTAL SCORE ---- */
              const totalObtained = [...SOUL_KEYS, ...BODY_KEYS].reduce(
                (s: number, k) =>
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
                <tr key={d.id} className="hover:bg-yellow-50">
                  {/* NAME */}
                  <td className="border p-2 font-semibold sticky left-0 bg-white">
                    {d.firstName} {d.lastName ?? ""} Pr
                  </td>

                  {/* DAYS FILLED */}
                  <td className="border p-2 text-center font-semibold">
                    {daysFilled} / {totalDays}
                  </td>

                  {/* SOUL */}
                  {SOUL_KEYS.map((k) => {
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
                        className={`border p-1 text-center ${colorByPercent(
                          pct
                        )}`}
                      >
                        {obtained}
                      </td>
                    );
                  })}

                  {/* BODY */}
                  {BODY_KEYS.map((k) => {
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
                        className={`border p-1 text-center ${colorByPercent(
                          pct
                        )}`}
                      >
                        {obtained}
                      </td>
                    );
                  })}

                  {/* TOTAL */}
                  <td className="border p-2 text-center font-semibold">
                    {totalObtained} / {maxTotalMarks}
                  </td>

                  <td
                    className={`border p-2 text-center font-bold ${colorByPercent(
                      totalPct
                    )}`}
                  >
                    {totalPct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>

  );
}
