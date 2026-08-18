"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        setAuthorized(false);
        setChecking(false);
        return;
      }

      // ✅ Check if user is marked as admin in Firestore
      const ref = doc(db, "admins", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setAuthorized(true);
      } else {
        alert("🚫 You are not authorized to access admin panel.");
        router.replace("/");
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-yellow-50 text-yellow-800">
        <div className="animate-spin h-10 w-10 border-4 border-yellow-700 border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg font-semibold">Checking admin access...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
