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
