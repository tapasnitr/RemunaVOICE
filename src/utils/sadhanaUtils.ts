export type YesNo = 0 | 1;
export type JapaTime = 0 | 1 | 2;

export interface SadhanaRecord {
  userId: string;
  date: string; // YYYY-MM-DD
  japaBefore10: JapaTime;
  personalHearing1hr: YesNo;
  spBookReading1hr: YesNo;
  bookReadingAttended: YesNo;
  slokaLearnt: YesNo;
  dayRestBelow30: YesNo;
  sleptBeforeTime: YesNo;
  wakeUpBeforeTime: YesNo;
  studyOrPreaching1hr: YesNo;
}

export interface Devotee {
  id: string;
  firstName: string;
}

/* ---------- CONFIG ---------- */

export const SOUL_KEYS: (keyof SadhanaRecord)[] = [
  "japaBefore10",
  "personalHearing1hr",
  "spBookReading1hr",
  "bookReadingAttended",
  "slokaLearnt",
];

export const BODY_KEYS: (keyof SadhanaRecord)[] = [
  "dayRestBelow30",
  "sleptBeforeTime",
  "wakeUpBeforeTime",
  "studyOrPreaching1hr",
];

export const DAYS_IN_MONTH = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

/* ---------- CALCULATIONS ---------- */

export const calcItemScore = (
  records: SadhanaRecord[],
  key: keyof SadhanaRecord
): number =>
  records.reduce((sum, r) => sum + (r[key] === 1 ? 1 : 0), 0);

export const calcTotalScore = (records: SadhanaRecord[]): number =>
  SOUL_KEYS.concat(BODY_KEYS).reduce(
    (s, k) => s + calcItemScore(records, k),
    0
  );

export const percent = (obtained: number, total: number): number =>
  total === 0 ? 0 : Math.round((obtained / total) * 100);

export const colorByPercent = (pct: number): string => {
  if (pct >= 90) return "bg-green-500 text-white";
  if (pct >= 60) return "bg-yellow-400 text-black";
  return "bg-red-500 text-white";
};
