"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackPageName from "@/components/BackHeaderButton";
import { Info } from "lucide-react";
import { SadhanaDaily, YesNo, JapaTime } from "../report/types";

/* ================= DEFAULT ================= */

const defaultForm: SadhanaDaily = {
  userId: "",
  date: "",

  japaTime: 0,
  bookReadingClass: 0,

  personalHearingMin: 0,
  spBookReadingMin: 0,
  slokaLearntCount: 0,
  chantingTime: "",
  sadhanaFirstFillTime: "",

  dayRestBelow30: 0,
  sleptBeforeTime: 0,
  wakeUpBeforeTime: 0,
  studyOrPreachingMin: 0, // ✅ CHANGED
};

/* ================= UI HELPERS ================= */

function YesNoToggle({
  value,
  onChange,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(0)}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          value === 0 ? "bg-red-600 text-white" : "bg-gray-200"
        }`}
      >
        No
      </button>
      <button
        onClick={() => onChange(1)}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          value === 1 ? "bg-green-600 text-white" : "bg-gray-200"
        }`}
      >
        Yes
      </button>
    </div>
  );
}

function JapaToggle({
  value,
  onChange,
}: {
  value: JapaTime;
  onChange: (v: JapaTime) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange(2)}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          value === 2 ? "bg-green-600 text-white" : "bg-gray-200"
        }`}
      >
        Before 10 AM
      </button>
      <button
        onClick={() => onChange(1)}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          value === 1 ? "bg-yellow-600 text-white" : "bg-gray-200"
        }`}
      >
        Before 1 PM
      </button>
      <button
        onClick={() => onChange(0)}
        className={`px-3 py-1 rounded text-sm font-semibold ${
          value === 0 ? "bg-red-600 text-white" : "bg-gray-200"
        }`}
      >
        No
      </button>
    </div>
  );
}

function RuleInfo({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Info
        size={16}
        className="cursor-pointer text-gray-500"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Weekly Marks Rule</h3>
            <div className="text-sm space-y-1">{children}</div>
            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full bg-yellow-700 text-white py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center border-b py-2 gap-4">
      <div className="text-sm">{label}</div>
      {children}
    </div>
  );
}

/* ================= PAGE ================= */

