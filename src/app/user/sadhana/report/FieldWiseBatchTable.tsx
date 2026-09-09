"use client";

import { CustomSadhanaCard, CustomSadhanaField, CustomSadhanaResponse } from "../custom/types";
import { scoreWeeklyResponses } from "../custom/scoring";

type Score = { score: number; totalMarks: number };
type Student = { id: string; name: string; batchId?: string; batchName: string };
type ReportRow = { student: Student; cards: CustomSadhanaCard[]; responses: CustomSadhanaResponse[]; soul: Score; body: Score; total: Score };

function percentage(score: Score) {
  return score.totalMarks ? Math.round((score.score / score.totalMarks) * 100) : 0;
}

function percentageTone(value: number) {
  if (value >= 90) return "bg-emerald-600 text-white";
  if (value >= 60) return "bg-lime-200 text-lime-900";
  if (value >= 30) return "bg-amber-200 text-amber-900";
  return "bg-red-600 text-white";
}

function uniqueFields(rows: ReportRow[], category: "soul" | "body") {
  const fields = new Map<string, CustomSadhanaField>();
  rows.forEach((row) => row.cards.forEach((card) => card.fields.forEach((field) => {
    if ((field.category || "soul") === category && !fields.has(`${card.id}_${field.id}`)) fields.set(`${card.id}_${field.id}`, field);
  })));
  return Array.from(fields.entries()).map(([key, field]) => ({ key, field }));
}

function fieldScore(row: ReportRow, key: string, field: CustomSadhanaField): Score {
  const cardId = key.split("_")[0];
  return scoreWeeklyResponses([field], row.responses.filter((response) => response.cardId === cardId), 7);
}

export default function FieldWiseBatchTable({ name, rows, onView, onScheme }: { name: string; rows: ReportRow[]; onView: (student: Student) => void; onScheme: (card: CustomSadhanaCard) => void }) {
  const soulFields = uniqueFields(rows, "soul");
  const bodyFields = uniqueFields(rows, "body");
  const cardForKey = (key: string) => rows.flatMap((row) => row.cards).find((card) => key.startsWith(`${card.id}_`));

  return <section className="overflow-x-auto rounded-2xl bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-yellow-200 bg-yellow-50 px-4 py-3"><div><h2 className="font-bold text-yellow-900">{name}</h2><p className="text-xs text-gray-600">{rows.length} devotee{rows.length === 1 ? "" : "s"}</p></div><div className="text-xs text-slate-600">Click a field/card name for its marking scheme</div></div><table className="w-full min-w-[1250px] text-left text-xs"><thead className="bg-yellow-100"><tr><th rowSpan={2} className="sticky left-0 z-10 min-w-36 bg-yellow-100 p-2">Name</th><th colSpan={soulFields.length + 2} className="border-l border-yellow-200 bg-yellow-200 p-2 text-center text-yellow-900">🟡 Soul</th><th colSpan={bodyFields.length + 2} className="border-l border-green-200 bg-green-200 p-2 text-center text-green-900">🟢 Body</th><th colSpan={2} className="border-l border-blue-200 bg-blue-200 p-2 text-center text-blue-900">Overall</th><th rowSpan={2} className="p-2">View</th></tr><tr>{soulFields.map(({ key, field }) => <th key={key} className="border-l border-yellow-100 p-2 text-center"><button type="button" onClick={() => { const card = cardForKey(key); if (card) onScheme(card); }} className="max-w-24 truncate font-semibold text-yellow-900 underline">{field.question}</button><span className="block text-[10px] text-slate-500">weekly marks</span></th>)}<th className="border-l p-2 text-center text-yellow-900">Soul total</th><th className="p-2 text-center text-yellow-900">%</th>{bodyFields.map(({ key, field }) => <th key={key} className="border-l border-green-100 p-2 text-center"><button type="button" onClick={() => { const card = cardForKey(key); if (card) onScheme(card); }} className="max-w-24 truncate font-semibold text-green-900 underline">{field.question}</button><span className="block text-[10px] text-slate-500">weekly marks</span></th>)}<th className="border-l p-2 text-center text-green-900">Body total</th><th className="p-2 text-center text-green-900">%</th><th className="border-l p-2 text-center text-blue-900">Total</th><th className="p-2 text-center text-blue-900">%</th></tr></thead><tbody>{rows.map((row) => { const soulPercent = percentage(row.soul); const bodyPercent = percentage(row.body); const totalPercent = percentage(row.total); return <tr key={row.student.id} className="border-t hover:bg-yellow-50"><td className="sticky left-0 z-10 bg-white p-2 font-semibold">{row.student.name}</td>{soulFields.map(({ key, field }) => { const score = fieldScore(row, key, field); return <td key={key} className="border-l p-2 text-center">{score.score}/{score.totalMarks}</td>; })}<td className="border-l p-2 text-center font-bold">{row.soul.score}/{row.soul.totalMarks}</td><td className="p-2 text-center"><span className={`rounded px-1.5 py-1 font-bold ${percentageTone(soulPercent)}`}>{soulPercent}%</span></td>{bodyFields.map(({ key, field }) => { const score = fieldScore(row, key, field); return <td key={key} className="border-l p-2 text-center">{score.score}/{score.totalMarks}</td>; })}<td className="border-l p-2 text-center font-bold">{row.body.score}/{row.body.totalMarks}</td><td className="p-2 text-center"><span className={`rounded px-1.5 py-1 font-bold ${percentageTone(bodyPercent)}`}>{bodyPercent}%</span></td><td className="border-l p-2 text-center font-bold">{row.total.score}/{row.total.totalMarks}</td><td className="p-2 text-center"><span className={`rounded px-1.5 py-1 font-bold ${percentageTone(totalPercent)}`}>{totalPercent}%</span></td><td className="p-2"><button type="button" onClick={() => onView(row.student)} className="rounded bg-blue-600 px-2 py-1 font-semibold text-white">View</button></td></tr>; })}</tbody></table></section>;
}
