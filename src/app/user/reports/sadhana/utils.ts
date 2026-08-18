import { SadhanaRecord } from "./types";

/* ---------- CONFIG ---------- */

export const SOUL_KEYS = [
  "japaBefore10",
  "personalHearing1hr",
  "spBookReading1hr",
  "bookReadingAttended",
  "slokaLearnt",
] as const;

export const BODY_KEYS = [
  "dayRestBelow30",
  "sleptBeforeTime",
  "wakeUpBeforeTime",
  "studyOrPreaching1hr",
] as const;

/* ---------- MARKS PER ITEM ---------- */
export const ITEM_MARKS: Record<string, number> = {
  japaBefore10: 2, // 🔥 IMPORTANT
  personalHearing1hr: 1,
  spBookReading1hr: 1,
  bookReadingAttended: 1,
  slokaLearnt: 1,
  dayRestBelow30: 1,
  sleptBeforeTime: 1,
  wakeUpBeforeTime: 1,
  studyOrPreaching1hr: 1,
};

export const DAILY_TOTAL_MARKS = 10;

/* ---------- CALCULATIONS ---------- */

export function calcItemScore(
  records: SadhanaRecord[],
  key: keyof SadhanaRecord
): number {
  return records.reduce((sum, r) => {
    if (r[key] === 1) return sum + ITEM_MARKS[key as string];
    return sum;
  }, 0);
}

export function calcTotalScore(
  records: SadhanaRecord[]
): number {
  return records.reduce((sum, r) => {
    return (
      sum +
      (r.japaBefore10 === 1 ? 2 : 0) +
      (r.personalHearing1hr === 1 ? 1 : 0) +
      (r.spBookReading1hr === 1 ? 1 : 0) +
      (r.bookReadingAttended === 1 ? 1 : 0) +
      (r.slokaLearnt === 1 ? 1 : 0) +
      (r.dayRestBelow30 === 1 ? 1 : 0) +
      (r.sleptBeforeTime === 1 ? 1 : 0) +
      (r.wakeUpBeforeTime === 1 ? 1 : 0) +
      (r.studyOrPreaching1hr === 1 ? 1 : 0)
    );
  }, 0);
}

/* ---------- HELPERS ---------- */

export function percent(scored: number, total: number): number {
  return total === 0 ? 0 : Math.round((scored / total) * 100);
}

export function colorByPercent(p: number): string {
  if (p >= 90) return "bg-green-500 text-white";
  if (p >= 60) return "bg-yellow-400 text-black";
  if (p >= 40) return "bg-orange-400 text-black";
  return "bg-red-500 text-white";
}

/* ---------- TILL DATE DAYS ---------- */
export function daysTillDate(year: number, month: number): number {
  const today = new Date();
  if (
    today.getFullYear() === year &&
    today.getMonth() === month
  ) {
    return today.getDate();
  }
  return new Date(year, month + 1, 0).getDate();
}



export function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}
export function getWeekRange(baseDate: Date) {
  const date = new Date(baseDate);
  const day = date.getDay(); // 0 = Sunday

  const start = new Date(date);
  start.setDate(date.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function formatYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}
