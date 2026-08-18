export type YesNo = 0 | 1;
export type JapaTime = 0 | 1 | 2;

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
  studyOrPreachingMin: number; // ✅ CHANGED
}

export interface Devotee {
  id: string;
  firstName: string;
  lastName?: string;
  features?: {
    sadhana?: boolean;
  };
}
