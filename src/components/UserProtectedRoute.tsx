"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

export default function UserProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // 🔍 Check if user is a registered devotee (not admin)
      const userRef = doc(db, "devotees", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setAuthorized(true);
      } else {
        // Not a normal user → maybe admin or invalid
        router.push("/login");
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-yellow-50 text-yellow-800">
        <div className="animate-spin h-10 w-10 border-4 border-yellow-700 border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg font-semibold">Checking access...</p>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
