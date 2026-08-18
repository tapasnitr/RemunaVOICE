"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/"); // redirect to login if not logged in
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center text-yellow-700 font-semibold">
        Checking authentication...
      </div>
    );
  }

  return <>{user ? children : null}</>;
}
