"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackHeader from "@/components/BackHeader";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";

/* ======================
 TYPES
====================== */

type InteractionType = "camp_class" | "normal_meet" | "mmc";
type OutcomeType = "improved" | "neutral" | "room_closed";

interface Interaction {
  id: string;
  date: string;
  mentorId: string;
  menteeId: string;
  interactionType: InteractionType;
  duration?: number;
  outcome: OutcomeType;
  issues?: string;
  guidance?: string;
  comments?: string;
  followUp?: string;
}

/* ======================
 PAGE
====================== */

export default function InteractionReportPage() {
  const router = useRouter();

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [mentors, setMentors] = useState<Record<string, string>>({});
  const [mentees, setMentees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  /* ---- Filters ---- */
  const [month, setMonth] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [menteeId, setMenteeId] = useState(""); // ✅ NEW
  const [type, setType] = useState("");
  const [outcome, setOutcome] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Interactions
      const snap = await getDocs(
        query(
          collection(db, "preaching_tracks"),
          orderBy("date", "desc")
        )
      );

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Interaction, "id">),
      }));

      // Mentors
      const devoteesSnap = await getDocs(collection(db, "devotees"));
      const mentorMap: Record<string, string> = {};
      devoteesSnap.docs.forEach((d) => {
        mentorMap[d.id] = d.data().firstName || "Mentor";
      });

      // Mentees
      const menteesSnap = await getDocs(collection(db, "mentees"));
      const menteeMap: Record<string, string> = {};
      menteesSnap.docs.forEach((d) => {
        menteeMap[d.id] = d.data().name;
      });

      setInteractions(data);
      setMentors(mentorMap);
      setMentees(menteeMap);
      setLoading(false);
    };

    load();
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */
  const filtered = useMemo(() => {
    return interactions.filter((i) => {
      if (month && !i.date.startsWith(month)) return false;
      if (mentorId && i.mentorId !== mentorId) return false;
      if (menteeId && i.menteeId !== menteeId) return false; // ✅ NEW
      if (type && i.interactionType !== type) return false;
      if (outcome && i.outcome !== outcome) return false;
      return true;
    });
  }, [interactions, month, mentorId, menteeId, type, outcome]);

  /* ---------------- EXPORT ---------------- */
  const exportCSV = () => {
    const rows = [
      [
        "Date",
        "Mentor",
        "Mentee",
        "Interaction Type",
        "Duration",
        "Outcome",
        "Issues",
        "Guidance",
        "Comments",
        "Follow Up",
      ],
      ...filtered.map((i) => [
        i.date,
        mentors[i.mentorId] || "",
        mentees[i.menteeId] || "",
        i.interactionType,
        i.duration || "",
        i.outcome,
        i.issues || "",
        i.guidance || "",
        i.comments || "",
        i.followUp || "",
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, "interaction-report.csv");
  };

  /* ---------------- UI ---------------- */
  return (
    <div>
      <BackHeader title="Interaction Report" />

      <div className="px-4 pt-4 pb-24 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-yellow-800 mb-4 text-center">
          📊 Interaction Tracker Report
        </h1>

        {/* FILTERS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          {/* Mentor */}
          <select
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Mentors</option>
            {Object.entries(mentors).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* ✅ Mentee */}
          <select
            value={menteeId}
            onChange={(e) => setMenteeId(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Mentees</option>
            {Object.entries(mentees).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Type */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Types</option>
            <option value="camp_class">Camp / Class</option>
            <option value="normal_meet">Normal Meet</option>
            <option value="mmc">MMC</option>
          </select>

          {/* Outcome */}
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Outcomes</option>
            <option value="improved">Improved</option>
            <option value="neutral">Neutral</option>
            <option value="room_closed">Room Closed</option>
          </select>

          <button
            onClick={exportCSV}
            className="bg-yellow-700 text-white rounded px-4 py-2 font-semibold"
          >
            ⬇ Export CSV
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-yellow-700">Loading…</p>
        ) : (
          <div className="overflow-auto border rounded bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Mentor</th>
                  <th className="p-2 border">Mentee</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Duration</th>
                  <th className="p-2 border">Outcome</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-yellow-50">
                    <td className="p-2 border">{i.date}</td>
                    <td className="p-2 border">
                      {mentors[i.mentorId]}
                    </td>
                    <td className="p-2 border">
                      {mentees[i.menteeId]}
                    </td>
                    <td className="p-2 border">
                      {i.interactionType}
                    </td>
                    <td className="p-2 border text-center">
                      {i.duration || "-"}
                    </td>
                    <td className="p-2 border">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          i.outcome === "improved"
                            ? "bg-green-100 text-green-700"
                            : i.outcome === "neutral"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {i.outcome}
                      </span>
                    </td>

                    {/* ✅ DETAILS BUTTON */}
                    <td className="p-2 border text-center">
                      <button
                        onClick={() =>
                          router.push(
                            `/user/reports/preaching/interactions/${i.id}`
                          )
                        }
                        className="text-xs px-3 py-1 rounded bg-yellow-700 text-white hover:bg-yellow-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
