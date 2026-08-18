"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { auth, db, googleProvider } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import { FirebaseError } from "firebase/app";

interface RegisterForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dob: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dob: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🚦 Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/user/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange =
    (field: keyof RegisterForm) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // 📩 Email registration
  const handleEmailRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      // register in Firestore
      await setDoc(doc(db, "devotees", user.uid), {
        uid: user.uid,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        provider: "email",
        createdAt: new Date(),
      });

      setMessage("✅ Registered successfully!");
      router.push("/user/dashboard");
    } catch (error) {
      const err = error as FirebaseError;
      setMessage("❌ " + (err.message || "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  // 🌸 Google registration
  // const handleGoogleRegister = async () => {
  //   setLoading(true);
  //   setMessage("");
  //   try {
  //     const result = await signInWithPopup(auth, googleProvider);
  //     const user = result.user;
  //     const userRef = doc(db, "devotees", user.uid);
  //     const snap = await getDoc(userRef);

  //     // Split displayName into first/middle/last
  //     const nameParts = (user.displayName || "").trim().split(" ");
  //     const firstName = nameParts[0] || "";
  //     const middleName =
  //       nameParts.length === 3
  //         ? nameParts[1]
  //         : nameParts.length > 3
  //         ? nameParts.slice(1, -1).join(" ")
  //         : "";
  //     const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  //     if (!snap.exists()) {
  //       const dob = prompt("Please enter your Date of Birth (YYYY-MM-DD):") || "";

  //       await setDoc(userRef, {
  //         uid: user.uid,
  //         firstName,
  //         middleName,
  //         lastName,
  //         email: user.email,
  //         photoURL: user.photoURL,
  //         dob,
  //         provider: "google",
  //         createdAt: new Date(),
  //       });
  //     }

  //     setMessage("✅ Registered/Login successful!");
  //     router.push("/user/dashboard");
  //   } catch (error) {
  //     const err = error as FirebaseError;
  //     console.error("Google register error:", err);
  //     setMessage("❌ " + (err.message || "Google registration failed."));
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-yellow-50 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md border border-yellow-600">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-yellow-800 mb-6">
          Devotee Registration
        </h2>

        <form onSubmit={handleEmailRegister} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange("firstName")}
              required
              className="w-1/3 border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
            <input
              type="text"
              placeholder="Middle Name"
              value={form.middleName}
              onChange={handleChange("middleName")}
              className="w-1/3 border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange("lastName")}
              required
              className="w-1/3 border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange("email")}
            required
            className="w-full border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange("password")}
            required
            className="w-full border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
            required
            className="w-full border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange("phone")}
            required
            className="w-full border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
          />

          <input
            type="date"
            value={form.dob}
            onChange={handleChange("dob")}
            required
            className="w-full border border-yellow-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition text-sm sm:text-base ${
              loading ? "bg-gray-400" : "bg-yellow-700 hover:bg-yellow-800"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* <div className="my-4 text-center text-gray-600 font-semibold text-sm sm:text-base">
          OR
        </div> */}

        {/* <button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 rounded-lg font-semibold transition hover:bg-gray-50 text-sm sm:text-base"
        >
          <FcGoogle className="text-xl sm:text-2xl" />
          {loading ? "Connecting..." : "Register with Google"}
        </button> */}

        <p className="text-center mt-6 text-gray-700 text-sm sm:text-base">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/")}
            className="text-yellow-700 font-semibold hover:underline"
          >
            Login here
          </button>
        </p>

        {message && (
          <p className="text-center mt-4 text-yellow-800 font-medium text-sm sm:text-base">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
