"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

/* ICONS */
import {
  FaHandsHelping,
  FaBook,
  FaClipboardList,
  FaWallet,
} from "react-icons/fa";

import {
  GiMeditation,
  GiSunrise,
  GiCookingPot,
} from "react-icons/gi";

import {
  MdRecordVoiceOver,
  MdAdminPanelSettings,
} from "react-icons/md";

import { HiOutlineDocumentReport } from "react-icons/hi";

export default function SidebarDesktop({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut(auth);
      router.push("/");
    } finally {
      setLogoutLoading(false);
    }
  };

  const isActive = (path: string) =>
    pathname === path ||
    pathname.startsWith(path + "/");

  const features = userData?.features || {};

  const adminFeatures: string[] =
    userData?.adminFeatures || [];

  return (
    <div className="flex min-h-screen max-h-[100vh]">
      {/* SIDEBAR */}

      <aside className="w-64 bg-yellow-800 text-white flex flex-col">
        {/* LOGO */}

        <div className="p-4 text-2xl font-bold border-b border-yellow-700 text-center">
          Devotees Panel
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 mt-4 space-y-1">
          {/* DASHBOARD */}

          <SidebarItem
            href="/user/dashboard"
            active={isActive(
              "/user/dashboard"
            )}
            label="Dashboard"
            icon="📊"
          />

          {/* USER FEATURES */}

          {features.seva && (
            <SidebarItem
              href="/user/my-seva"
              active={isActive(
                "/user/my-seva"
              )}
              label="My Seva"
              icon="🙏"
            />
          )}

          {features.sadhana && (
            <SidebarItem
              href="/user/sadhana"
              active={isActive(
                "/user/sadhana"
              )}
              label="Sadhana"
              icon="🧘"
            />
          )}

          {features.preaching && (
            <SidebarItem
              href="/user/preaching"
              active={isActive(
                "/user/preaching"
              )}
              label="Preaching"
              icon="🎤"
            />
          )}

          {features.morningProgram && (
            <SidebarItem
              href="/user/morning-program"
              active={isActive(
                "/user/morning-program"
              )}
              label="Morning Program"
              icon="🌅"
            />
          )}

          {features.sevaBoard && (
            <SidebarItem
              href="/user/seva-board"
              active={isActive(
                "/user/seva-board"
              )}
              label="Seva Board"
              icon="📋"
            />
          )}

          {/* KITCHEN - Daily Items */}
          <SidebarItem
            href="/user/kitchen"
            active={isActive(
              "/user/kitchen"
            )}
            label="Today's Kitchen"
            icon="🍲"
          />

          {features.library && (
            <SidebarItem
              href="/user/library"
              active={isActive(
                "/user/library"
              )}
              label="Library"
              icon="📚"
            />
          )}

          {features.reports && (
            <SidebarItem
              href="/user/reports"
              active={isActive(
                "/user/reports"
              )}
              label="Reports"
              icon="📊"
            />
          )}

          {/* =====================
              ADMIN SECTION
          ===================== */}

          {features.admin && (
            <div className="mt-4">
              <div className="px-4 py-2 text-sm font-bold text-yellow-200 uppercase">
                🛡️ Admin
              </div>

              {/* SEVA ALLOT */}

              {adminFeatures.includes(
                "sevaAlot"
              ) && (
                <SidebarItem
                  href="/user/admin/seva-allot"
                  active={isActive(
                    "/user/admin/seva-allot"
                  )}
                  label="Seva Allot"
                  icon="🙏"
                  nested
                />
              )}

              {/* MORNING PROGRAM */}

              {adminFeatures.includes(
                "morningProgramAlot"
              ) && (
                <SidebarItem
                  href="/user/admin/morning-program"
                  active={isActive(
                    "/user/admin/morning-program"
                  )}
                  label="Morning Program"
                  icon="🌅"
                  nested
                />
              )}

              {/* KITCHEN */}

              {adminFeatures.includes(
                "kitchen"
              ) && (
                <SidebarItem
                  href="/user/admin/kitchen"
                  active={isActive(
                    "/user/admin/kitchen"
                  )}
                  label="Kitchen"
                  icon="🍲"
                  nested
                />
              )}

              {/* ACCOUNT */}

              {adminFeatures.includes(
                "account"
              ) && (
                <SidebarItem
                  href="/user/admin/account"
                  active={isActive(
                    "/user/admin/account"
                  )}
                  label="Accounts"
                  icon="💰"
                  nested
                />
              )}
            </div>
          )}
        </nav>

        {/* LOGOUT */}

        <div className="p-4 border-t border-yellow-700">
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className={`w-full py-2 rounded-lg text-sm font-medium ${
              logoutLoading
                ? "bg-gray-400"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {logoutLoading
              ? "Logging out..."
              : "Logout"}
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="flex-1 p-6 bg-yellow-50 overflow-y-auto">
        {/* HEADER */}

        <header className="bg-yellow-700 text-white py-4 px-6 flex justify-between items-center shadow-md">
          <div>
            <h1 className="text-lg font-semibold">
              🪔 Hare Krishna!
            </h1>

            <p className="text-sm opacity-90">
              Welcome,&nbsp;
              <span className="font-bold capitalize">
                {userData?.firstName ||
                  user?.displayName?.split(
                    " "
                  )[0] ||
                  "Devotee"}{" "}
                Pr
              </span>
            </p>
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

/* =====================
 SIDEBAR ITEM
===================== */

function SidebarItem({
  href,
  active,
  label,
  icon,
  nested = false,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: string;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        block py-2 rounded-r-full transition
        ${
          nested
            ? "pl-10 pr-4 text-sm"
            : "px-4"
        }
        ${
          active
            ? "bg-yellow-600 font-semibold"
            : "hover:bg-yellow-700"
        }
      `}
    >
      {icon} {label}
    </Link>
  );
}