export default function SadhanaFillPage() {
  const { user, loading } = useAuth();

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [form, setForm] = useState<SadhanaDaily>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const docId = user ? `${user.uid}_${date}` : null;

  /* LOAD */
  useEffect(() => {
    if (!user || !docId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "sadhana_entries", docId));
      if (snap.exists()) {
        setForm(snap.data() as SadhanaDaily);
      } else {
        setForm({ ...defaultForm, userId: user.uid, date });
      }
    };

    load();
  }, [user, docId, date]);

  /* SAVE */
  const save = async () => {
    if (!user || !docId) return;

    setSaving(true);
    setMessage("");

    try {
      const ref = doc(db, "sadhana_entries", docId);
      const snap = await getDoc(ref);

      // Preserve existing sadhanaFirstFillTime if present, otherwise set now
      const existing = snap.exists() ? (snap.data() as any) : null;
      const firstFill = existing?.sadhanaFirstFillTime || form.sadhanaFirstFillTime || new Date().toISOString();

      await setDoc(
        ref,
        {
          ...form,
          userId: user.uid,
          date,
          sadhanaFirstFillTime: firstFill,
          updatedAt: serverTimestamp(),
          createdAt: existing?.createdAt || serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Save failed:", err);
      setMessage("❌ Save failed");
    }

    setSaving(false);
    setMessage("✅ Sadhana saved");
  };

  const update = <K extends keyof SadhanaDaily>(
    key: K,
    value: SadhanaDaily[K]
  ) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  if (loading) return <div className="pt-32 text-center">Loading…</div>;
  if (!user) return <div className="pt-32 text-center">Please login</div>;

  return (
    <div>
      <BackPageName title="Sadhana Fill" link="/user/sadhana" />

      <div className="pt-3 pb-24 px-4 max-w-md mx-auto">
        {/* DATE */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        />

        {/* SOUL */}
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">🟡 Soul</h2>

        <Row label="Japa completed">
          <JapaToggle
            value={form.japaTime}
            onChange={(v) => update("japaTime", v)}
          />
        </Row>

        <Row
          label={
            <div className="flex items-center gap-2">
              Personal hearing (minutes – daily)
              <RuleInfo>
                <p>Weekly total ≥ 420 → 7 marks</p>
                <p>360–419 → 6</p>
                <p>300–359 → 5</p>
                <p>240–299 → 4</p>
                <p>180–239 → 3</p>
                <p>120–179 → 2</p>
                <p>60–119 → 1</p>
                <p>&lt; 60 → 0</p>
              </RuleInfo>
            </div>
          }
        >
          <input
            type="number"
            min={0}
            value={form.personalHearingMin}
            onChange={(e) =>
              update("personalHearingMin", Number(e.target.value))
            }
            className="w-24 border rounded px-2 py-1 text-sm"
          />
        </Row>

        <Row label="Read SP book (minutes – daily)">
          <input
            type="number"
            min={0}
            value={form.spBookReadingMin}
            onChange={(e) =>
              update("spBookReadingMin", Number(e.target.value))
            }
            className="w-24 border rounded px-2 py-1 text-sm"
          />
        </Row>

        <Row label="Book reading class attended">
          <YesNoToggle
            value={form.bookReadingClass}
            onChange={(v) => update("bookReadingClass", v)}
          />
        </Row>

        <Row label="Sloka learnt (count – daily)">
          <input
            type="number"
            min={0}
            value={form.slokaLearntCount}
            onChange={(e) =>
              update("slokaLearntCount", Number(e.target.value))
            }
            className="w-20 border rounded px-2 py-1 text-sm"
          />
        </Row>

        <Row label="Chanting time (optional)">
          <input
            type="time"
            value={form.chantingTime || ""}
            onChange={(e) => update("chantingTime", e.target.value)}
            className="w-32 border rounded px-2 py-1 text-sm"
          />
        </Row>

        {/* BODY */}
        <h2 className="text-lg font-semibold text-green-800 mt-6 mb-2">
          🟢 Body
        </h2>

        <Row label="Day rest < 30 minutes">
          <YesNoToggle
            value={form.dayRestBelow30}
            onChange={(v) => update("dayRestBelow30", v)}
          />
        </Row>

        <Row label="Slept before time
(Working < 10:00 PM
Student < 9:45 PM)">
          <YesNoToggle
            value={form.sleptBeforeTime}
            onChange={(v) => update("sleptBeforeTime", v)}
          />
        </Row>

        <Row label="Wake up before time
(Working < 4:00 AM
Student < 3:45 AM)">
          <YesNoToggle
            value={form.wakeUpBeforeTime}
            onChange={(v) => update("wakeUpBeforeTime", v)}
          />
        </Row>

        {/* ✅ UPDATED FIELD */}
        <Row
          label={
            <div className="flex items-center gap-2">
             Students :Study /
Working : Preaching (minutes – daily)
              <RuleInfo>
                <p>Weekly total ≥ 420 → 7 marks</p>
                <p>360–419 → 6</p>
                <p>300–359 → 5</p>
                <p>240–299 → 4</p>
                <p>180–239 → 3</p>
                <p>120–179 → 2</p>
                <p>60–119 → 1</p>
                <p>&lt; 60 → 0</p>
              </RuleInfo>
            </div>
          }
        >
          <input
            type="number"
            min={0}
            value={form.studyOrPreachingMin}
            onChange={(e) =>
              update("studyOrPreachingMin", Number(e.target.value))
            }
            className="w-24 border rounded px-2 py-1 text-sm"
          />
        </Row>

        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-6 py-2 rounded text-white bg-yellow-700"
        >
          {saving ? "Saving…" : "Save Sadhana"}
        </button>

        {message && (
          <p className="text-center mt-3 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
