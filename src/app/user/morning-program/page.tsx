"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import BackHeader from "@/components/BackHeader";
import { db } from "@/lib/firebase";
import { formatIndianDate, getIndianWeekDates } from "@/utils/date";

interface Person {
  uid: string;
  name: string;
  completed?: boolean;
}

interface Section {
  title: string;
  type?: "people" | "time" | "text";
  people?: Person[];
  value?: string;
  time?: string;
  subSections?: {
    title: string;
    time?: string;
    people: Person[];
  }[];
}

export default function MorningProgramWeekPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = useMemo(() => getIndianWeekDates(weekOffset), [weekOffset]);
  const [selectedDay, setSelectedDay] = useState(weekDays[0]?.label ?? "Monday");
  const [weekProgram, setWeekProgram] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedDay((current) =>
      weekDays.some((day) => day.label === current)
        ? current
        : weekDays[0]?.label ?? "Monday"
    );
  }, [weekDays]);

  useEffect(() => {
    const loadWeekProgram = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          weekDays.map(async (day) => {
            const ref = doc(db, "morningProgramAllotments", day.dateString);
            const snap = await getDoc(ref);
            return {
              dateString: day.dateString,
              sections: snap.exists() ? (snap.data()?.sections ?? []) : [],
            };
          })
        );

        const data: Record<string, Section[]> = {};
        results.forEach((row) => {
          data[row.dateString] = row.sections;
        });

        setWeekProgram(data);
      } finally {
        setLoading(false);
      }
    };

    loadWeekProgram();
  }, [weekDays]);

  if (loading) {
    return (
      <div className="text-center py-16 text-yellow-700 font-semibold">
        Loading weekly morning program…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-10">
      <BackHeader title="Morning Program" />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-600 mb-2">
            View the morning program schedule for the selected week.
          </p>
          <p className="text-xs text-gray-500">
            {formatIndianDate(weekDays[0].dateString)} — {formatIndianDate(weekDays[6].dateString)}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((offset) => offset - 1)}
            className="rounded-full border border-yellow-200 bg-white px-3 py-2 text-yellow-800 hover:bg-yellow-50"
          >
            ← Prev Week
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((offset) => offset + 1)}
            className="rounded-full border border-yellow-200 bg-white px-3 py-2 text-yellow-800 hover:bg-yellow-50"
          >
            Next Week →
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {weekDays.map((day) => (
          <button
            key={day.dateString}
            type="button"
            onClick={() => setSelectedDay(day.label)}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              selectedDay === day.label
                ? "bg-yellow-700 text-white border-yellow-700"
                : "bg-white text-yellow-900 border-yellow-200 hover:bg-yellow-50"
            }`}
          >
            <div>{day.label}</div>
            <div className="text-xs text-gray-500">{day.formattedDate}</div>
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {weekDays
          .filter((day) => day.label === selectedDay)
          .map((day) => {
            const sections = weekProgram[day.dateString] ?? [];
            return (
              <section
              key={day.dateString}
              className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-lg font-semibold text-yellow-800">
                    {day.label}
                  </p>
                  <p className="text-sm text-gray-600">{day.formattedDate}</p>
                </div>
                <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                  {sections.length > 0 ? "Scheduled" : "Not scheduled"}
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-yellow-300 p-4 text-sm text-gray-700">
                  No morning program has been allotted for this day yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div
                      key={`${day.dateString}-${index}`}
                      className="rounded-2xl border border-yellow-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-semibold text-yellow-800">
                          {section.title}
                        </h3>
                        {section.type === "time" && (
                          <span className="text-sm text-gray-600">
                            {section.value || section.time || "—"}
                          </span>
                        )}
                      </div>

                      {section.type === "text" && (
                        <p className="mt-3 text-sm text-gray-700">
                          {section.value || "No details provided."}
                        </p>
                      )}

                      {section.type === "people" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {section.people?.length ? (
                            section.people.map((person) => (
                              <span
                                key={person.uid}
                                className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-900"
                              >
                                {person.name}
                                {person.completed ? " ✅" : ""}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No devotee assigned.
                            </p>
                          )}
                        </div>
                      )}

                      {section.subSections?.length ? (
                        <div className="mt-4 space-y-3">
                          {section.subSections.map((sub, subIndex) => (
                            <div
                              key={`${day.dateString}-${index}-sub-${subIndex}`}
                              className="rounded-2xl bg-yellow-50 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="font-semibold text-yellow-700">
                                  {sub.title}
                                </p>
                                <span className="text-sm text-gray-600">
                                  {sub.time || "—"}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {sub.people.length ? (
                                  sub.people.map((person) => (
                                    <span
                                      key={person.uid}
                                      className="rounded-full bg-white px-3 py-1 text-sm text-yellow-900 border border-yellow-200"
                                    >
                                      {person.name}
                                      {person.completed ? " ✅" : ""}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No devotees assigned.
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
