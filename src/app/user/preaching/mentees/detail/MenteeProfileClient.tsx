"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackHeaderButton from "@/components/BackHeaderButton";

interface Mentee {
  name: string;
  phone: string;
  room?: string;
  address?: string;
  status: string;
}

interface Interaction {
  id: string;
  date: string;
  interactionType: string;
  outcome: string;
}

export default function MenteeProfileClient() {
  return (
    <Suspense fallback={<div className="pt-32 text-center">Loading...</div>}>
      <MenteeProfileContent />
    </Suspense>
  );
}

function MenteeProfileContent() {
  const searchParams = useSearchParams();
  const menteeId = searchParams.get("id");
  const router = useRouter();
  const [mentee, setMentee] = useState<Mentee | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    if (!menteeId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const menteeSnap = await getDoc(doc(db, "mentees", menteeId));
      if (menteeSnap.exists()) {
        setMentee(menteeSnap.data() as Mentee);
      }

      const interactionsQuery = query(
        collection(db, "preaching_tracks"),
        where("menteeId", "==", menteeId)
      );
      const snap = await getDocs(interactionsQuery);

      setInteractions(
        snap.docs.map((interactionDoc) => ({
          id: interactionDoc.id,
          ...(interactionDoc.data() as Omit<Interaction, "id">),
        }))
      );
      setLoading(false);
    };

    load();
  }, [menteeId]);

  if (loading) {
    return <div className="pt-32 text-center">Loading...</div>;
  }

  if (!mentee) {
    return <div className="pt-32 text-center text-red-600">Mentee not found</div>;
  }

  return (
    <div>
      <BackHeaderButton
        title={mentee.name}
        link="/user/preaching/mentees"
        backPageName="Back to Mentees"
      />

      <div className="px-4 pt-4 pb-24 max-w-md mx-auto space-y-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm">Phone: {mentee.phone}</p>
          <p className="text-sm text-gray-600">
            {mentee.room && `Room ${mentee.room} - `}
            {mentee.address}
          </p>
        </div>

        <h3 className="font-semibold text-yellow-800">Interaction History</h3>

        {interactions.length === 0 ? (
          <p className="text-sm text-gray-500">No interactions yet</p>
        ) : (
          interactions.map((interaction) => (
            <div
              key={interaction.id}
              onClick={() =>
                router.push(
                  `/user/preaching/interactions/detail?id=${interaction.id}`
                )
              }
              className="bg-white border rounded-lg p-3 shadow cursor-pointer hover:bg-yellow-50"
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  {interaction.interactionType}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(interaction.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>

              <p className="text-xs text-gray-600">
                Outcome: {interaction.outcome}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
