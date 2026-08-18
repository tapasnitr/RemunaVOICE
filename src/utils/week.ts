export function getLastWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday

  const end = new Date(now);
  end.setDate(now.getDate() - day);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

export function ymd(d: Date) {
  return d.toISOString().split("T")[0];
}
