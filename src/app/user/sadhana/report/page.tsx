"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackPageName from "@/components/BackHeaderButton";
import { SadhanaDaily, Devotee } from "./types";
import { calculateWeeklyScore } from "./scoring";

/* ================= UTIL ================= */

function getWeekRange(base: Date) {
  const d = new Date(base);
  const day = d.getDay();

  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function percent(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

function colorByPercent(p: number) {
  if (p >= 90) return "bg-green-600 text-white";
  if (p >= 60) return "bg-yellow-400 text-black";
  if (p >= 40) return "bg-orange-400 text-black";
  return "bg-red-600 text-white";
}

/* ================= PAGE ================= */

export default function WeeklySadhanaReport() {
  const [records, setRecords] = useState<SadhanaDaily[]>([]);
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [weekDate, setWeekDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [selectedDetails, setSelectedDetails] =
    useState<SadhanaDaily[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const rSnap = await getDocs(collection(db, "sadhana_entries"));
      setRecords(rSnap.docs.map((d) => d.data() as SadhanaDaily));

      const uSnap = await getDocs(collection(db, "devotees"));
      setDevotees(
        uSnap.docs.map((d) => ({
          id: d.id,
          firstName: d.data().firstName || "Devotee",
          features: d.data().features || {},
        }))
      );

      setLoading(false);
    };

    load();
  }, []);

  const { start, end } = getWeekRange(weekDate);

  const weeklyRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d >= start && d <= end;
  });

  const eligibleDevotees = devotees.filter((d) => d.features?.sadhana);

  const FULL_SOUL_MAX = 770;
  const FULL_BODY_MAX = 630;
  const FULL_WEEK_TOTAL = 1400;

  return (
    <div className="p-4 space-y-4">
      <BackPageName
        title="Weekly Sadhana Report"
        link="/user/sadhana"
      />

      {/* WEEK NAV */}
      <div className="flex justify-center gap-4">
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
          {start.toLocaleDateString("en-IN")} –{" "}
          {end.toLocaleDateString("en-IN")}
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

      {/* TABLE */}
      {loading ? (
        <p className="text-center">Loading…</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-xs border">
            <thead className="bg-yellow-100">
              <tr>
                <th rowSpan={2} className="border p-2">Name</th>
                <th colSpan={6} className="border p-2 bg-yellow-200">🟡 Soul</th>
                <th colSpan={5} className="border p-2 bg-green-200">🟢 Body</th>
                <th rowSpan={2} className="border p-2">Days</th>
                <th rowSpan={2} className="border p-2">Details</th>
                <th rowSpan={2} className="border p-2 bg-green-300">Total</th>
              </tr>
              <tr>
                <th className="border p-1">Japa</th>
                <th className="border p-1">Hearing</th>
                <th className="border p-1">SP Book</th>
                <th className="border p-1">Sloka</th>
                <th className="border p-1">Class</th>
                <th className="border p-1">Soul %</th>

                <th className="border p-1">Rest</th>
                <th className="border p-1">Sleep</th>
                <th className="border p-1">Wake</th>
                <th className="border p-1">Study</th>
                <th className="border p-1">Body %</th>
              </tr>
            </thead>

            <tbody>
              {eligibleDevotees.map((d) => {
                const userRecords = weeklyRecords.filter(
                  (r) => r.userId === d.id
                );

                const score = calculateWeeklyScore(userRecords);
                const soul = score.soul;
                const body = score.body;

                const chantingMarks = soul.chantingMarks; // max 210
                const readingHearingMarks = soul.readingHearingMarks; // max 210
                const slokaMarks = soul.slokaMarks; // max 35
                const sadhanaMarks = soul.sadhanaWeeklyMarks; // max 35
                const classMarks = soul.bookReadingWeeklyMarks; // max 70

                const soulMarks = soul.total;
                const bodyMarks = body.total;

                const soulPct = percent(soulMarks, FULL_SOUL_MAX);
                const bodyPct = percent(bodyMarks, FULL_BODY_MAX);

                const obtained = soulMarks + bodyMarks;
                const totalPct = percent(obtained, FULL_WEEK_TOTAL);

                return (
                  <tr key={d.id} className="hover:bg-yellow-50">
                    <td className="border p-2 font-semibold">
                      {d.firstName} Pr
                    </td>

                    <td className="border p-2 text-center">
                      {chantingMarks} / 210
                    </td>

                    <td className="border p-2 text-center">
                      {readingHearingMarks} / 210
                    </td>

                    <td className="border p-2 text-center">
                      {sadhanaMarks} / 35
                    </td>

                    <td className="border p-2 text-center">
                      {slokaMarks} / 35
                    </td>

                    {/* CLASS MOVED TO SOUL */}
                    <td className="border p-2 text-center">
                      {Math.min(Math.round(classMarks / 10), 7)} days ({classMarks} pts)
                    </td>

                    <td className={`border p-2 text-center font-bold ${colorByPercent(soulPct)}`}>
                      {soulPct}%
                    </td>

                    <td className="border p-2 text-center">
                      {userRecords.reduce((s, r) => s + (r.dayRestBelow30 ? 1 : 0), 0)}
                    </td>

                    <td className="border p-2 text-center">
                      {userRecords.reduce((s, r) => s + (r.sleptBeforeTime ? 1 : 0), 0)}
                    </td>

                    <td className="border p-2 text-center">
                      {userRecords.reduce((s, r) => s + (r.wakeUpBeforeTime ? 1 : 0), 0)}
                    </td>

                    <td className="border p-2 text-center">
                      {Math.round((userRecords.reduce((s, r) => s + (r.studyOrPreachingMin || 0), 0) || 0))}m
                    </td>

                    <td className={`border p-2 text-center font-bold ${colorByPercent(bodyPct)}`}>
                      {bodyPct}%
                    </td>

                    {/* NEW: DAYS FILLED */}
                    <td className="border p-2 text-center font-semibold">
                      {userRecords.length}/7
                    </td>

                    {/* NEW: DETAILS BUTTON */}
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => setSelectedDetails(userRecords)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      >
                        View
                      </button>
                    </td>

                    <td className={`border p-2 text-center font-bold ${colorByPercent(totalPct)}`}>
                      {obtained} / {FULL_WEEK_TOTAL} ({totalPct}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full max-h-[80vh] overflow-auto">
            <h3 className="font-semibold mb-3">Daily Details</h3>

            {selectedDetails.map((r) => (
              <div key={r.date} className="border-b py-2 text-sm">
                <div className="font-semibold">{r.date}</div>
                <div>Japa: {r.japaTime}</div>
                <div>Hearing: {r.personalHearingMin}m</div>
                <div>SP Book: {r.spBookReadingMin}m</div>
                <div>Sloka: {r.slokaLearntCount}</div>
                <div>Book Reading: {r.bookReadingClass}</div>
                <div>Day Rest: {r.bookReadingClass}</div>
                <div>Wake up : {r.bookReadingClass}</div>
                <div>Sleep: {r.bookReadingClass}</div>
                <div>Study: {r.studyOrPreachingMin}m</div>
              </div>
            ))}

            <button
              onClick={() => setSelectedDetails(null)}
              className="mt-3 w-full bg-yellow-700 text-white py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
