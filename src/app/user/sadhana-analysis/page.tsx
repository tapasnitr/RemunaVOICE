"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackHeader from "@/components/BackHeader";
import MySadhanaAnalysis from "./MySadhanaAnalysis";
import SadhanaComparison from "./SadhanaComparison";

/* ---------- TYPES ---------- */
interface SadhanaRecord {
  userId: string;
  date: string;

  // Soul
  japaBefore10?: number;
  personalHearing1hr?: number;
  spBookReading1hr?: number;
  bookReadingAttended?: number;
  slokaLearnt?: number;

  // Body
  dayRestBelow30?: number;
  sleptBeforeTime?: number;
  wakeUpBeforeTime?: number;
  studyOrPreaching1hr?: number;
}

interface RankingItem {
  userId: string;
  name: string;
  score: number;
}

export default function SadhanaAnalysisPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState<"mine" | "compare">("mine");
  const [records, setRecords] = useState<SadhanaRecord[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      /* -------- LOAD SADHANA -------- */
      const snap = await getDocs(collection(db, "sadhana_cards"));
      const allRecords = snap.docs.map(
        (d) => d.data() as SadhanaRecord
      );

      const myRecords = allRecords.filter(
        (r) => r.userId === user.uid
      );
      setRecords(myRecords);

      /* -------- CALCULATE RANKING -------- */
      const scoreMap: Record<string, number> = {};

      allRecords.forEach((r) => {
        scoreMap[r.userId] = (scoreMap[r.userId] || 0) + 1;
      });

      const usersSnap = await getDocs(collection(db, "devotees"));
      const ranks: RankingItem[] = usersSnap.docs.map((u) => ({
        userId: u.id,
        name: u.data().firstName || "Devotee",
        score: scoreMap[u.id] || 0,
      }));

      ranks.sort((a, b) => b.score - a.score);
      setRanking(ranks);

      setLoading(false);
    };

    load();
  }, [user]);

  if (!user) {
    return <div className="pt-32 text-center">Login required</div>;
  }

  if (loading) {
    return <div className="pt-32 text-center">Loading…</div>;
  }

  return (
    <div>
      <BackHeader title="Sadhana Analysis" />

      {/* TABS */}
      <div className="flex gap-2 px-4 mb-4">
        <button
          onClick={() => setTab("mine")}
          className={`flex-1 py-2 rounded font-semibold ${
            tab === "mine"
              ? "bg-yellow-700 text-white"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          My Sadhana
        </button>

        {/* Uncomment when needed */}
        {/*
        <button
          onClick={() => setTab("compare")}
          className={`flex-1 py-2 rounded font-semibold ${
            tab === "compare"
              ? "bg-indigo-700 text-white"
              : "bg-indigo-100 text-indigo-800"
          }`}
        >
          Comparison
        </button>
        */}
      </div>

      <div className="px-4 pb-24">
        {tab === "mine" && (
          <MySadhanaAnalysis records={records} />
        )}

        {tab === "compare" && (
          <SadhanaComparison
            ranking={ranking}
            myUserId={user.uid}
          />
        )}
      </div>
    </div>
  );
}
