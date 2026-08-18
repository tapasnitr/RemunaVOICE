"use client";

import { FaVideo } from "react-icons/fa";

const MEET_URL = "https://meet.google.com/pzr-iofu-spb";

export default function JoinMeetCard() {
  const openMeet = () => {
    // ✅ Works in browser + PWA
    window.open(MEET_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={openMeet}
      className="
        w-full max-w-sm
        bg-green-600
        text-white
        rounded-2xl
        p-5
        shadow-lg
        hover:bg-green-700
        hover:shadow-xl
        transition
        flex
        items-center
        gap-4
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
          Opens Google Meet
        </div>
      </div>
    </button>
  );
}
