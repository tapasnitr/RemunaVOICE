"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserData {
   uid: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  dob?: string;
  provider?: string;
  displayName?: string;
  features?: {
    seva?: boolean;
    sadhana?: boolean;
    profile?: boolean;
    sevaAlot?: boolean;
    preaching?: boolean;
    morningProgram?: boolean;
    admin?: boolean;
    kitchen?: boolean;
    library?: boolean;
    reports?: boolean;
    sevaBoard?: boolean;
  }
  adminFeatures?: string[];
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // 🔹 Fetch additional user info from Firestore
        try {
          const userRef = doc(db, "devotees", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data() as UserData);
          } else {
            console.warn("⚠️ No Firestore user data found for:", firebaseUser.uid);
            setUserData(null);
          }
        } catch (err) {
          console.error("Error fetching Firestore user data:", err);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
