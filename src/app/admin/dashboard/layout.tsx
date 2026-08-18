"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen max-h-[100vh]">

        {/* 🟡 SIDEBAR */}
        <aside className="w-64 bg-yellow-800 text-white flex flex-col  " >
          <div className="p-4 text-2xl font-bold border-b border-yellow-700 text-center">
            Admin Panel
          </div>

          <nav className="flex-1 mt-4 space-y-1">

            {/* Dashboard */}
            <Link
              href="/admin/dashboard"
              className={`block px-4 py-2 rounded-r-full transition ${
                pathname === "/admin/dashboard"
                  ? "bg-yellow-600 font-semibold"
                  : "hover:bg-yellow-700"
              }`}
            >
              📊 Dashboard
            </Link>

            {/* Sadhana Report */}
            <Link
              href="/admin/dashboard/sadhana-report"
              className={`block px-4 py-2 rounded-r-full transition ${
                isActive("/admin/dashboard/sadhana-report")
                  ? "bg-yellow-600 font-semibold"
                  : "hover:bg-yellow-700"
              }`}
            >
              🧘 Sadhana Report
            </Link>

            {/* Seva Board */}
            <Link
              href="/admin/dashboard/seva-board"
              className={`block px-4 py-2 rounded-r-full transition ${
                isActive("/admin/dashboard/seva-board")
                  ? "bg-yellow-600 font-semibold"
                  : "hover:bg-yellow-700"
              }`}
            >
              🙏 Seva Board
            </Link>

            {/* Users */}
            <Link
              href="/admin/dashboard/users"
              className={`block px-4 py-2 rounded-r-full transition ${
                isActive("/admin/dashboard/users")
                  ? "bg-yellow-600 font-semibold"
                  : "hover:bg-yellow-700"
              }`}
            >
              👥 Users
            </Link>


            <Link
              href="/admin/dashboard/batches"
              className={`block px-4 py-2 rounded-r-full transition ${
                isActive("/admin/dashboard/batches")
                  ? "bg-yellow-600 font-semibold"
                  : "hover:bg-yellow-700"
              }`}
            >
              Batches
            </Link>


            <Link
              href="/admin/dashboard/department"
              className={`block px-4 py-2 rounded-r-full transition ${
                isActive("/admin/dashboard/department")
                  ? "bg-yellow-600 font-semibold"
                  : "hover:bg-yellow-700"
              }`}
            >
              Department
            </Link>

          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="m-4 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </aside>

        {/* 🟢 MAIN CONTENT */}
        <main className="flex-1 p-6 bg-yellow-50 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow mb-4 border border-yellow-300">
            <h1 className="text-2xl font-bold text-yellow-800">
              Admin Dashboard
            </h1>
            <div className="text-yellow-800 font-semibold">
              Welcome, Admin 👋
            </div>
          </div>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </AdminProtectedRoute>
  );
}
