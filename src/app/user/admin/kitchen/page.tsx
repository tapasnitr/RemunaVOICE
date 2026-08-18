"use client";

import { useRouter } from "next/navigation";
import {
  FaBoxes,
  FaUtensils,
  FaCalendarAlt,
  FaCommentDots,
} from "react-icons/fa";
import BackPageName from "@/components/BackHeaderButton";

/* =====================
 PAGE
===================== */

export default function KitchenHomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-yellow-50">
      <BackPageName title="Kitchen" link="/user/admin" />

      <div className="max-w-md mx-auto p-4">
        <p className="text-center text-sm text-gray-600 mb-6">
          Plan, prepare and improve prasadam service
        </p>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">
          <KitchenCard
            icon={<FaBoxes />}
            title="Raw Grocery"
            desc="Master items list"
            color="bg-blue-100 text-blue-700"
            onClick={() => router.push("/user/admin/kitchen/raw-items")}
          />

          <KitchenCard
            icon={<FaUtensils />}
            title="Recipes"
            desc="Items for 10 devotees"
            color="bg-purple-100 text-purple-700"
            onClick={() => router.push("/user/admin/kitchen/recipes")}
          />

          <KitchenCard
            icon={<FaCalendarAlt />}
            title="Menu Planner"
            desc="Daily meals with timing & recipes"
            color="bg-orange-100 text-orange-700"
            onClick={() => router.push("/user/admin/kitchen/menu")}
          />

          <KitchenCard
            icon={<FaCommentDots />}
            title="Menu Feedback"
            desc="Taste & quantity"
            color="bg-green-100 text-green-700"
            onClick={() => router.push("/user/admin/kitchen/feedback")}
          />
        </div>
      </div>
    </div>
  );
}

/* =====================
 CARD COMPONENT
===================== */

function KitchenCard({
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
        border border-yellow-300
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

      <div className="font-semibold text-yellow-900 text-sm">
        {title}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {desc}
      </div>
    </button>
  );
}
