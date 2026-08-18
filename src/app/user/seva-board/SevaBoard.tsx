"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface TimeSlots {
  Morning?: string[];
  Afternoon?: string[];
  Evening?: string[];
  [key: string]: string[] | undefined;
}

interface Section {
  title: string;
  people?: string[];
  times?: TimeSlots;
}

interface SevaData {
  day: string;
  sections: Section[];
}

export default function SevaBoardPage() {
  const weekDays: string[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeOrder = ["Morning", "Afternoon", "Evening"];

  const [currentIndex, setCurrentIndex] = useState<number>(
    new Date().getDay()
  );
  const [data, setData] = useState<SevaData | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 📅 Format readable date
  const formatDate = (offset = 0): string => {
    const today = new Date();
    today.setDate(today.getDate() + offset);
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "long",
      year: "numeric",
    };
    return today.toLocaleDateString("en-IN", options);
  };

  // 🕉 Fetch seva data for the selected day
  const fetchDayData = async (day: string): Promise<void> => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "sevaBoards", day));
      if (docSnap.exists()) {
        setData(docSnap.data() as SevaData);
      } else {
        setData({ day, sections: [] });
      }

      // update current date text
      const today = new Date();
      const offset = (weekDays.indexOf(day) - today.getDay() + 7) % 7;
      setCurrentDate(formatDate(offset));
    } catch (err) {
      console.error("Error fetching seva:", err);
    } finally {
      setTimeout(() => setLoading(false), 500); // smooth UX
    }
  };

  useEffect(() => {
    fetchDayData(weekDays[currentIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const goPrev = (): void => {
    if (!loading) setCurrentIndex((prev) => (prev === 0 ? 6 : prev - 1));
  };

  const goNext = (): void => {
    if (!loading) setCurrentIndex((prev) => (prev === 6 ? 0 : prev + 1));
  };

  const goToday = (): void => {
    if (!loading) setCurrentIndex(new Date().getDay());
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-3xl bg-white border-4 border-yellow-700 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold tracking-wide uppercase text-yellow-900">
            {weekDays[currentIndex]} — Seva Board
          </h2>
          <p className="text-yellow-700 font-medium text-lg mt-1">
            {currentDate}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={goPrev}
              disabled={loading}
              className={`px-4 py-1 rounded-md font-semibold shadow-sm transition ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-200 hover:bg-yellow-300 text-yellow-800"
              }`}
            >
              ← Previous
            </button>
            <button
              onClick={goToday}
              disabled={loading}
              className={`px-4 py-1 rounded-md font-semibold shadow-sm transition ${
                loading
                  ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={goNext}
              disabled={loading}
              className={`px-4 py-1 rounded-md font-semibold shadow-sm transition ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-700 hover:bg-yellow-800 text-white"
              }`}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-yellow-800">
            <Loader2 className="animate-spin w-8 h-8 mb-3" />
            <p className="font-semibold text-lg">Fetching seva data...</p>
          </div>
        ) : (
          <>
            {/* Seva Sections */}
            <div className="space-y-4">
              {data?.sections?.length ? (
                data.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-3 shadow-sm bg-yellow-50 hover:bg-yellow-100 transition"
                  >
                    <div className="text-lg font-bold uppercase text-yellow-900 mb-2">
                      {sec.title}
                    </div>

                    {sec.times ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {timeOrder.map(
                          (time) =>
                            sec.times?.[time] && (
                              <div
                                key={time}
                                className="border rounded-md p-2 bg-white"
                              >
                                <span className="font-semibold text-sm text-yellow-700">
                                  {time}
                                </span>
                                <div className="mt-1 text-gray-800 font-medium whitespace-nowrap">
                                  {(() => {
                                    const p =
                                      sec.times?.[time] as
                                        | string
                                        | string[]
                                        | null
                                        | undefined;
                                    if (Array.isArray(p)) return p.join(", ");
                                    if (
                                      typeof p === "string" &&
                                      p.trim() !== ""
                                    )
                                      return p;
                                    return "-";
                                  })()}
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 ml-4">
                        {sec.people?.length ? (
                          sec.people.map((p, i) => (
                            <span
                              key={i}
                              className="text-gray-800 font-medium whitespace-nowrap"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="italic text-gray-400">-</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600">
                  No seva data available for this day.
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        {!loading && (
          <div className="text-sm text-center text-yellow-700 mt-6 border-t pt-2 font-medium">
            Remuna VOICE — {weekDays[currentIndex]} Seva Board
          </div>
        )}
      </div>
    </div>
  );
}