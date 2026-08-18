"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackHeader from "@/components/BackHeader";

/* =======================
 TYPES
======================= */

interface Devotee {
  uid: string;
  firstName?: string;
  lastName?: string;
  features?: {
    preaching?: boolean;
  };
}

type StatusType = "green" | "yellow" | "red";

/* =======================
 PAGE
======================= */

export default function AddMenteePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [loading, setLoading] = useState(false);

  /* -------- FORM STATE -------- */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [room, setRoom] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<StatusType>("green");
  const [mentors, setMentors] = useState<string[]>([]);

  /* -------- LOAD DEVOTEES -------- */
  useEffect(() => {
    const loadDevotees = async () => {
      const snap = await getDocs(collection(db, "devotees"));

      const list = snap.docs
        .map((d) => ({
          uid: d.id,
          ...(d.data() as Omit<Devotee, "uid">),
        }))
        .filter((d) => d.features?.preaching);

      setDevotees(list);

      // ✅ Default mentor = logged in user
      if (user?.uid) {
        setMentors([user.uid]);
      }
    };

    loadDevotees();
  }, [user]);

  /* -------- SUBMIT -------- */
  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      alert("Name and Phone are mandatory");
      return;
    }

    if (mentors.length === 0) {
      alert("Please select at least one mentor");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "mentees"), {
        name: name.trim(),
        phone: phone.trim(),
        room: room.trim(),
        address: address.trim(),
        status,
        mentors,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
      });

      router.push("/user/preaching");
    } catch (err) {
      console.error("Failed to add mentee:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* -------- UI -------- */
  return (
    <div>
      <BackHeader title="Add Mentee" />

      <div className="px-4 pt-4 max-w-md mx-auto space-y-4">
        <h1 className="text-lg font-bold text-yellow-800 text-center">
          ➕ Register New Mentee
        </h1>

        <Input label="Name *" value={name} onChange={setName} />
        <Input
          label="Phone Number *"
          value={phone}
          onChange={setPhone}
          type="tel"
        />
        <Input label="Room Number" value={room} onChange={setRoom} />
        <Input label="Address" value={address} onChange={setAddress} />

        {/* STATUS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as StatusType)
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="green">🟢 Green (Stable)</option>
            <option value="yellow">🟡 Yellow (Needs Care)</option>
            <option value="red">🔴 Red (Critical)</option>
          </select>
        </div>

        {/* MENTOR SELECT */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Mentors
          </label>

          <div className="border rounded p-2 max-h-44 overflow-auto space-y-1">
            {devotees.map((d) => {
              const nameLabel = `${d.firstName || ""} ${
                d.lastName || ""
              }`.trim();

              return (
                <label
                  key={d.uid}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={mentors.includes(d.uid)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMentors((m) => [...m, d.uid]);
                      } else {
                        setMentors((m) =>
                          m.filter((id) => id !== d.uid)
                        );
                      }
                    }}
                  />
                  {nameLabel || "Devotee"}
                  {d.uid === user?.uid && (
                    <span className="text-xs text-yellow-700">
                      (You)
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {/* SELECTED DISPLAY */}
          <div className="mt-2 text-xs text-gray-600">
            Selected Mentors:{" "}
            <span className="font-medium">
              {mentors.length}
            </span>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold ${
            loading
              ? "bg-gray-400"
              : "bg-yellow-700 hover:bg-yellow-800"
          }`}
        >
          {loading ? "Saving..." : "Save Mentee"}
        </button>
      </div>
    </div>
  );
}

/* =======================
 INPUT COMPONENT
======================= */

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
    </div>
  );
}
