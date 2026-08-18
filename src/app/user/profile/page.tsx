"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const name =
    userData?.firstName ||
    user?.displayName ||
    "Devotee";


    console.log("User Data:", user);
  const email = user?.email || "Not available";
  // const phone = userData?. || "Not provided";
  // const seva = userData?.seva || "No seva assigned";
  // const temple = userData?.temple || "Not specified";

  return (
    <div className="min-h-screen bg-yellow-50 pb-10">

      {/* 🌼 Title */}
      <h2 className="text-center text-xl font-bold text-yellow-800 mb-6">
        My Profile
      </h2>

      {/* 🧘 Devotee Avatar */}
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 bg-yellow-200 rounded-full border-4 border-yellow-600 overflow-hidden shadow-md">
          <Image
            src="/avatar-placeholder.png"
            alt="Profile"
            width={112}
            height={112}
            className="object-cover"
          />
        </div>

        <h3 className="text-lg font-bold mt-3 text-yellow-900 capitalize">
          {name}
        </h3>
        <p className="text-sm text-gray-600">Hare Krishna 🙏</p>
      </div>

      {/* 📋 Profile Info Card */}
      <div className="mt-6 mx-4 bg-white rounded-2xl shadow p-5 space-y-4 border border-yellow-200">
        
        {/* Name */}
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-700 font-medium">Full Name</span>
          <span className="font-semibold text-yellow-800 capitalize">
            {name}
          </span>
        </div>

        {/* Email */}
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-700 font-medium">Email</span>
          <span className="font-semibold text-yellow-800">{email}</span>
        </div>

        {/* Phone */}
        {/* <div className="flex justify-between border-b pb-2">
          <span className="text-gray-700 font-medium">Phone</span>
          <span className="font-semibold text-yellow-800">{phone}</span>
        </div> */}

        {/* Temple */}
        {/* <div className="flex justify-between border-b pb-2">
          <span className="text-gray-700 font-medium">Temple</span>
          <span className="font-semibold text-yellow-800 capitalize">{temple}</span>
        </div> */}

        {/* Seva */}
        {/* <div className="flex justify-between">
          <span className="text-gray-700 font-medium">Seva Assigned</span>
          <span className="font-semibold text-yellow-800 capitalize">{seva}</span>
        </div> */}
      </div>

      {/* ✏️ Edit Profile Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => router.push("/user/profile/edit")}
          className="bg-yellow-700 text-white font-medium py-3 px-6 rounded-xl shadow hover:bg-yellow-800 transition"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
