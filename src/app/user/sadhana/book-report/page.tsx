"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackPageName from "@/components/BackHeaderButton";

/* =====================
 TYPES
===================== */
type Status = "not_started" | "ongoing" | "completed";

interface Devotee {
  id: string;
  firstName: string;
  lastName?: string;
}

interface BookProgressDoc {
  progress?: Record<string, Status>;
}

/* =====================
 BOOK LIST (SINGLE SOURCE)
===================== */
const BOOKS: string[] = [
  // 1st Semester
  "Science of Self‑Realisation (Ch. 1–5)",
  "Coming Back",
  "Perfect Question, Perfect Answer",
  "Matchless Gift",
  "Rāja‑vidyā",
  "Elevation to Kṛṣṇa Consciousness",
  "Beyond Birth & Death",
  "Kṛṣṇa – Reservoir of Pleasure",

  // 2nd Semester
  "SSR (Ch. 6–8)",
  "Laws of Nature",
  "Dharma",
  "Second Chance",
  "Īśopaniṣad (Mantras 1–10)",
  "Teachings of Queen Kuntī",
  "Enlightenment by Natural Path",
  "Kṛṣṇa Book (1–21)",

  // 3rd Semester
  "Life Comes from Life",
  "Teachings of Prahlāda Mahārāja",
  "Journey of Self‑Discovery",
  "Teachings of Queen Kuntī (Hearing)",
  "Teachings of Lord Kapila",
  "Nectar of Instruction (1–6)",
  "Bhagavad‑gītā As It Is (1–6)",
  "Kṛṣṇa Book (24–28)",

  // 4th Semester
  "Nectar of Instruction (7–11)",
  "Path of Perfection",
  "Civilization & Transcendence",
  "Hare Kṛṣṇa Challenge",
  "Bhagavad‑gītā (7–12)",
  "Teachings of Lord Caitanya",
  "Śrīmad‑Bhāgavatam Canto 1 (1–6)",
  "Kṛṣṇa Book (35–59)",

  // 5th Semester
  "Bhagavad‑gītā (13–18)",
  "Śrīmad‑Bhāgavatam Canto 1 (7–13)",
  "Kṛṣṇa Book (63–78)",

  // 6th Semester
  "Śrīmad‑Bhāgavatam Canto 1 (14–19)",
  "Kṛṣṇa Book (78–89)",
];

/* =====================
 PAGE
===================== */
export default function BookReadingReportPage() {
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [progressMap, setProgressMap] = useState<
    Record<string, Record<string, Status>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      /* LOAD DEVOTEES */
      const dSnap = await getDocs(collection(db, "devotees"));
      const devoteesList: Devotee[] = dSnap.docs.map((d) => ({
        id: d.id,
        firstName: d.data().firstName || "Devotee",
        lastName: d.data().lastName,
      }));
      setDevotees(devoteesList);

      /* LOAD BOOK READING PROGRESS */
      const pSnap = await getDocs(collection(db, "book_reading"));
      const map: Record<string, Record<string, Status>> = {};

      pSnap.docs.forEach((doc) => {
        const data = doc.data() as BookProgressDoc;
        map[doc.id] = data.progress || {};
      });

      setProgressMap(map);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-yellow-700 font-semibold">
        Loading Book Reading Report…
      </div>
    );
  }

  return (
    <div className="px-3 pb-10">
      <BackPageName
        link="/user/sadhana"
        title="📊 Book Reading Report"
        backPageName="Back"
      />

      <div className="overflow-auto border rounded-lg bg-white shadow-sm">
        <table className="min-w-max text-xs border-collapse">
          {/* HEADER */}
          <thead className="sticky top-0 z-10 bg-yellow-100">
            <tr>
              <th className="sticky left-0 z-20 bg-yellow-100 border p-2 text-left min-w-[140px]">
                Devotee
              </th>
              {BOOKS.map((b) => (
                <th key={b} className="border p-2 min-w-[120px] text-center">
                  {b}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {devotees.map((d) => {
              const userProgress = progressMap[d.id] || {};

              return (
                <tr key={d.id} className="hover:bg-yellow-50">
                  {/* NAME */}
                  <td className="sticky left-0 bg-white border p-2 font-semibold">
                    {d.firstName} {d.lastName ?? ""} Pr
                  </td>

                  {/* BOOK STATUS */}
                  {BOOKS.map((book) => {
                    const status = userProgress[book] || "not_started";

                    const cellStyle =
                      status === "completed"
                        ? "bg-green-100 text-green-800 font-semibold"
                        : status === "ongoing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-50 text-gray-400";

                    return (
                      <td
                        key={book}
                        className={`border p-2 text-center ${cellStyle}`}
                      >
                        {status === "completed" && "✅"}
                        {status === "ongoing" && "⏳"}
                        {status === "not_started" && "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* LEGEND */}
      <div className="flex gap-4 mt-4 text-xs font-medium">
        <Legend color="bg-green-100" label="Completed" />
        <Legend color="bg-yellow-100" label="Ongoing" />
        <Legend color="bg-gray-100" label="Not Started" />
      </div>
    </div>
  );
}

/* =====================
 LEGEND
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
      <span className={`w-4 h-4 rounded ${color} border`} />
      <span>{label}</span>
    </div>
  );
}
