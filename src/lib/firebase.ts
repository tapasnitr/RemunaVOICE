import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC7Cdsl0jrKxIGeOKbdzCQDPLn5NaC1poE",
  authDomain: "remunavoicerkl.firebaseapp.com",
  projectId: "remunavoicerkl",
  storageBucket: "remunavoicerkl.firebasestorage.app",
  messagingSenderId: "225057405832",
  appId: "1:225057405832:web:717b49b134398b9fb3183d",
  measurementId: "G-2NWQ2VBYL3",
};

// ✅ Prevent re‑initialization (VERY IMPORTANT for Next.js)
export const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// ✅ Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
