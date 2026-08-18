"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import BackPageName from "@/components/BackHeaderButton";

/* =====================
 TYPES
===================== */
type Status = "not_started" | "ongoing" | "completed";

interface Book {
  name: string;
}

/* =====================
 BOOK DATA
===================== */
const SEMESTERS: { title: string; books: Book[] }[] = [
  {
    title: "1st Semester",
    books: [
      { name: "Science of Self‑Realisation (Ch. 1–5)" },
      { name: "Coming Back" },
      { name: "Perfect Question, Perfect Answer" },
      { name: "Matchless Gift" },
      { name: "Rāja‑vidyā" },
      { name: "Elevation to Kṛṣṇa Consciousness" },
      { name: "Beyond Birth & Death" },
      { name: "Kṛṣṇa – Reservoir of Pleasure" },
    ],
  },
  {
    title: "2nd Semester",
    books: [
      { name: "SSR (Ch. 6–8)" },
      { name: "Laws of Nature" },
      { name: "Dharma" },
      { name: "Second Chance" },
      { name: "Īśopaniṣad (Mantras 1–10)" },
      { name: "Teachings of Queen Kuntī" },
      { name: "Enlightenment by Natural Path" },
      { name: "Kṛṣṇa Book (1–21)" },
    ],
  },
  {
    title: "3rd Semester",
    books: [
      { name: "Life Comes from Life" },
      { name: "Teachings of Prahlāda Mahārāja" },
      { name: "Journey of Self‑Discovery" },
      { name: "Teachings of Queen Kuntī (Hearing)" },
      { name: "Teachings of Lord Kapila" },
      { name: "Nectar of Instruction (1–6)" },
      { name: "Bhagavad‑gītā As It Is (1–6)" },
      { name: "Kṛṣṇa Book (24–28)" },
    ],
  },
  {
    title: "4th Semester",
    books: [
      { name: "Nectar of Instruction (7–11)" },
      { name: "Path of Perfection" },
      { name: "Civilization & Transcendence" },
      { name: "Hare Kṛṣṇa Challenge" },
      { name: "Bhagavad‑gītā (7–12)" },
      { name: "Teachings of Lord Caitanya" },
      { name: "Śrīmad‑Bhāgavatam Canto 1 (1–6)" },
      { name: "Kṛṣṇa Book (35–59)" },
    ],
  },
  {
    title: "5th Semester",
    books: [
      { name: "Bhagavad‑gītā (13–18)" },
      { name: "Śrīmad‑Bhāgavatam Canto 1 (7–13)" },
      { name: "Kṛṣṇa Book (63–78)" },
    ],
  },
  {
    title: "6th Semester",
    books: [
      { name: "Śrīmad‑Bhāgavatam Canto 1 (14–19)" },
      { name: "Kṛṣṇa Book (78–89)" },
    ],
  },
];

/* =====================
 PAGE
===================== */
export default function BookReadingPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);

  /* LOAD */
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "book_reading", user.uid));
      if (snap.exists()) {
        setProgress(snap.data().progress || {});
      }
    };
    load();
  }, [user]);

  /* UPDATE */
  const updateStatus = async (book: string, status: Status) => {
    if (!user) return;
    const updated = { ...progress, [book]: status };
    setProgress(updated);
    setSaving(true);

    await setDoc(
      doc(db, "book_reading", user.uid),
      { progress: updated },
      { merge: true }
    );

    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto px-3 pb-24 space-y-6">
      <BackPageName
        link="/user/sadhana"
        title="📚 Book Reading"
        backPageName="Back"
      />

      {/* QUOTE */}
      <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded-md text-sm italic text-gray-800">
        “If you read my books, you will find the answers to all your questions.”
        <span className="block mt-1 font-semibold">— Śrīla Prabhupāda</span>
      </div>

      {/* CONTENT */}
      {SEMESTERS.map((sem) => (
        <div key={sem.title} className="space-y-3">
          <h2 className="text-base font-bold text-yellow-800">
            {sem.title}
          </h2>

          {sem.books.map((b) => {
            const status = progress[b.name] || "not_started";

            const rowStyle =
              status === "completed"
                ? "bg-green-100 border-green-400"
                : status === "ongoing"
                ? "bg-yellow-100 border-yellow-400"
                : "bg-white border-gray-300";

            return (
              <div
                key={b.name}
                className={`rounded-lg border p-3 flex flex-col gap-2 ${rowStyle}`}
              >
                {/* BOOK NAME */}
                <div className="font-semibold text-gray-900 text-sm leading-snug">
                  {b.name}
                </div>

                {/* STATUS + LABEL */}
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={status}
                    onChange={(e) =>
                      updateStatus(b.name, e.target.value as Status)
                    }
                    className="border rounded px-3 py-1 text-sm bg-white w-full"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>

                  <span className="text-xs font-medium min-w-[80px] text-right">
                    {status === "completed" && "✅ Done"}
                    {status === "ongoing" && "⏳ Reading"}
                    {status === "not_started" && "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {saving && (
        <p className="text-center text-xs text-gray-500">
          Saving progress…
        </p>
      )}
    </div>
  );
}
