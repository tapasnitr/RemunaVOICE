export type YesNo = 0 | 1;
// Chanting completion bands: after 9pm, 5–9pm, 9am–5pm, before 9am.
export type JapaTime = 0 | 1 | 2 | 3;

export interface SadhanaDaily {
  userId: string;
  date: string; // YYYY-MM-DD

  japaTime: JapaTime;

  /* SOUL */
  personalHearingMin: number;
  spBookReadingMin: number;
  slokaLearntCount: number;
  chantingTime?: string; // optional ISO time or HH:MM
  sadhanaFirstFillTime?: string; // optional ISO timestamp of first fill

  /* BODY */
  bookReadingClass: YesNo;
  dayRestBelow30: YesNo;
  sleptBeforeTime: YesNo;
  wakeUpBeforeTime: YesNo;
  // Kept optional for compatibility with older entries; it no longer carries marks.
  studyOrPreachingMin?: number;
}

export interface Devotee {
  id: string;
  firstName: string;
  lastName?: string;
  features?: {
    sadhana?: boolean;
  };
}
