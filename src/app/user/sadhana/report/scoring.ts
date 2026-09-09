import { SadhanaDaily } from "./types";

/*
  New weekly scoring (Soul / Body) based on provided rules.

  Soul totals (weekly): ~770
  Body totals (weekly): ~630

  Submission credit is based on the preserved first submission timestamp.
*/

function submittedBeforeNextDayNineAM(date: string, firstFillTime?: string) {
  if (!firstFillTime || !date) return false;
  const submittedAt = new Date(firstFillTime);
  const deadline = new Date(`${date}T09:00:00`);
  deadline.setDate(deadline.getDate() + 1);
  return !Number.isNaN(submittedAt.getTime()) && submittedAt < deadline;
}

export function calculateWeeklyScore(records: SadhanaDaily[]) {
  // SOUL
  let chantingMarks = 0; // sum of daily chanting marks (30/15/0/-5)
  let personalHearingMin = 0;
  let spBookReadingMin = 0;
  let sadhanaFillMarks = 0; // 5 marks per day when filled on time
  let bookReadingMarks = 0; // 10 marks per day when attended
  let slokaCount = 0;

  for (const r of records) {
    if (r.japaTime === 3) chantingMarks += 30;
    else if (r.japaTime === 2) chantingMarks += 15;
    else if (r.japaTime === 0) chantingMarks -= 5;

    personalHearingMin += r.personalHearingMin || 0;
    spBookReadingMin += r.spBookReadingMin || 0;

    if (submittedBeforeNextDayNineAM(r.date, r.sadhanaFirstFillTime)) {
      sadhanaFillMarks += 5;
    }

    // book reading attendance
    if ((r as any).bookReadingClass) bookReadingMarks += 10;

    slokaCount += r.slokaLearntCount || 0;
  }

  const personalHearingMarks = Math.min(personalHearingMin, 210);
  const spBookReadingMarks = Math.min(spBookReadingMin, 210);
  const sadhanaWeeklyMarks = Math.min(sadhanaFillMarks, 35);
  const bookReadingWeeklyMarks = Math.min(bookReadingMarks, 70);
  const slokaMarks = Math.min(slokaCount * 5, 35);

  const soulTotal =
    chantingMarks +
    personalHearingMarks +
    spBookReadingMarks +
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
      personalHearingMin,
      personalHearingMarks,
      spBookReadingMin,
      spBookReadingMarks,
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
