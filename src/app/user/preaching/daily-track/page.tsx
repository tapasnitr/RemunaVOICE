"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackHeaderButton from "@/components/BackHeaderButton";

/* =======================
 TYPES
======================= */

interface Mentee {
  id: string;
  name: string;
  mentors: string[];
}

type InteractionType = "camp_class" | "normal_meet" | "mmc";
type OutcomeType = "improved" | "neutral" | "room_closed";

/* =======================
 PAGE
======================= */

export default function DailyTrackPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(false);

  /* -------- FORM STATE -------- */
  const [menteeId, setMenteeId] = useState("");
  const [interactionType, setInteractionType] =
    useState<InteractionType>("normal_meet");
  const [duration, setDuration] = useState("");
  const [issues, setIssues] = useState("");
  const [guidance, setGuidance] = useState("");
  const [comments, setComments] = useState("");
  const [outcome, setOutcome] =
    useState<OutcomeType>("neutral");
  const [followUp, setFollowUp] = useState("");

  /* -------- LOAD MENTEES -------- */
  useEffect(() => {
    if (!user) return;

    const loadMentees = async () => {
      const q = query(
        collection(db, "mentees"),
        where("mentors", "array-contains", user.uid)
      );

      const snap = await getDocs(q);
      setMentees(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Mentee, "id">),
        }))
      );
    };

    loadMentees();
  }, [user]);

  /* -------- SUBMIT -------- */
  const handleSubmit = async () => {
    if (!menteeId || !issues.trim() || !guidance.trim()) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "preaching_tracks"), {
        mentorId: user?.uid,
        menteeId,
        date: new Date().toISOString().split("T")[0],
        interactionType,
        duration: duration ? Number(duration) : null,
        issues: issues.trim(),
        guidance: guidance.trim(),
        comments: comments.trim(),
        outcome,
        followUp: followUp.trim(),
        createdAt: Timestamp.now(),
      });

      router.push("/user/preaching");
    } catch (err) {
      console.error(err);
      alert("Failed to save daily track");
    } finally {
      setLoading(false);
    }
  };

  /* -------- UI -------- */
  return (
    <div>
      <BackHeaderButton title="Daily Track" link="/user/preaching" backPageName="Back to Preaching" />

      <div className="px-4 pt-4 max-w-md mx-auto space-y-4">
        <h1 className="text-lg font-bold text-yellow-800 text-center">
          📋 Daily Preaching Track
        </h1>

        {/* MENTEE */}
        <Select
          label="Mentee *"
          value={menteeId}
          onChange={setMenteeId}
          options={[
            { value: "", label: "Select mentee" },
            ...mentees.map((m) => ({
              value: m.id,
              label: m.name,
            })),
          ]}
        />

        {/* INTERACTION TYPE */}
        <Select
          label="Interaction Type"
          value={interactionType}
          onChange={(v) =>
            setInteractionType(v as InteractionType)
          }
          options={[
            { value: "camp_class", label: "🏕️ Camp / Class" },
            { value: "normal_meet", label: "🤝 Normal Meet" },
            { value: "mmc", label: "📞 MMC" },
          ]}
        />

        <Input
          label="Duration (minutes)"
          value={duration}
          onChange={setDuration}
          type="number"
        />

        <Textarea
          label="Problems / Issues Discussed *"
          value={issues}
          onChange={setIssues}
          placeholder="Personal, spiritual, academic, mental..."
        />

        <Textarea
          label="Guidance / Instructions Given *"
          value={guidance}
          onChange={setGuidance}
          placeholder="Chanting, reading, discipline, service..."
        />

        {/* COMMENTS */}
        <Textarea
          label="Important Comments / Observations"
          value={comments}
          onChange={setComments}
          placeholder="Key points to remember, mood, sincerity, blockers..."
        />

        {/* OUTCOME */}
        <Select
          label="Outcome"
          value={outcome}
          onChange={(v) =>
            setOutcome(v as OutcomeType)
          }
          options={[
            { value: "improved", label: "🟢 Improved" },
            { value: "neutral", label: "🟡 Neutral" },
            { value: "room_closed", label: "🔴 Room Closed" },
          ]}
        />

        <Textarea
          label="Follow‑up Plan"
          value={followUp}
          onChange={setFollowUp}
          placeholder="Next meet, call, temple visit..."
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold ${
            loading
              ? "bg-gray-400"
              : "bg-yellow-700 hover:bg-yellow-800"
          }`}
        >
          {loading ? "Saving..." : "Save Daily Track"}
        </button>
      </div>
    </div>
  );
}

/* =======================
 UI HELPERS
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

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border px-3 py-2 rounded resize-none"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
