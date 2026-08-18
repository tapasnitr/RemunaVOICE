"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function SidebarMobile({
    children,
}: {
    children: React.ReactNode;
}) {
  
    const router = useRouter();
    const { user, userData } = useAuth();
    const [logoutLoading, setLogoutLoading] = useState(false);
    const handleLogout = async () => {
        await signOut(auth);
        router.push("/admin/login");
    };

   

    return (
        <div className="min-h-screen bg-yellow-50">

            {/* TOP BAR */}
            {/* <div className="flex justify-between items-center bg-white p-4 shadow">
          <button
            onClick={() => setOpen(true)}
            className="text-2xl text-yellow-800"
          >
            ☰
          </button>

          <h1 className="font-bold text-yellow-800">Admin</h1>
        </div>

        {/* DRAWER */}
            {/* {open && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            {/* <div
              className="flex-1 bg-black/50"
              onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
            {/* <div className="w-64 bg-yellow-800 text-white p-4 space-y-3">
              <h2 className="text-xl font-bold mb-4">Menu</h2>

              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className={`block ${
                  isActive("/admin/dashboard")
                    ? "font-bold text-yellow-300"
                    : ""
                }`}
              >
                📊 Dashboard
              </Link>

              <Link
                href="/admin/dashboard/sadhana-report"
                onClick={() => setOpen(false)}
                className={`block ${
                  isActive("/admin/dashboard/sadhana-report")
                    ? "font-bold text-yellow-300"
                    : ""
                }`}
              >
                🧘 Sadhana
              </Link>

              <Link
                href="/admin/dashboard/seva-board"
                onClick={() => setOpen(false)}
                className={`block ${
                  isActive("/admin/dashboard/seva-board")
                    ? "font-bold text-yellow-300"
                    : ""
                }`}
              >
                🙏 Seva
              </Link>

              <Link
                href="/admin/dashboard/users"
                onClick={() => setOpen(false)}
                className={`block ${
                  isActive("/admin/dashboard/users")
                    ? "font-bold text-yellow-300"
                    : ""
                }`}
              >
                👥 Users
              </Link>

              <button
                onClick={handleLogout}
                className="mt-6 w-full bg-red-600 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        )} */}

            {/* CONTENT */}
            <main className="p-4">
                <header className="bg-yellow-700 text-white py-4 px-6 flex justify-between items-center shadow-md">
                    <div>
                        <h1 className="text-lg font-semibold">🪔 Hare Krishna!</h1>
                        <p className="text-sm opacity-90">
                            Welcome,&nbsp;
                            <span className="font-bold capitalize">
                                {userData?.firstName ||
                                    user?.displayName?.split(" ")[0] ||
                                    "Devotee"}{" "}
                                Pr
                            </span>
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${logoutLoading
                            ? "bg-gray-400"
                            : "bg-yellow-600 hover:bg-yellow-800"
                            }`}
                    >
                        {logoutLoading ? "Logging out..." : "Logout"}
                    </button>
                </header>
                {children}</main>
        </div>
    );
}