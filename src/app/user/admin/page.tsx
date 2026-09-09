"use client";

import { useRouter } from "next/navigation";

import BackHeader from "@/components/BackHeader";

import {
  FaHandsHelping,
  FaWallet,
} from "react-icons/fa";

import {
  GiSunrise,
  GiCookingPot,
} from "react-icons/gi";
import { FaClipboardCheck } from "react-icons/fa";

import { useAuth } from "@/context/AuthContext";

/* =====================
 PAGE
===================== */

export default function UserAdminPage() {
  const router = useRouter();

  const { userData } = useAuth();

  // 🔒 Only admin users can enter
  if (!userData?.features?.admin) {
    return (
      <div className="pt-32 text-center text-red-600 font-semibold">
        You do not have admin access 🙏
      </div>
    );
  }

  const adminFeatures: string[] =
    userData.adminFeatures || [];

  return (
    <div>
      <BackHeader title="Admin Panel" />

      <div className="px-4 pt-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-center text-yellow-800 mb-2">
          🛡️ Admin Controls
        </h1>

        <p className="text-center text-sm text-gray-600 mb-6">
          Manage allotments and permissions
        </p>

        {/* ADMIN OPTIONS */}

        <div className="grid grid-cols-2 gap-4">
          {/* SEVA ALLOT */}

          {adminFeatures.includes(
            "sevaAlot"
          ) && (
            <button
              onClick={() =>
                router.push(
                  "/user/admin/seva-allot"
                )
              }
              className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition"
            >
              <FaHandsHelping className="text-3xl text-yellow-700 mb-2" />

              <span className="font-semibold text-sm text-center">
                Seva Allot
              </span>

              <span className="text-xs text-gray-500 text-center mt-1">
                Assign seva roles
              </span>
            </button>
          )}

          {/* MORNING PROGRAM */}

          {adminFeatures.includes(
            "morningProgramAlot"
          ) && (
            <button
              onClick={() =>
                router.push(
                  "/user/admin/morning-program"
                )
              }
              className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition"
            >
              <GiSunrise className="text-3xl text-yellow-700 mb-2" />

              <span className="font-semibold text-sm text-center">
                Morning Program
              </span>

              <span className="text-xs text-gray-500 text-center mt-1">
                Attendance & access
              </span>
            </button>
          )}

          {/* KITCHEN MODULE */}

          {adminFeatures.includes(
            "kitchen"
          ) && (
            <button
              onClick={() =>
                router.push(
                  "/user/admin/kitchen"
                )
              }
              className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition"
            >
              <GiCookingPot className="text-3xl text-yellow-700 mb-2" />

              <span className="font-semibold text-sm text-center">
                Kitchen
              </span>

              <span className="text-xs text-gray-500 text-center mt-1">
                Menu, raw items &
                feedback
              </span>
            </button>
          )}

          {/* ACCOUNTS MODULE */}

          {adminFeatures.includes(
            "account"
          ) && (
            <button
              onClick={() =>
                router.push(
                  "/user/admin/account"
                )
              }
              className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition"
            >
              <FaWallet className="text-3xl text-yellow-700 mb-2" />

              <span className="font-semibold text-sm text-center">
                Accounts
              </span>

              <span className="text-xs text-gray-500 text-center mt-1">
                Donations & expenses
              </span>
            </button>
          )}

          {adminFeatures.includes("customSadhana") && (
            <>
              <button
                onClick={() => router.push("/user/admin/custom-sadhana")}
                className="bg-white border border-yellow-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition"
              >
                <FaClipboardCheck className="text-3xl text-yellow-700 mb-2" />
                <span className="font-semibold text-sm text-center">Custom Sadhana</span>
                <span className="text-xs text-gray-500 text-center mt-1">Build and assign cards</span>
              </button>
              <button
                onClick={() => router.push("/user/admin/custom-sadhana/report")}
                className="bg-white border border-green-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition"
              >
                <span className="text-3xl text-green-700 mb-2">📈</span>
                <span className="font-semibold text-sm text-center">Sadhana Report</span>
                <span className="text-xs text-gray-500 text-center mt-1">Batch-wise weekly progress</span>
              </button>
            </>
          )}

          {adminFeatures.includes("batchAllotment") && (
            <button
              onClick={() => router.push("/user/admin/batch-allotment")}
              className="bg-white border border-indigo-300 rounded-xl p-4 shadow flex flex-col items-center justify-center hover:shadow-md transition"
            >
              <span className="text-3xl text-indigo-700 mb-2">👥</span>
              <span className="font-semibold text-sm text-center">Batch Allotment</span>
              <span className="text-xs text-gray-500 text-center mt-1">Group devotees</span>
            </button>
          )}
        </div>

        {/* NO ADMIN FEATURES */}

        {adminFeatures.length ===
          0 && (
          <div className="mt-10 text-center text-yellow-700 text-sm">
            No admin modules assigned
            to you 🙏
          </div>
        )}

        {/* FOOTER NOTE */}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-xs text-yellow-800">
            ⚠️ Admin access is
            role-based. Use
            responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}