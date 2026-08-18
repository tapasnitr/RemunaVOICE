export const formatIndianDate = (isoDate: string) => {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function indianDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function getIndianCurrentDayName() {
  const dateString = indianDateKey();
  const current = new Date(`${dateString}T00:00:00Z`);
  const currentIndex = current.getUTCDay() === 0 ? 7 : current.getUTCDay();
  return WEEK_DAYS[currentIndex - 1];
}

export function getIndianWeekDates(offsetWeeks = 0) {
  const currentDateString = indianDateKey();
  const current = new Date(`${currentDateString}T00:00:00Z`);
  const currentIndex = current.getUTCDay() === 0 ? 7 : current.getUTCDay();

  const monday = new Date(current);
  monday.setUTCDate(
    current.getUTCDate() - (currentIndex - 1) + Math.round(offsetWeeks) * 7
  );

  return WEEK_DAYS.map((label, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    const dateString = day.toISOString().split("T")[0];
    return {
      label,
      dateString,
      formattedDate: new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(day),
    };
  });
}

export function getIndianNextWeekDates() {
  return getIndianWeekDates(1);
}
