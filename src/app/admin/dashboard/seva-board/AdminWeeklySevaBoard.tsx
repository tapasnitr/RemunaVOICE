"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface TimeSlots {
  Morning: string;
  Afternoon: string;
  Evening: string;
}

interface Section {
  title: string;
  people?: string[];
  times?: TimeSlots;
}

const defaultSections: Section[] = [
  { title: "Vegetable Purchasing", people: ["", ""] },
  { title: "Garbage Cleaning", people: [""] },
  { title: "Vegetable Cutting", people: ["", "", ""] },
  { title: "Vessel Washing", people: ["", ""] },
  { title: "Mini Cleaning", people: [""] },
  { title: "Offering", times: { Morning: "", Afternoon: "", Evening: "" } },
  { title: "Serving", times: { Morning: "", Afternoon: "", Evening: "" } },
  { title: "Book Reading", people: [""] },
  { title: "Mopping", times: { Morning: "", Afternoon: "", Evening: "" } },
];

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AdminWeeklySevaBoard() {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [dayData, setDayData] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch all days seva data
  useEffect(() => {
    const fetchAll = async () => {
      const newData: Record<string, Section[]> = {};
      for (const day of weekDays) {
        const snap = await getDoc(doc(db, "sevaBoards", day));
        if (snap.exists()) {
          const docData = snap.data();
          newData[day] = docData.sections || JSON.parse(JSON.stringify(defaultSections));
        } else {
          newData[day] = JSON.parse(JSON.stringify(defaultSections));
        }
      }
      setDayData(newData);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handlePersonChange = (
    day: string,
    secIndex: number,
    personIndex: number,
    value: string
  ) => {
    const updated = { ...dayData };
    updated[day][secIndex].people![personIndex] = value;
    setDayData(updated);
  };

  const handleTimeChange = (
    day: string,
    secIndex: number,
    slot: keyof TimeSlots,
    value: string
  ) => {
    const updated = { ...dayData };
    updated[day][secIndex].times![slot] = value;
    setDayData(updated);
  };

  // ✅ Save to Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        weekDays.map((d) =>
          setDoc(doc(db, "sevaBoards", d), {
            day: d,
            sections: dayData[d],
          })
        )
      );
      alert("✅ Weekly Seva Boards saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving seva boards");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-yellow-50 text-yellow-800">
        <div className="animate-spin h-10 w-10 border-4 border-yellow-700 border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg font-semibold">Loading seva data...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow-xl border-2 border-yellow-700">
        <h1 className="text-3xl font-bold text-center text-yellow-800 mb-6">
          Admin — Weekly Seva Board
        </h1>

        {/* Day Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {weekDays.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              disabled={saving}
              className={`px-4 py-2 rounded-md font-semibold transition ${
                selectedDay === d
                  ? "bg-yellow-700 text-white"
                  : "bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
              } ${saving && "opacity-50 cursor-not-allowed"}`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Editable Seva Sections */}
        <div className="space-y-4">
          {dayData[selectedDay]?.map((sec, secIndex) => (
            <div
              key={secIndex}
              className="border border-yellow-400 rounded-lg p-4 bg-yellow-50 shadow-sm"
            >
              <h2 className="font-bold text-yellow-900 mb-2 uppercase tracking-wide">
                {sec.title}
              </h2>

              {/* For People-based Sevas */}
              {sec.people && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {sec.people.map((p, i) => (
                    <input
                      key={i}
                      value={p}
                      onChange={(e) =>
                        handlePersonChange(selectedDay, secIndex, i, e.target.value)
                      }
                      placeholder={`Person ${i + 1}`}
                      className="border border-yellow-300 rounded px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-yellow-900 placeholder-yellow-600"
                      disabled={saving}
                    />
                  ))}
                </div>
              )}

              {/* For Time-based Sevas */}
              {sec.times && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {(["Morning", "Afternoon", "Evening"] as (keyof TimeSlots)[]).map(
                    (slot) => (
                      <div key={slot}>
                        <label className="text-sm font-semibold text-yellow-800">
                          {slot}
                        </label>
                        <input
                          value={sec.times?.[slot] || ""}
                          onChange={(e) =>
                            handleTimeChange(selectedDay, secIndex, slot, e.target.value)
                          }
                          placeholder={`${slot} Sevak`}
                          className="w-full border border-yellow-300 rounded px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-yellow-900 placeholder-yellow-600"
                          disabled={saving}
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
            saving
              ? "bg-gray-400 text-gray-100 cursor-not-allowed"
              : "bg-yellow-700 hover:bg-yellow-800 text-white"
          }`}
        >
          {saving ? "Saving..." : "💾 Save All "}
        </button>
      </div>
    </div>
  );
}
