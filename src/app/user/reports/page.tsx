"use client";

import { useRouter } from "next/navigation";
import BackHeader from "@/components/BackHeader";
import { GiMeditation } from "react-icons/gi";
import { MdRecordVoiceOver, MdAssessment } from "react-icons/md";
import { FaHandsHelping } from "react-icons/fa";

export default function ReportsHomePage() {
  const router = useRouter();

  return (
    <div>
      <BackHeader title="Reports" />

      <div className="pt-6 px-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-center text-yellow-800 mb-2">
          📊 Reports Center
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          View analysis, progress & insights
        </p>

        <div className="grid grid-cols-2 gap-4">

          {/* SADHANA REPORT */}
          <button
            onClick={() => router.push("/user/reports/sadhana")}
            className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center hover:shadow-md transition"
          >
            <GiMeditation className="text-3xl text-yellow-700 mb-2" />
            <span className="font-semibold text-sm text-center">
              Sadhana Report
            </span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Daily & monthly discipline
            </span>
          </button>

          {/* PREACHING REPORT */}
          <button
            onClick={() => router.push("/user/reports/preaching")}
            className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center hover:shadow-md transition"
          >
            <MdRecordVoiceOver className="text-3xl text-yellow-700 mb-2" />
            <span className="font-semibold text-sm text-center">
              Preaching Report
            </span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Mentoring & interactions
            </span>
          </button>

          {/* SEVA REPORT (FUTURE) */}
          <button
            onClick={() => router.push("/user/reports/seva")}
            className="bg-white border border-yellow-200 rounded-xl p-4 shadow flex flex-col items-center opacity-70"
          >
            <FaHandsHelping className="text-3xl text-yellow-700 mb-2" />
            <span className="font-semibold text-sm text-center">
              Seva Report
            </span>
            <span className="text-xs text-gray-400">
              Coming soon
            </span>
          </button>

          {/* OTHER REPORTS */}
          <button
            className="bg-white border border-dashed border-yellow-300 rounded-xl p-4 flex flex-col items-center text-yellow-700"
          >
            <MdAssessment className="text-3xl mb-2" />
            <span className="text-sm font-semibold">
              More Reports
            </span>
            <span className="text-xs text-gray-400">
              Will be added
            </span>
          </button>
        </div>

        {/* NOTE */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-xs text-yellow-800">
            📈 Reports help us improve service & care 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
