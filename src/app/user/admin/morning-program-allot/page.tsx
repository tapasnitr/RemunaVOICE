"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import Select from "react-select";
import {
  formatIndianDate,
  getIndianWeekDates,
} from "@/utils/date";

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
  completed: boolean;
}

interface Section {
  title: string;
  type: "people" | "time" | "text";
  people?: Person[];
  value?: string;
}

/* =====================
 MORNING PROGRAM TEMPLATE
===================== */

const MORNING_TEMPLATE: Section[] = [
  { title: "Deity Wake Up", type: "people", people: [] },
  { title: "Temple Hall Mopping", type: "people", people: [] },

  { title: "Wake Up Time", type: "time", value: "" },
  { title: "Mangal Arti Time", type: "time", value: "" },
  { title: "Class Time", type: "time", value: "" },

  { title: "Deity Worship", type: "people", people: [] },
  { title: "Tulsi Worship", type: "people", people: [] },

  { title: "Mangal Arti", type: "people", people: [] },
  { title: "Narashimha Arti", type: "people", people: [] },
  { title: "Tulsi Pranam", type: "people", people: [] },
  { title: "Sayan Kirtan", type: "people", people: [] },

  { title: "Class Place", type: "text", value: "" },
];

/* =====================
 DATE HELPERS
===================== */

/* =====================
 PAGE
===================== */

export default function AdminMorningProgram() {
  const [weekOffset, setWeekOffset] = useState(1);
  const weekDates = useMemo(() => getIndianWeekDates(weekOffset), [weekOffset]);
  const [selectedDay, setSelectedDay] = useState(weekDates[0]?.label ?? "Monday");
  const [devotees, setDevotees] = useState<DevoteeOption[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const selectedDate = useMemo(
    () =>
      weekDates.find((day) => day.label === selectedDay)
        ?.dateString ?? weekDates[0].dateString,
    [selectedDay, weekDates]
  );

  useEffect(() => {
    setSelectedDay((current) =>
      weekDates.some((day) => day.label === current)
        ? current
        : weekDates[0]?.label ?? "Monday"
    );
  }, [weekDates]);

  const previousDate = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 7);
    return date.toISOString().split("T")[0];
  }, [selectedDate]);
  const [saving, setSaving] = useState(false);

  /* 🔹 LOAD DEVOTEES */
  useEffect(() => {
    const loadDevotees = async () => {
      const snap = await getDocs(collection(db, "devotees"));
      setDevotees(
        snap.docs.map((d) => ({
          value: d.id,
          label: `${d.data().firstName || ""} Pr`.trim(),
        }))
      );
    };
    loadDevotees();
  }, []);

  /* 🔹 LOAD DAY DATA */
  useEffect(() => {
    const loadDay = async () => {
      const currentRef = doc(db, "morningProgramAllotments", selectedDate);
      const currentSnap = await getDoc(currentRef);

      if (currentSnap.exists()) {
        setSections(currentSnap.data().sections ?? JSON.parse(JSON.stringify(MORNING_TEMPLATE)));
        return;
      }

      const previousRef = doc(db, "morningProgramAllotments", previousDate);
      const previousSnap = await getDoc(previousRef);
      if (previousSnap.exists()) {
        setSections(previousSnap.data().sections ?? JSON.parse(JSON.stringify(MORNING_TEMPLATE)));
        return;
      }

      setSections(JSON.parse(JSON.stringify(MORNING_TEMPLATE)));
    };

    loadDay();
  }, [selectedDate, previousDate]);

  /* 🔹 SAVE */
  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, "morningProgramAllotments", selectedDate), {
      date: selectedDate,
      sections,
    });
    setSaving(false);
    alert("✅ Morning Program saved for " + formatIndianDate(selectedDate));
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-2">
        Morning Program Allotment
      </h1>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-600 mb-2">
            Editing weekly morning program allotment.
          </p>
          <p className="text-sm text-gray-600">
            Week: <strong>{weekDates[0].formattedDate}</strong> — <strong>{weekDates[6].formattedDate}</strong>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((offset) => offset - 1)}
            className="rounded-full border border-yellow-200 bg-white px-3 py-2 text-yellow-800 hover:bg-yellow-50"
            aria-label="Previous week"
          >
            ←
          </button>
          <div className="rounded-xl bg-yellow-50 border border-yellow-100 px-4 py-2 text-sm text-yellow-900">
            {selectedDay}, {formatIndianDate(selectedDate)}
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset((offset) => offset + 1)}
            className="rounded-full border border-yellow-200 bg-white px-3 py-2 text-yellow-800 hover:bg-yellow-50"
            aria-label="Next week"
          >
            →
          </button>
        </div>
      </div>

      {/* DAY BUTTONS */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {weekDates.map((day) => (
          <button
            key={day.label}
            onClick={() => setSelectedDay(day.label)}
            className={`px-3 py-1 rounded text-sm font-semibold ${
              selectedDay === day.label
                ? "bg-yellow-700 text-white"
                : "bg-yellow-200"
            }`}
          >
            {day.label}
            <div className="text-xs">{day.formattedDate}</div>
          </button>
        ))}
      </div>

      {/* SECTIONS */}
      {sections.map((sec, i) => (
        <div
          key={i}
          className="border rounded p-4 mb-4 bg-yellow-50"
        >
          <h2 className="font-bold mb-2">{sec.title}</h2>

          {/* PEOPLE */}
          {sec.type === "people" && (
            <Select
              options={devotees}
              isMulti
              value={sec.people?.map((p) => ({
                value: p.uid,
                label: p.name,
              }))}
              onChange={(vals) => {
                const copy = [...sections];
                copy[i].people =
                  vals?.map((v) => ({
                    uid: v.value,
                    name: v.label,
                    completed: false,
                  })) || [];
                setSections(copy);
              }}
            />
          )}

          {/* TIME */}
          {sec.type === "time" && (
            <input
              type="time"
              value={sec.value || ""}
              onChange={(e) => {
                const copy = [...sections];
                copy[i].value = e.target.value;
                setSections(copy);
              }}
              className="border px-3 py-2 rounded w-full"
            />
          )}

          {/* TEXT */}
          {sec.type === "text" && (
            <input
              value={sec.value || ""}
              onChange={(e) => {
                const copy = [...sections];
                copy[i].value = e.target.value;
                setSections(copy);
              }}
              placeholder="Enter details"
              className="border px-3 py-2 rounded w-full"
            />
          )}
        </div>
      ))}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-yellow-700 text-white py-3 rounded font-semibold"
      >
        {saving ? "Saving..." : "💾 Save Morning Program"}
      </button>
    </div>
  );
}
