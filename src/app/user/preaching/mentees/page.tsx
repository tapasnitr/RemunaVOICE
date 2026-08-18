"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackHeaderButton from "@/components/BackHeaderButton";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaPhoneAlt } from "react-icons/fa";

/* =======================
 TYPES
======================= */

interface Mentee {
  id: string;
  name: string;
  phone: string;
  room?: string;
  address?: string;
  status: "green" | "yellow" | "red";
  mentors: string[];
}

/* =======================
 HELPERS
======================= */

function statusColor(status: Mentee["status"]) {
  if (status === "green") return "bg-green-100 text-green-800";
  if (status === "yellow") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

/* =======================
 PAGE
======================= */

export default function MyMenteesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);

  /* -------- LOAD MENTEES -------- */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const q = query(
        collection(db, "mentees"),
        where("mentors", "array-contains", user.uid)
      );

      const snap = await getDocs(q);
      const data: Mentee[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Mentee, "id">),
      }));

      setMentees(data);
      setLoading(false);
    };

    load();
  }, [user]);

  /* -------- UI STATES -------- */
  if (!user)
    return <div className="pt-32 text-center">Login required</div>;

  if (loading)
    return <div className="pt-32 text-center">Loading mentees…</div>;

  return (
    <div>

      <BackHeaderButton title="My Mentees" link="/user/preaching" backPageName="Back to Preaching" />

      <div className="px-4 pt-6 max-w-md mx-auto pb-24">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold text-yellow-800">
            👥 My Mentees
          </h1>

          <button
            onClick={() => router.push("/user/preaching/add-mentee")}
            className="text-sm bg-yellow-700 text-white px-3 py-1.5 rounded-full"
          >
            + Add
          </button>
        </div>

        {/* EMPTY STATE */}
        {mentees.length === 0 && (
          <div className="text-center text-sm text-gray-600 mt-12">
            No mentees added yet 🙏
          </div>
        )}

        {/* LIST */}
        <div className="space-y-3">
          {mentees.map((m) => (
            <button
              key={m.id}
              onClick={() =>
                router.push(`/user/preaching/mentees/detail?id=${m.id}`)
              }
              className="w-full bg-white border border-yellow-200 rounded-xl p-4 shadow hover:shadow-md transition text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {m.name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <FaPhoneAlt className="text-[10px]" />
                    {m.phone}
                  </p>

                  {(m.room || m.address) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {m.room && `Room ${m.room}`}
                      {m.room && m.address && " • "}
                      {m.address}
                    </p>
                  )}
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(
                    m.status
                  )}`}
                >
                  {m.status.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
