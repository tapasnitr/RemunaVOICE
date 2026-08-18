"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // 🔁 Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) router.push("/user/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  // 📩 Email login
  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push("/user/dashboard");
    } catch (err: unknown) {
      const error = err as FirebaseError;
      setMessage("❌ " + (error.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  // 🌸 Google login + Firestore auto register
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) throw new Error("No email found from Google account");

      const userRef = doc(db, "devotees", user.uid);
      const userSnap = await getDoc(userRef);

      // ✨ Split name into first & last
      const nameParts = (user.displayName || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // 🪔 Auto-register if new
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          firstName,
          lastName,
          email: user.email,
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          role: "user",
          provider: "google",
        });
      }

      router.push("/user/dashboard");
    } catch (err: unknown) {
      const error = err as FirebaseError;
      setMessage("❌ " + (error.message || "Google Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (field: keyof LoginForm) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-yellow-100 to-yellow-50 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm border-2 border-yellow-600">
        <h2 className="text-3xl font-extrabold text-center text-yellow-800 mb-6">
          🪔 Hare Krishna Devotee Login
        </h2>

        {/* Email Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange("email")}
            required
            className="w-full border border-yellow-400 rounded-lg px-4 py-2.5 text-base focus:ring-2 focus:ring-yellow-500 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange("password")}
            required
            className="w-full border border-yellow-400 rounded-lg px-4 py-2.5 text-base focus:ring-2 focus:ring-yellow-500 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400"
                : "bg-yellow-700 hover:bg-yellow-800 active:bg-yellow-900"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500 font-medium">OR</div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-medium transition flex items-center justify-center gap-3 shadow-sm"
        >
          {loading ? (
            "Connecting..."
          ) : (
            <>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Login with Google</span>
            </>
          )}
        </button>

        {/* Message */}
        {message && (
          <p className="text-center mt-4 text-yellow-800 font-medium">
            {message}
          </p>
        )}

        {/* Register Link */}
        <div className="text-center mt-5 text-sm">
          <span className="text-gray-600">New Devotee? </span>
          <button
            onClick={() => router.push("/register")}
            className="text-yellow-700 font-semibold hover:underline"
          >
            Register Here
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs text-yellow-700 italic text-center">
        “Serve the devotees, and Krishna will serve your heart.” 🌼
      </p>
    </div>
  );
}
