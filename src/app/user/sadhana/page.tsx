"use client";

import { useRouter } from "next/navigation";
import {
  FaPenFancy,
  FaChartBar,
  FaBookOpen,
  FaBookReader,
  FaVideo,
} from "react-icons/fa";
import BackPageName from "@/components/BackHeaderButton";

/* =====================
 CONSTANT
===================== */

const MEET_URL = "https://meet.google.com/pzr-iofu-spb";

/* =====================
 PAGE
===================== */

export default function SadhanaHomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-yellow-50">
      <BackPageName title="Sadhana" link="/user/dashboard" />

      <div className="max-w-md mx-auto p-4">
        <p className="text-center text-sm text-gray-600 mb-6">
          Regulate, reflect and grow in devotional life
        </p>

        {/* MAIN GRID */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            icon={<FaPenFancy />}
            label="Fill Sadhana"
            desc="Daily entry"
            onClick={() => router.push("/user/sadhana/fill")}
          />

          <Card
            icon={<FaChartBar />}
            label="Sadhana Report"
            desc="Weekly / Monthly"
            onClick={() => router.push("/user/sadhana/report")}
          />

          <Card
            icon={<FaBookOpen />}
            label="SP Book Reading"
            desc="Devotee entry"
            onClick={() => router.push("/user/sadhana/book-reading")}
          />

          <Card
            icon={<FaBookReader />}
            label="SP Book Report"
            desc="Reading status"
            onClick={() => router.push("/user/sadhana/book-report")}
          />
        </div>

        {/* JOIN BOOK READING — PRIMARY CTA */}
        <div className="mt-6 flex justify-center">
          <a
            href={MEET_URL}
            className="
              w-full max-w-sm
              bg-green-600 text-white
              rounded-2xl
              p-5
              shadow-lg
              hover:bg-green-700
              hover:shadow-xl
              transition
              flex items-center gap-4
              active:scale-[0.98]
            "
          >
            <div className="text-3xl">
              <FaVideo />
            </div>

            <div className="text-left">
              <div className="font-bold text-lg">
                Join Book Reading
              </div>
              <div className="text-sm text-green-100">
                Opens in Google Meet / Browser
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

/* =====================
 CARD COMPONENT
===================== */

function Card({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        bg-white
        border border-yellow-300
        rounded-xl
        p-4
        shadow-sm
        hover:shadow-md
        transition
        flex flex-col
        items-center
        text-center
        active:scale-[0.97]
      "
    >
      <div className="text-3xl text-yellow-700 mb-2">
        {icon}
      </div>

      <div className="font-semibold text-yellow-900 text-sm">
        {label}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {desc}
      </div>
    </button>
  );
}
