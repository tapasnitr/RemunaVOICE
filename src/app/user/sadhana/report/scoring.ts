import { SadhanaDaily } from "./types";

/*
  New weekly scoring (Soul / Body) based on provided rules.

  Soul totals (weekly): ~770
  Body totals (weekly): ~630

  The calculator uses optional fields when present (chantingTime, sadhanaFirstFillTime),
  and falls back to `japaTime` when exact times aren't available.
*/

function parseHour(time?: string): number | null {
  if (!time) return null;
  // try ISO datetime or HH:MM
  const t = time.trim();
  const isoMatch = t.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) return Number(isoMatch[1]);
  const hhmm = t.match(/^(\d{1,2}):(\d{2})/);
  if (hhmm) return Number(hhmm[1]);
  return null;
}

export function calculateWeeklyScore(records: SadhanaDaily[]) {
  // SOUL
  let chantingMarks = 0; // sum of daily chanting marks (30/15/0/-5)
  let readingHearingMin = 0; // sum of personalHearingMin + spBookReadingMin
  let sadhanaFillMarks = 0; // 5 marks per day when filled on time
  let bookReadingMarks = 0; // 10 marks per day when attended
  let slokaCount = 0;

  for (const r of records) {
    // chanting: prefer `chantingTime` (HH:MM or ISO), fallback to `japaTime`
    const hr = parseHour(r.chantingTime || undefined);
    if (hr !== null) {
      if (hr < 9) chantingMarks += 30;
      else if (hr < 17) chantingMarks += 15;
      else if (hr < 21) chantingMarks += 0;
      else chantingMarks += -5;
    } else {
      // fallback mapping from japaTime
      if (r.japaTime === 2) chantingMarks += 30;
      else if (r.japaTime === 1) chantingMarks += 15;
      else chantingMarks += 0;
    }

    readingHearingMin += (r.personalHearingMin || 0) + (r.spBookReadingMin || 0);

    // sadhana fill: if sadhanaFirstFillTime exists treat as filled on time for now
    // (ideally compare timestamp to next day 09:00; fallback: presence => 5)
    if (r.sadhanaFirstFillTime) sadhanaFillMarks += 5;

    // book reading attendance
    if ((r as any).bookReadingClass) bookReadingMarks += 10;

    slokaCount += r.slokaLearntCount || 0;
  }

  const readingHearingMarks = Math.min(readingHearingMin, 210);
  const sadhanaWeeklyMarks = Math.min(sadhanaFillMarks, 35);
  const bookReadingWeeklyMarks = Math.min(bookReadingMarks, 70);
  const slokaMarks = Math.min(slokaCount * 5, 35);

  const soulTotal =
    chantingMarks +
    readingHearingMarks +
    sadhanaWeeklyMarks +
    bookReadingWeeklyMarks +
    slokaMarks;

  // BODY
  let wakeUpMarks = 0; // 30 per day
  let sleepMarks = 0; // 30 per day
  let dayRestMarks = 0; // 30 per day

  for (const r of records) {
    if (r.wakeUpBeforeTime) wakeUpMarks += 30;
    if (r.sleptBeforeTime) sleepMarks += 30;
    if (r.dayRestBelow30) dayRestMarks += 30;
  }

  const bodyTotal = wakeUpMarks + sleepMarks + dayRestMarks;

  const total = soulTotal + bodyTotal;

  return {
    soul: {
      chantingMarks,
      readingHearingMin,
      readingHearingMarks,
      sadhanaWeeklyMarks,
      bookReadingWeeklyMarks,
      slokaCount,
      slokaMarks,
      total: soulTotal,
    },
    body: {
      wakeUpMarks,
      sleepMarks,
      dayRestMarks,
      total: bodyTotal,
    },
    total,
  };
}
