"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [resetEmail, setResetEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();

  // 🔁 Redirect if already logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      if (user) router.push("/user/dashboard");
    });
    return () => unsub();
  }, [router]);

  // 📩 Email login
  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push("/user/dashboard");
    } catch (err) {
      setMessage("❌ Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Forgot password
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setMessage("❌ Please enter your email");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMessage(
        "✅ Password reset link sent. Please check your email inbox."
      );
      setShowForgot(false);
      setResetEmail("");
    } catch (err) {
      const error = err as FirebaseError;
      setMessage("❌ " + (error.message || "Failed to send reset email"));
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Input handler
  const handleChange =
    (field: keyof LoginForm) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-yellow-100 to-yellow-50 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm border-2 border-yellow-600">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-yellow-800 mb-6">
          🪔 Devotee Login
        </h2>

        {/* LOGIN OR FORGOT PASSWORD */}
        {!showForgot ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange("email")}
              required
              className="w-full border border-yellow-400 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange("password")}
              required
              className="w-full border border-yellow-400 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-semibold ${
                loading
                  ? "bg-gray-400"
                  : "bg-yellow-700 hover:bg-yellow-800"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* <button
              type="button"
              onClick={() => {
                setShowForgot(true);
                setResetEmail(form.email);
              }}
              className="w-full text-sm text-yellow-700 font-semibold hover:underline"
            >
              Forgot Password?
            </button> */}
          </form>
        ) : (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full border border-yellow-400 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none"
            />

            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-semibold ${
                loading
                  ? "bg-gray-400"
                  : "bg-yellow-700 hover:bg-yellow-800"
              }`}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              onClick={() => setShowForgot(false)}
              className="w-full text-sm text-gray-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* MESSAGE */}
        {message && (
          <p className="text-center mt-4 text-yellow-800 font-medium">
            {message}
          </p>
        )}

        {/* REGISTER */}
        {/* <div className="text-center mt-5 text-sm">
          <span className="text-gray-600">New Devotee? </span>
          <button
            onClick={() => router.push("/register")}
            className="text-yellow-700 font-semibold hover:underline"
          >
            Register Here
          </button>
        </div> */}

      <p className="mt-8 text-xs text-yellow-700 italic text-center">
        “Serve the devotees, and Krishna will serve your heart.” 🌼
      </p>
      </div>
    </div>
  );
}
