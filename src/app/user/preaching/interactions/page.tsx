"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackHeaderButton from "@/components/BackHeaderButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* =====================
 TYPES
===================== */

type InteractionType = "camp_class" | "normal_meet" | "mmc";

interface Interaction {
  id: string;
  menteeId: string;
  mentorId: string;
  interactionType: InteractionType;
  date: string;
  outcome: string;
}

/* =====================
 COMPONENT
===================== */

export default function PreachingInteractionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [menteesMap, setMenteesMap] = useState<Record<string, string>>({});
  const [filter, setFilter] =
    useState<InteractionType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  /* -------- LOAD DATA -------- */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      // ✅ ONLY CURRENT MENTOR'S INTERACTIONS
      const tracksSnap = await getDocs(
        query(
          collection(db, "preaching_tracks"),
          where("mentorId", "==", user.uid),
          // orderBy("date", "desc")
        )
      );

      const tracks = tracksSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Interaction, "id">),
      }));

      // Load mentees (for name resolution)
      const menteesSnap = await getDocs(collection(db, "mentees"));
      const menteeMap: Record<string, string> = {};
      menteesSnap.docs.forEach((d) => {
        menteeMap[d.id] = d.data().name;
      });

      setInteractions(tracks);
      setMenteesMap(menteeMap);
      setLoading(false);
    };

    load();
  }, [user]);

  const filtered =
    filter === "ALL"
      ? interactions
      : interactions.filter(
          (i) => i.interactionType === filter
        );

  /* -------- UI -------- */
  return (
    <div>
      <BackHeaderButton
        title="Daily Interactions"
        link="/user/preaching"
        backPageName="Back to Preaching"
      />

      <div className="px-4 pt-4 pb-24 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-center text-yellow-800 mb-3">
          📋 My Interaction Records
        </h1>

        {/* FILTER */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["ALL", "camp_class", "normal_meet", "mmc"].map(
            (t) => (
              <button
                key={t}
                onClick={() =>
                  setFilter(t as InteractionType | "ALL")
                }
                className={`text-xs px-3 py-1 rounded-full border ${
                  filter === t
                    ? "bg-yellow-700 text-white"
                    : "bg-yellow-50 text-yellow-800"
                }`}
              >
                {t === "camp_class"
                  ? "🏕️ Camp / Class"
                  : t === "normal_meet"
                  ? "🤝 Normal Meet"
                  : t === "mmc"
                  ? "📞 MMC"
                  : "All"}
              </button>
            )
          )}
        </div>

        {/* LIST */}
        {loading ? (
          <p className="text-center text-yellow-700">
            Loading interactions…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500">
            No interactions found 🙏
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((i) => (
              <div
                key={i.id}
                onClick={() =>
                  router.push(
                    `/user/preaching/interactions/detail?id=${i.id}`
                  )
                }
                className="bg-white border border-yellow-200 rounded-lg p-3 shadow-sm cursor-pointer hover:bg-yellow-50"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-yellow-800">
                    {menteesMap[i.menteeId] || "Unknown Mentee"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(i.date).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short" }
                    )}
                  </span>
                </div>

                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {i.interactionType}
                </span>

                <p className="text-xs text-gray-700 mt-2">
                  <strong>Outcome:</strong> {i.outcome}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
