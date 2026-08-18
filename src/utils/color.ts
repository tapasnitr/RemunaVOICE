export const getColorByPercent = (pct: number) => {
  if (pct >= 90) return "bg-green-500 text-white";
  if (pct >= 60) return "bg-yellow-400 text-black";
  if (pct >= 40) return "bg-orange-400 text-black";
  return "bg-red-600 text-white";
};
