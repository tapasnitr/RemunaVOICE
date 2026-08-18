"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Firebase Auth
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  AuthError,
} from "firebase/auth";

// Firestore
import { doc, getDoc } from "firebase/firestore";

// Firebase config
import { auth, db } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔁 Auto redirect if already logged in AND admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          router.push("/admin/dashboard");
        }
      } catch (err) {
        console.error("Admin auto-check failed", err);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 🔐 Handle Login
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1️⃣ Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      // 2️⃣ Check Admin in Firestore
      console.log("Checking admin:", user);
      
      const adminRef = doc(db, "admins", user.uid);

      console.log(" admin:", adminRef);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        await signOut(auth);
        setMessage("❌ Access denied. You are not an admin.");
        return;
      }

      const adminData = adminSnap.data();

      // Optional role check (recommended)
      if (adminData.role && adminData.role !== "admin") {
        await signOut(auth);
        setMessage("❌ Unauthorized admin role.");
        return;
      }

      // 3️⃣ Success
      router.push("/admin/dashboard");
    } catch (error) {
      const err = error as AuthError;
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-yellow-600">
        <h2 className="text-2xl font-bold text-center text-yellow-800 mb-6">
          Admin Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
            className="w-full border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
            className="w-full border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400"
                : "bg-yellow-700 hover:bg-yellow-800"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-red-600 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
