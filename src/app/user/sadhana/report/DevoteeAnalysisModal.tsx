"use client";

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { CustomSadhanaCard, CustomSadhanaResponse } from "../custom/types";
import { scoreWeeklyResponses } from "../custom/scoring";

type Student = { id: string; name: string; batchId?: string; batchName: string };
type Score = { score: number; totalMarks: number };

function addScores(...scores: Score[]): Score {
  return scores.reduce((total, score) => ({ score: total.score + score.score, totalMarks: total.totalMarks + score.totalMarks }), { score: 0, totalMarks: 0 });
}

function percent(score: Score) {
  return score.totalMarks ? Math.round((score.score / score.totalMarks) * 100) : 0;
}

export default function DevoteeAnalysisModal({ student, cards, currentResponses, previousResponses, allResponses, currentDays, previousDays, remarkText, setRemarkText, savingRemark, saveRemark, readOnlyRemark = false, onClose }: { student: Student; cards: CustomSadhanaCard[]; currentResponses: CustomSadhanaResponse[]; previousResponses: CustomSadhanaResponse[]; allResponses: CustomSadhanaResponse[]; currentDays: string[]; previousDays: string[]; remarkText: string; setRemarkText: (value: string) => void; savingRemark: boolean; saveRemark: () => void; readOnlyRemark?: boolean; onClose: () => void }) {
  const currentScore = cards.reduce((total, card) => addScores(total, scoreWeeklyResponses(card.fields, currentResponses.filter((response) => response.cardId === card.id), 7)), { score: 0, totalMarks: 0 });
  const previousScore = cards.reduce((total, card) => addScores(total, scoreWeeklyResponses(card.fields, previousResponses.filter((response) => response.cardId === card.id), 7)), { score: 0, totalMarks: 0 });
  const chartData = weeklyTrend(cards, allResponses, currentDays[0], 8);
  const currentSubmitted = new Set(currentResponses.map((response) => response.date)).size;
  const previousSubmitted = new Set(previousResponses.map((response) => response.date)).size;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Full weekly analysis</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{student.name}</h2><p className="text-sm text-slate-500">Current week {currentDays[0]} to {currentDays[6]} · compared with {previousDays[0]} to {previousDays[6]}</p></div><button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm">Close</button></div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="This week" value={`${currentScore.score}/${currentScore.totalMarks}`} detail={`${percent(currentScore)}%`} tone="indigo" /><Metric label="Previous week" value={`${previousScore.score}/${previousScore.totalMarks}`} detail={`${percent(previousScore)}%`} tone="slate" /><Metric label="Submitted now" value={`${currentSubmitted}/7`} detail="days" tone="emerald" /><Metric label="Change" value={`${currentScore.score - previousScore.score >= 0 ? "+" : ""}${currentScore.score - previousScore.score}`} detail="marks" tone="amber" /></div>
    <section className="mt-5 rounded-xl border border-slate-200 p-4"><div className="mb-3"><h3 className="font-bold text-slate-900">Weekly Sadhana progression</h3><p className="text-xs text-slate-500">Each point is one complete Sunday–Saturday week. The blue point is this week.</p></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="marks" name="Weekly marks" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} /></LineChart></ResponsiveContainer></div></section>
    <section className="mt-5 grid gap-4 lg:grid-cols-2"><CategoryAnalysis title="Soul analysis" category="soul" cards={cards} currentResponses={currentResponses} previousResponses={previousResponses} /><CategoryAnalysis title="Body analysis" category="body" cards={cards} currentResponses={currentResponses} previousResponses={previousResponses} /></section>
    <section className="mt-5 rounded-xl border border-slate-200 p-4"><h3 className="font-bold text-slate-900">Daily filled details</h3><div className="mt-3 grid gap-3 md:grid-cols-2">{currentDays.map((date) => { const responses = currentResponses.filter((response) => response.date === date); return <div key={date} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between font-semibold"><span>{date}</span><span>{responses.length ? `${dailyScore(cards, responses, date)} marks` : "Not filled"}</span></div>{responses.map((response) => <div key={response.cardId} className="mt-2 text-xs text-slate-600"><strong>{cards.find((card) => card.id === response.cardId)?.title}</strong>{cards.find((card) => card.id === response.cardId)?.fields.map((field) => <div key={field.id}>{field.question}: <span className="font-semibold">{displayValue(cards.find((card) => card.id === response.cardId), field.id, response)}</span></div>)}</div>)}</div>; })}</div></section>
    <section className="mt-5 rounded-xl bg-blue-50 p-4"><h3 className="font-bold text-blue-900">Weekly reflection</h3>{readOnlyRemark ? <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-700">{remarkText || "No reflection added for this week."}</p> : <><textarea value={remarkText} onChange={(event) => setRemarkText(event.target.value)} placeholder="Write a weekly observation or encouragement..." className="mt-2 min-h-24 w-full rounded-lg border p-3" /><button type="button" disabled={savingRemark} onClick={saveRemark} className="mt-2 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{savingRemark ? "Saving..." : "Save weekly remark"}</button></>}</section>
  </div></div>;
}

function dailyScore(cards: CustomSadhanaCard[], responses: CustomSadhanaResponse[], date: string) {
  return responses.filter((response) => response.date === date).reduce((total, response) => total + (response.score || 0), 0);
}

function weeklyTrend(cards: CustomSadhanaCard[], responses: CustomSadhanaResponse[], currentWeekStart: string, count: number) {
  const currentStart = new Date(`${currentWeekStart}T00:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(currentStart);
    start.setDate(currentStart.getDate() - (count - 1 - index) * 7);
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const day = new Date(start);
      day.setDate(start.getDate() + dayIndex);
      return day.toISOString().slice(0, 10);
    });
    const weekResponses = responses.filter((response) => days.includes(response.date));
    const score = cards.reduce((total, card) => addScores(total, scoreWeeklyResponses(card.fields, weekResponses.filter((response) => response.cardId === card.id), 7)), { score: 0, totalMarks: 0 });
    return { week: `${start.getMonth() + 1}/${start.getDate()}`, marks: score.score, maximum: score.totalMarks, percentage: percent(score) };
  });
}

function displayValue(card: CustomSadhanaCard | undefined, fieldId: string, response: CustomSadhanaResponse) {
  const field = card?.fields.find((item) => item.id === fieldId);
  const value = response.values[fieldId];
  if (!field || value === undefined || value === "") return "Not answered";
  if (field.type === "option") return field.options?.find((option) => option.id === String(value))?.label || String(value);
  return String(value);
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "indigo" | "slate" | "emerald" | "amber" }) {
  const styles = { indigo: "bg-indigo-50 text-indigo-900", slate: "bg-slate-100 text-slate-800", emerald: "bg-emerald-50 text-emerald-900", amber: "bg-amber-50 text-amber-900" };
  return <div className={`rounded-xl p-3 ${styles[tone]}`}><div className="text-xs opacity-70">{label}</div><div className="mt-1 text-xl font-bold">{value}</div><div className="text-xs opacity-70">{detail}</div></div>;
}

function CategoryAnalysis({ title, category, cards, currentResponses, previousResponses }: { title: string; category: "soul" | "body"; cards: CustomSadhanaCard[]; currentResponses: CustomSadhanaResponse[]; previousResponses: CustomSadhanaResponse[] }) {
  const current = cards.reduce((total, card) => addScores(total, scoreWeeklyResponses(card.fields.filter((field) => (field.category || "soul") === category), currentResponses.filter((response) => response.cardId === card.id), 7)), { score: 0, totalMarks: 0 });
  const previous = cards.reduce((total, card) => addScores(total, scoreWeeklyResponses(card.fields.filter((field) => (field.category || "soul") === category), previousResponses.filter((response) => response.cardId === card.id), 7)), { score: 0, totalMarks: 0 });
  return <div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">{title}</h3><span className="text-sm font-bold text-indigo-700">{current.score}/{current.totalMarks} · {percent(current)}%</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${percent(current)}%` }} /></div><p className="mt-2 text-xs text-slate-500">Previous: {previous.score}/{previous.totalMarks} · {percent(previous)}%</p>{cards.flatMap((card) => card.fields.filter((field) => (field.category || "soul") === category).map((field) => { const score = scoreWeeklyResponses([field], currentResponses.filter((response) => response.cardId === card.id), 7); return <div key={`${card.id}_${field.id}`} className="mt-2 flex justify-between border-b border-dashed py-1 text-xs"><span>{field.question}</span><strong>{score.score}/{score.totalMarks}</strong></div>; }))}</div>;
}
