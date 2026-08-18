"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import Select from "react-select";

/* =====================
 TYPES
===================== */

interface DevoteeOption {
  value: string;
  label: string;
}

interface Person {
  uid: string;
  name: string;
}

interface SubSection {
  title: string;
  time: string; // HH:mm
  people: Person[];
}

interface Section {
  title: string;
  time?: string; // HH:mm
  people?: Person[];
  subSections?: SubSection[];
}

/* =====================
 CONSTANTS
===================== */

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SEVA_TEMPLATE: Section[] = [
  { title: "Vegetable Purchasing", time: "17:00", people: [] },
  { title: "Garbage Cleaning", time: "", people: [] },
  { title: "Vegetable Cutting", time: "06:00", people: [] },
  { title: "Vessel Washing", time: "15:00", people: [] },
  { title: "Mini Cleaning", time: "", people: [] },

  {
    title: "Offering",
    subSections: [
      { title: "Morning", time: "07:00", people: [] },
      { title: "Afternoon", time: "11:45", people: [] },
      { title: "Evening", time: "18:00", people: [] },
    ],
  },
  {
    title: "Serving",
    subSections: [
      { title: "Morning", time: "07:15", people: [] },
      { title: "Afternoon", time: "12:00", people: [] },
      { title: "Evening", time: "18:15", people: [] },
    ],
  },
  { title: "Book Reading", time: "", people: [] },
  {
    title: "Mopping",
    subSections: [
      { title: "Morning", time: "08:30", people: [] },
      { title: "Afternoon", time: "", people: [] },
      { title: "Evening", time: "", people: [] },
    ],
  },
];

/* =====================
 DATE HELPERS
===================== */

function getDateForDay(day: string) {
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 7 : today.getDay();
  const targetIndex = WEEK_DAYS.indexOf(day) + 1;

  let diff = targetIndex - todayIndex;
  if (diff < 0) diff += 7;

  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().split("T")[0];
}

/* =====================
 PAGE
===================== */

export default function AdminDailySeva() {
  const [devotees, setDevotees] = useState<DevoteeOption[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedDate, setSelectedDate] = useState("");
  const [saving, setSaving] = useState(false);

  /* LOAD DEVOTEES */
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "devotees"));
      setDevotees(
        snap.docs.map((d) => ({
          value: d.id,
          label: `${d.data().firstName || ""} Pr`,
        }))
      );
    };
    load();
  }, []);

  /* LOAD DAY */
  useEffect(() => {
    const loadDay = async () => {
      const date = getDateForDay(selectedDay);
      setSelectedDate(date);

      const snap = await getDoc(doc(db, "dailySevaBoardAllotments", date));

      if (!snap.exists()) {
        setSections(structuredClone(SEVA_TEMPLATE));
        return;
      }

      setSections(snap.data()?.sections ?? structuredClone(SEVA_TEMPLATE));
    };

    loadDay();
  }, [selectedDay]);

  /* SAVE */
  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, "dailySevaBoardAllotments", selectedDate), {
      date: selectedDate,
      sections,
    });
    setSaving(false);
    alert("✅ Saved for " + selectedDate);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-2">
        Daily Seva Allotment
      </h1>

      <p className="text-center text-sm mb-4">
        Date: <strong>{selectedDate}</strong>
      </p>

      {/* DAY BUTTONS */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {WEEK_DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-3 py-1 rounded font-semibold ${
              selectedDay === d
                ? "bg-yellow-700 text-white"
                : "bg-yellow-200"
            }`}
          >
            {d}
            <div className="text-xs">{getDateForDay(d)}</div>
          </button>
        ))}
      </div>

      {/* SECTIONS */}
      {sections.map((sec, i) => (
        <div key={i} className="border rounded p-4 mb-4 bg-yellow-50">
          <h2 className="font-bold text-lg">{sec.title}</h2>

          {/* MAIN SEVA */}
          {sec.people && (
            <>
              <input
                type="time"
                className="border px-2 py-1 rounded text-sm my-2 w-32"
                value={sec.time || ""}
                onChange={(e) => {
                  const copy = [...sections];
                  copy[i].time = e.target.value;
                  setSections(copy);
                }}
              />

              <Select
                isMulti
                options={devotees}
                value={sec.people.map((p) => ({
                  value: p.uid,
                  label: p.name,
                }))}
                onChange={(vals) => {
                  const copy = [...sections];
                  copy[i].people =
                    vals?.map((v) => ({
                      uid: v.value,
                      name: v.label,
                    })) || [];
                  setSections(copy);
                }}
              />
            </>
          )}

          {/* SUB SECTIONS */}
          {sec.subSections?.map((sub, si) => (
            <div
              key={si}
              className="mt-4 border-l-4 border-yellow-600 pl-3"
            >
              <p className="font-semibold">{sub.title}</p>

              <input
                type="time"
                className="border px-2 py-1 rounded text-sm my-1 w-32"
                value={sub.time}
                onChange={(e) => {
                  const copy = [...sections];
                  copy[i].subSections![si].time = e.target.value;
                  setSections(copy);
                }}
              />

              <Select
                isMulti
                options={devotees}
                value={sub.people.map((p) => ({
                  value: p.uid,
                  label: p.name,
                }))}
                onChange={(vals) => {
                  const copy = [...sections];
                  copy[i].subSections![si].people =
                    vals?.map((v) => ({
                      uid: v.value,
                      name: v.label,
                    })) || [];
                  setSections(copy);
                }}
              />
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-yellow-700 text-white py-3 rounded font-semibold"
      >
        {saving ? "Saving..." : "💾 Save Seva"}
      </button>
    </div>
  );
}
