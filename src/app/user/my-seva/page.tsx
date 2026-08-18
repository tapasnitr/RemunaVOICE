"use client";

import BackPageName from "@/components/BackHeaderButton";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { indianDateKey } from "@/utils/date";

/* =====================
 TYPES
===================== */

interface Person {
  uid: string;
  name: string;
  completed?: boolean;
  completedAt?: string;
}

interface SubSection {
  title: string;
  time?: string;
  people: Person[];
}

interface Section {
  title: string;
  time?: string;
  people?: Person[];
  subSections?: SubSection[];
}

interface MySevaItem {
  title: string;
  subTitle?: string;
  sevaTime?: string;
  completed: boolean;
  completedAt?: string;
  source: "daily" | "morning";
}

/* =====================
 HELPERS
===================== */

function todayKey() {
  return indianDateKey();
}

function nowISO() {
  return new Date().toISOString();
}

/* =====================
 PAGE
===================== */

export default function MySevaPage() {
  const { user } = useAuth();

  const [dailySeva, setDailySeva] = useState<MySevaItem[]>([]);
  const [morningSeva, setMorningSeva] = useState<MySevaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const date = todayKey();

      const dailySnap = await getDoc(
        doc(db, "dailySevaBoardAllotments", date)
      );
      if (dailySnap.exists()) {
        setDailySeva(
          extractMySeva(dailySnap.data()?.sections ?? [], user.uid, "daily")
        );
      }

      const morningSnap = await getDoc(
        doc(db, "morningProgramAllotments", date)
      );
      if (morningSnap.exists()) {
        setMorningSeva(
          extractMySeva(
            morningSnap.data()?.sections ?? [],
            user.uid,
            "morning"
          )
        );
      }

      setLoading(false);
    };

    load();
  }, [user]);

  /* =====================
   MARK COMPLETE
  ===================== */

  const markComplete = async (item: MySevaItem) => {
    if (!user) return;

    const ok = confirm(
      `Mark "${item.title}${
        item.subTitle ? ` - ${item.subTitle}` : ""
      }" as completed?`
    );
    if (!ok) return;

    const ref = doc(
      db,
      item.source === "daily"
        ? "dailySevaBoardAllotments"
        : "morningProgramAllotments",
      todayKey()
    );

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const sections: Section[] = snap.data()?.sections ?? [];

    sections.forEach((sec) => {
      if (sec.title !== item.title) return;

      /* MAIN SEVA */
      sec.people?.forEach((p) => {
        if (!item.subTitle && p.uid === user.uid) {
          p.completed = true;
          p.completedAt = nowISO();
        }
      });

      /* SUB SECTION SEVA */
      sec.subSections?.forEach((sub) => {
        if (sub.title !== item.subTitle) return;

        sub.people.forEach((p) => {
          if (p.uid === user.uid) {
            p.completed = true;
            p.completedAt = nowISO();
          }
        });
      });
    });

    await updateDoc(ref, { sections });

    const update = (list: MySevaItem[]) =>
      list.map((s) =>
        s.title === item.title && s.subTitle === item.subTitle
          ? { ...s, completed: true, completedAt: nowISO() }
          : s
      );

    item.source === "daily"
      ? setDailySeva(update)
      : setMorningSeva(update);
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-yellow-700 font-semibold">
        Loading your seva…
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <BackPageName
        link="/user/dashboard"
        title="My Seva"
        backPageName="Back to Dashboard"
      />

      <SectionBlock title="Daily Seva" items={dailySeva} onComplete={markComplete} />
      <SectionBlock
        title="Morning Program Seva"
        items={morningSeva}
        onComplete={markComplete}
      />
    </div>
  );
}

/* =====================
 EXTRACTOR (FIXED)
===================== */

function extractMySeva(
  sections: Section[],
  uid: string,
  source: "daily" | "morning"
): MySevaItem[] {
  const list: MySevaItem[] = [];

  sections.forEach((sec) => {
    /* MAIN SEVA */
    sec.people?.forEach((p) => {
      if (p.uid === uid) {
        list.push({
          title: sec.title,
          sevaTime: sec.time,
          completed: !!p.completed,
          completedAt: p.completedAt,
          source,
        });
      }
    });

    /* SUB SECTIONS */
    sec.subSections?.forEach((sub) => {
      sub.people.forEach((p) => {
        if (p.uid === uid) {
          list.push({
            title: sec.title,
            subTitle: sub.title,
            sevaTime: sub.time,
            completed: !!p.completed,
            completedAt: p.completedAt,
            source,
          });
        }
      });
    });
  });

  return list;
}

/* =====================
 UI
===================== */

function SectionBlock({
  title,
  items,
  onComplete,
}: {
  title: string;
  items: MySevaItem[];
  onComplete: (item: MySevaItem) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-yellow-800 mb-2">{title}</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 bg-yellow-50 p-3 rounded">
          No seva assigned 🙏
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((s, i) => (
            <div
              key={i}
              className="border border-yellow-300 rounded-lg p-3 bg-yellow-50"
            >
              <p className="font-semibold text-yellow-900">
                {s.title}
                {s.subTitle && (
                  <span className="text-sm text-gray-600">
                    {" "}
                    – {s.subTitle}
                  </span>
                )}
              </p>

              {s.sevaTime && (
                <p className="text-xs text-blue-700">
                  🕒 Seva Time: <strong>{s.sevaTime}</strong>
                </p>
              )}

              <button
                disabled={s.completed}
                onClick={() => onComplete(s)}
                className={`mt-2 w-full py-1.5 rounded font-semibold text-sm ${
                  s.completed
                    ? "bg-green-600 text-white cursor-not-allowed"
                    : "bg-yellow-700 text-white hover:bg-yellow-800"
                }`}
              >
                {s.completed ? "✅ Completed" : "Mark as Complete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
