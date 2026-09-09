"use client";

import { Suspense, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DevoteeAnalysisModal from "../../report/DevoteeAnalysisModal";
import { CustomSadhanaCard, CustomSadhanaResponse } from "../types";

function weekDays(value: Date) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export default function PersonalSadhanaAnalysisPage() {
  return <Suspense fallback={<div className="p-8 text-center">Loading your analysis...</div>}><PersonalSadhanaAnalysisContent /></Suspense>;
}

function PersonalSadhanaAnalysisContent() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<CustomSadhanaCard[]>([]);
  const [responses, setResponses] = useState<CustomSadhanaResponse[]>([]);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const batchId = (userData as { batchId?: string } | null)?.batchId;
  const selectedDate = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const currentDays = weekDays(new Date(`${selectedDate}T00:00:00`));
  const previousDays = weekDays(new Date(new Date(`${selectedDate}T00:00:00`).getTime() - 7 * 86400000));
  const currentWeekStart = currentDays[0];

  useEffect(() => {
    if (!user || !batchId) return;
    const load = async () => {
      const [cardSnap, responseSnap, remarkSnap] = await Promise.all([
        getDocs(collection(db, "custom_sadhana_cards")),
        getDocs(collection(db, "custom_sadhana_responses")),
        getDocs(collection(db, "custom_sadhana_remarks")),
      ]);
      setCards(cardSnap.docs.map((item) => ({ id: item.id, ...item.data() } as CustomSadhanaCard)).filter((card) => card.active !== false && (!card.batchIds?.length || card.batchIds.includes(batchId))));
      setResponses(responseSnap.docs.map((item) => item.data() as CustomSadhanaResponse).filter((response) => response.userId === user.uid));
      setRemark(remarkSnap.docs.map((item) => item.data() as { studentId?: string; weekStart?: string; text?: string }).find((item) => item.studentId === user.uid && item.weekStart === currentWeekStart)?.text || "");
      setLoading(false);
    };
    void load();
  }, [user, batchId, currentWeekStart]);

  if (loading) return <div className="p-8 text-center">Loading your analysis...</div>;
  if (!user) return <div className="p-8 text-center">Please login.</div>;

  return <DevoteeAnalysisModal student={{ id: user.uid, name: `${userData?.firstName || user.displayName || "Devotee"} ${userData?.lastName || ""}`.trim(), batchId, batchName: "" }} cards={cards} currentResponses={responses.filter((response) => currentDays.includes(response.date))} previousResponses={responses.filter((response) => previousDays.includes(response.date))} allResponses={responses} currentDays={currentDays} previousDays={previousDays} remarkText={remark} setRemarkText={setRemark} savingRemark={false} saveRemark={() => undefined} readOnlyRemark onClose={() => router.push("/user/sadhana/custom")} />;
}
