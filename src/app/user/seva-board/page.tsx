"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import BackHeader from "@/components/BackHeader";

/* =====================
 TYPES
===================== */

interface Person {
  uid: string;
  name: string;
}

interface SubSection {
  title: string;
  time: string;
  people: Person[];
}

interface Section {
  title: string;
  time?: string;
  people?: Person[];
  subSections?: SubSection[];
}

/* =====================
 HELPERS
===================== */

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

/* =====================
 PAGE
===================== */

export default function SevaBoardPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const date = todayKey();

  useEffect(() => {
    const loadBoard = async () => {
      const snap = await getDoc(
        doc(db, "dailySevaBoardAllotments", date)
      );

      if (snap.exists()) {
        setSections(snap.data()?.sections || []);
      }

      setLoading(false);
    };

    loadBoard();
  }, [date]);

  if (loading) {
    return (
      <div className="text-center py-10 text-yellow-700 font-semibold">
        Loading Seva Board…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 py-4">
      {/* HEADER */}
       <BackHeader title=" 🪔 Daily Seva Board" />
      <div className="text-center mb-4">
       
        <p className="text-sm text-gray-600">
          {new Date(date).toDateString()}
        </p>
      </div>

      {/* BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map((sec, i) => (
          <BoardCard key={i} section={sec} />
        ))}
      </div>
    </div>
  );
}

/* =====================
 BOARD CARD
===================== */

function BoardCard({ section }: { section: Section }) {
  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 shadow-sm">
      <h2 className="font-bold text-yellow-900 text-base mb-1">
        {section.title}
      </h2>

      {/* MAIN SEVA */}
      {section.people && (
        <>
          {section.time && (
            <p className="text-xs text-gray-600 mb-1">
              🕒 {section.time}
            </p>
          )}

          <PeopleRow people={section.people} />
        </>
      )}

      {/* SUB SECTIONS */}
      {section.subSections && (
        <div className="space-y-2 mt-2">
          {section.subSections.map((sub, i) => (
            <div
              key={i}
              className="bg-white rounded border border-yellow-200 px-2 py-1"
            >
              <div className="flex justify-between items-center text-xs font-semibold text-yellow-900">
                <span>{sub.title}</span>
                <span className="text-gray-600">
                  🕒 {sub.time}
                </span>
              </div>

              <PeopleRow people={sub.people} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================
 PEOPLE ROW
===================== */

function PeopleRow({ people }: { people: Person[] }) {
  if (!people || people.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic mt-1">
        Not assigned
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {people.map((p) => (
        <span
          key={p.uid}
          className="bg-yellow-200 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium"
        >
          {p.name}
        </span>
      ))}
    </div>
  );
}
