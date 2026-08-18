"use client";

import { useRouter } from "next/navigation";
import BackHeader from "@/components/BackHeader";
import { FaUserPlus, FaUsers } from "react-icons/fa";
import { MdOutlineTrackChanges, MdHistory } from "react-icons/md";
import { AiOutlineBarChart } from "react-icons/ai";

export default function PreachingPage() {
  const router = useRouter();

  return (
    <div>
      <BackHeader title="Preaching" />

      <div className="pt-6 px-4 max-w-md mx-auto">
        {/* PAGE TITLE */}
        <h1 className="text-xl font-bold text-center text-yellow-800 mb-2">
          🗣️ Preaching Service
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          Care for souls. Track connections. Inspire growth.
        </p>

        {/* ===== SECTION: PEOPLE ===== */}
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          👥 People
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* ADD MENTEE */}
          <ActionCard
            icon={<FaUserPlus />}
            title="Add Mentee"
            subtitle="Register a boy under mentoring"
            onClick={() => router.push("/user/preaching/add-mentee")}
          />

          {/* MY MENTEES */}
          <ActionCard
            icon={<FaUsers />}
            title="My Mentees"
            subtitle="View & manage mentees"
            onClick={() => router.push("/user/preaching/mentees")}
          />
        </div>

        {/* ===== SECTION: ACTIONS ===== */}
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          📝 Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* DAILY TRACK */}
          <ActionCard
            icon={<MdOutlineTrackChanges />}
            title="Daily Track"
            subtitle="Calls, meets & MMC"
            onClick={() => router.push("/user/preaching/daily-track")}
          />

          {/* INTERACTION HISTORY */}
          <ActionCard
            icon={<MdHistory />}
            title="Interactions"
            subtitle="Past meetings & notes"
            onClick={() => router.push("/user/preaching/interactions")}
          />
        </div>

        {/* ===== SECTION: INSIGHTS ===== */}
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          📊 Insights
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {/* ANALYTICS */}
          <ActionCard
            icon={<AiOutlineBarChart />}
            title="My Preaching Analytics"
            subtitle="Consistency, reach & impact"
            onClick={() => router.push("/user/preaching/analytics")}
            full
          />
        </div>

        {/* FOOTER NOTE */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-xs text-yellow-800">
            🙏 Preaching means listening deeply, guiding gently, and walking together.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =======================
   REUSABLE CARD
======================= */

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  full = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition ${
        full ? "col-span-2" : ""
      }`}
    >
      <div className="text-3xl text-yellow-700 mb-2">{icon}</div>
      <span className="font-semibold text-sm text-center">{title}</span>
      <span className="text-xs text-gray-500 text-center mt-1">
        {subtitle}
      </span>
    </button>
  );
}
