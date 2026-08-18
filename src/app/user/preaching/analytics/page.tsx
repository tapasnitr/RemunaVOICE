"use client";

import { useRouter } from "next/navigation";
import BackHeader from "@/components/BackHeader";
import { MdOutlineTrackChanges, MdRecordVoiceOver } from "react-icons/md";
import { FaCampground } from "react-icons/fa";
import { HiOutlineChartBar } from "react-icons/hi";

/* =======================
 PAGE
======================= */

export default function PreachingReportsPage() {
  const router = useRouter();

  return (
    <div>
      <BackHeader title="Preaching Reports" />

      <div className="pt-6 px-4 max-w-md mx-auto">
        {/* TITLE */}
        <h1 className="text-xl font-bold text-center text-yellow-800 mb-2">
          🗣️ Preaching Reports
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          Analyze mentoring, interactions & outreach
        </p>

        {/* REPORT OPTIONS */}
        <div className="grid grid-cols-2 gap-4">

          {/* DAILY INTERACTION REPORT */}
          <button
            onClick={() =>
              router.push("/user/reports/preaching/daily-interactions")
            }
            className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center hover:shadow-md transition"
          >
            <MdOutlineTrackChanges className="text-3xl text-yellow-700 mb-2" />
            <span className="font-semibold text-sm text-center">
              Daily Interactions
            </span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Calls, meets & follow‑ups
            </span>
          </button>

          {/* CAMP ATTENDANCE REPORT */}
          <button
            onClick={() =>
              router.push("/user/reports/preaching/camp-attendance")
            }
            className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center hover:shadow-md transition"
          >
            <FaCampground className="text-3xl text-yellow-700 mb-2" />
            <span className="font-semibold text-sm text-center">
              Camp Attendance
            </span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Camps & classes joined
            </span>
          </button>

          {/* MMC / CALL REPORT */}
          <button
            onClick={() =>
              router.push("/user/reports/preaching/mmc-report")
            }
            className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center hover:shadow-md transition"
          >
            <MdRecordVoiceOver className="text-3xl text-yellow-700 mb-2" />
            <span className="font-semibold text-sm text-center">
              MMC / Call Report
            </span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Phone preaching analysis
            </span>
          </button>

          {/* ANALYTICS (FUTURE) */}
          <button
            className="bg-white border border-dashed border-yellow-300 rounded-xl p-4 flex flex-col items-center text-yellow-700 opacity-70"
          >
            <HiOutlineChartBar className="text-3xl mb-2" />
            <span className="font-semibold text-sm text-center">
              Analytics
            </span>
            <span className="text-xs text-gray-400 text-center">
              Coming soon
            </span>
          </button>
        </div>

        {/* FOOTER NOTE */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-xs text-yellow-800">
            🙏 Preaching success is measured by care, not numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
