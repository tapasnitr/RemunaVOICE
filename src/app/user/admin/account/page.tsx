"use client";

import { useRouter } from "next/navigation";
import {
  FaDonate,
  FaMoneyCheckAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";

import BackPageName from "@/components/BackHeaderButton";

/* =====================
 PAGE
===================== */

export default function AccountHomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-green-50">
      <BackPageName title="Accounts" link="/user/admin" />

      <div className="max-w-md mx-auto p-4">
        <p className="text-center text-sm text-gray-600 mb-6">
          Manage donations and account activities
        </p>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">
          <AccountCard
            icon={<FaMoneyCheckAlt />}
            title="Transactions"
            desc="All account transactions"
            color="bg-blue-100 text-blue-700"
            onClick={() =>
              router.push("/user/admin/account/transactions")
            }
          />

          <AccountCard
            icon={<FaDonate />}
            title="Donor List"
            desc="Regular donor details"
            color="bg-pink-100 text-pink-700"
            onClick={() =>
              router.push("/user/admin/account/donors")
            }
          />

          <AccountCard
            icon={<FaFileInvoiceDollar />}
            title="Devotee Requests"
            desc="Transaction requests"
            color="bg-green-100 text-green-700"
            onClick={() =>
              router.push("/user/admin/accounts/devotee-requests")
            }
          />
        </div>
      </div>
    </div>
  );
}

/* =====================
 CARD COMPONENT
===================== */

function AccountCard({
  icon,
  title,
  desc,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        bg-white
        border border-green-300
        rounded-xl
        p-4
        shadow-sm
        hover:shadow-md
        transition
        flex flex-col
        items-center
        text-center
        active:scale-[0.98]
      "
    >
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-full mb-3 ${color}`}
      >
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="font-semibold text-green-900 text-sm">
        {title}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {desc}
      </div>
    </button>
  );
}
