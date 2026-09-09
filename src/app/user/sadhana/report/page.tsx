          "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackPageName from "@/components/BackHeaderButton";
import { CustomSadhanaCard, CustomSadhanaResponse } from "../custom/types";
import { scoreWeeklyResponses } from "../custom/scoring";
import FieldWiseBatchTable from "./FieldWiseBatchTable";
import DevoteeAnalysisModal from "./DevoteeAnalysisModal";

type Student = { id: string; name: string; batchId?: string; batchName: string };
type Batch = { id: string; name: string };
type Score = { score: number; totalMarks: number };
type Remark = { studentId: string; batchId: string; weekStart: string; text: string };
type ReportRow = { student: Student; cards: CustomSadhanaCard[]; responses: CustomSadhanaResponse[]; soul: Score; body: Score; total: Score };

function weekDays(value: Date) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

function addScores(...scores: Score[]): Score {
  return scores.reduce((total, score) => ({ score: total.score + score.score, totalMarks: total.totalMarks + score.totalMarks }), { score: 0, totalMarks: 0 });
}

function percentage(score: Score) {
  return score.totalMarks ? Math.round((score.score / score.totalMarks) * 100) : 0;
}

function percentageTone(value: number) {
  if (value >= 90) return "bg-emerald-600 text-white";
  if (value >= 60) return "bg-lime-200 text-lime-900";
  if (value >= 30) return "bg-amber-200 text-amber-900";
  return "bg-red-600 text-white";
}

export default function SadhanaReportPage() {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [cards, setCards] = useState<CustomSadhanaCard[]>([]);
  const [responses, setResponses] = useState<CustomSadhanaResponse[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [weekDate, setWeekDate] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCard, setSelectedCard] = useState<CustomSadhanaCard | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [studentSnap, batchSnap, cardSnap, responseSnap, remarkSnap] = await Promise.all([
        getDocs(collection(db, "devotees")),
        getDocs(collection(db, "batches")),
        getDocs(collection(db, "custom_sadhana_cards")),
        getDocs(collection(db, "custom_sadhana_responses")),
        getDocs(collection(db, "custom_sadhana_remarks")),
      ]);
      const loadedBatches = batchSnap.docs.map((item) => ({ id: item.id, name: item.data().name || item.id }));
      setBatches(loadedBatches);
      setStudents(studentSnap.docs.map((item) => ({
        id: item.id,
        name: `${item.data().firstName || "Devotee"} ${item.data().lastName || ""}`.trim(),
        batchId: item.data().batchId,
        batchName: item.data().batchName || loadedBatches.find((batch) => batch.id === item.data().batchId)?.name || "No batch",
      })));
      setCards(cardSnap.docs.map((item) => ({ id: item.id, ...item.data() } as CustomSadhanaCard)));
      setResponses(responseSnap.docs.map((item) => item.data() as CustomSadhanaResponse));
      setRemarks(remarkSnap.docs.map((item) => item.data() as Remark));
      setLoading(false);
    };
    void load();
  }, [user]);

  const days = weekDays(weekDate);
  const weekStart = days[0];
  const weekResponses = responses.filter((response) => days.includes(response.date));
  const previousDays = weekDays(new Date(weekDate.getTime() - 7 * 86400000));
  const previousResponses = responses.filter((response) => previousDays.includes(response.date));

  const rows = useMemo<ReportRow[]>(() => students.map((student) => {
    const studentCards = cards.filter((card) => !card.batchIds?.length || card.batchIds.includes(student.batchId || ""));
    const studentResponses = weekResponses.filter((response) => response.userId === student.id);
    const soul = studentCards.reduce((total, card) => addScores(total, scoreWeeklyResponses(card.fields.filter((field) => (field.category || "soul") === "soul"), studentResponses.filter((response) => response.cardId === card.id), 7)), { score: 0, totalMarks: 0 });
    const body = studentCards.reduce((total, card) => addScores(total, scoreWeeklyResponses(card.fields.filter((field) => field.category === "body"), studentResponses.filter((response) => response.cardId === card.id), 7)), { score: 0, totalMarks: 0 });
    return { student, cards: studentCards, responses: studentResponses, soul, body, total: addScores(soul, body) };
  }), [students, cards, weekResponses]);

  const groups = useMemo(() => batches.map((batch) => ({ batch, rows: rows.filter((row) => row.student.batchId === batch.id) })).concat({ batch: { id: "none", name: "No batch assigned" }, rows: rows.filter((row) => !row.student.batchId) }).filter((group) => group.rows.length), [batches, rows]);

  const openStudent = (student: Student) => {
    setSelectedStudent(student);
    setRemarkText(remarks.find((remark) => remark.studentId === student.id && remark.batchId === student.batchId && remark.weekStart === weekStart)?.text || "");
  };

  const saveRemark = async () => {
    if (!selectedStudent?.batchId) return;
    setSavingRemark(true);
    const remark: Remark = { studentId: selectedStudent.id, batchId: selectedStudent.batchId, weekStart, text: remarkText.trim() };
    await setDoc(doc(db, "custom_sadhana_remarks", `${remark.batchId}_${remark.studentId}_${remark.weekStart}`), { ...remark, updatedAt: serverTimestamp() });
    setRemarks((current) => [...current.filter((item) => !(item.studentId === remark.studentId && item.weekStart === remark.weekStart)), remark]);
    setSavingRemark(false);
  };

  if (authLoading || loading) return <div className="pt-32 text-center text-gray-600">Loading Sadhana report...</div>;

  return <div className="min-h-screen bg-yellow-50"><BackPageName title="Weekly Sadhana Report" link="/user/sadhana" /><main className="mx-auto max-w-7xl space-y-5 p-4">
    <header className="rounded-2xl bg-gradient-to-r from-yellow-700 to-amber-500 p-5 text-white shadow-lg"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-yellow-100">All batches · {students.length} devotees</p><h1 className="text-2xl font-bold">Field-wise weekly progress</h1><p className="text-sm text-yellow-50">Sunday {days[0]} to Saturday {days[6]}</p></div><div className="flex gap-2"><button type="button" onClick={() => setWeekDate(new Date(weekDate.getTime() - 7 * 86400000))} className="rounded-lg bg-white/20 px-3 py-2 text-sm">Previous</button><button type="button" onClick={() => setWeekDate(new Date())} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-yellow-800">This week</button><button type="button" onClick={() => setWeekDate(new Date(weekDate.getTime() + 7 * 86400000))} className="rounded-lg bg-white/20 px-3 py-2 text-sm">Next</button></div></div><p className="mt-3 text-sm text-yellow-100">Option fields show daily marks × 7. Number fields show weekly range marks.</p></header>
    <section className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm"><strong className="mr-2 text-slate-700">Percentage coding:</strong><span className="rounded-full bg-emerald-600 px-2.5 py-1 text-white">90%+ Excellent</span><span className="rounded-full bg-lime-200 px-2.5 py-1 text-lime-900">60–89% Good</span><span className="rounded-full bg-amber-200 px-2.5 py-1 text-amber-900">30–59% Developing</span><span className="rounded-full bg-red-600 px-2.5 py-1 text-white">Below 30% Needs attention</span><span className="ml-2 text-slate-500">Click a card name to view its marking scheme.</span></section>
    <div className="space-y-5">{groups.map((group) => <FieldWiseBatchTable key={group.batch.id} name={group.batch.name} rows={group.rows} onView={openStudent} onScheme={setSelectedCard} />)}{!groups.length && <div className="rounded-xl bg-white p-8 text-center text-gray-600">No devotees found.</div>}</div>
    {selectedStudent && <DevoteeAnalysisModal student={selectedStudent} cards={rows.find((row) => row.student.id === selectedStudent.id)?.cards || []} currentResponses={weekResponses.filter((response) => response.userId === selectedStudent.id)} previousResponses={previousResponses.filter((response) => response.userId === selectedStudent.id)} allResponses={responses.filter((response) => response.userId === selectedStudent.id)} currentDays={days} previousDays={previousDays} remarkText={remarkText} setRemarkText={setRemarkText} savingRemark={savingRemark} saveRemark={() => void saveRemark()} onClose={() => setSelectedStudent(null)} />}
    {selectedCard && <MarkingScheme card={selectedCard} onClose={() => setSelectedCard(null)} />}
  </main></div>;
}

function BatchTable({ name, rows, onView, onScheme }: { name: string; rows: ReportRow[]; onView: (student: Student) => void; onScheme: (card: CustomSadhanaCard) => void }) {
  return <section className="overflow-x-auto rounded-2xl bg-white shadow-sm"><div className="border-b border-yellow-200 bg-yellow-50 px-4 py-3"><h2 className="font-bold text-yellow-900">{name}</h2><p className="text-xs text-gray-600">{rows.length} devotee{rows.length === 1 ? "" : "s"}</p></div><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-yellow-100"><tr><th className="p-3">Devotee</th><th className="border-l border-yellow-200 p-3 text-yellow-900">Soul fields / total</th><th className="p-3 text-yellow-900">Soul %</th><th className="border-l border-green-200 p-3 text-green-900">Body fields / total</th><th className="p-3 text-green-900">Body %</th><th className="border-l border-blue-200 p-3 text-blue-900">Overall</th><th className="p-3 text-blue-900">%</th><th className="p-3">View</th></tr></thead><tbody>{rows.map((row) => { const soulPercent = percentage(row.soul); const bodyPercent = percentage(row.body); const totalPercent = percentage(row.total); return <tr key={row.student.id} className="border-t align-top hover:bg-yellow-50"><td className="p-3 font-semibold">{row.student.name}</td><td className="border-l p-3"><FieldBreakdown category="soul" cards={row.cards} responses={row.responses} total={row.soul} onScheme={onScheme} /></td><td className="p-3"><span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${percentageTone(soulPercent)}`}>{soulPercent}%</span></td><td className="border-l p-3"><FieldBreakdown category="body" cards={row.cards} responses={row.responses} total={row.body} onScheme={onScheme} /></td><td className="p-3"><span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${percentageTone(bodyPercent)}`}>{bodyPercent}%</span></td><td className="border-l p-3 font-bold">{row.total.score} / {row.total.totalMarks}</td><td className="p-3"><span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${percentageTone(totalPercent)}`}>{totalPercent}%</span></td><td className="p-3"><button type="button" onClick={() => onView(row.student)} className="rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-900">View details</button></td></tr>; })}</tbody></table></section>;
}

function FieldBreakdown({ category, cards, responses, total, onScheme }: { category: "soul" | "body"; cards: CustomSadhanaCard[]; responses: CustomSadhanaResponse[]; total: Score; onScheme: (card: CustomSadhanaCard) => void }) {
  return <div className="min-w-56 space-y-1"><div className="mb-2 flex items-center justify-between gap-2"><strong className="text-xs">Total: {total.score} / {total.totalMarks}</strong></div>{cards.flatMap((card) => { const categoryFields = card.fields.filter((field) => (field.category || "soul") === category); if (!categoryFields.length) return []; const cardResponses = responses.filter((response) => response.cardId === card.id); return [<button type="button" key={`${card.id}_scheme`} onClick={() => onScheme(card)} className="mt-1 block max-w-full truncate text-left text-[11px] font-bold text-indigo-700 underline">{card.title} · marking scheme</button>, ...categoryFields.map((field) => { const score = scoreWeeklyResponses([field], cardResponses, 7); return <div key={`${card.id}_${field.id}`} className="flex justify-between gap-2 border-b border-dashed border-gray-200 py-1 text-[11px] leading-4"><span className="max-w-56">{field.question}</span><strong className="whitespace-nowrap">{score.score}/{score.totalMarks}</strong></div>; })]; })}</div>;
}

function MarkingScheme({ card, onClose }: { card: CustomSadhanaCard; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Marking scheme</p><h2 className="text-xl font-bold text-slate-900">{card.title}</h2><p className="text-sm text-slate-500">Option marks are daily × 7. Number marks are awarded once from the weekly range.</p></div><button type="button" onClick={onClose} className="rounded-full border px-3 py-1">Close</button></div><div className="mt-4 space-y-3">{card.fields.map((field) => <div key={field.id} className="rounded-xl border p-3"><div className="font-semibold text-slate-800">{field.question}</div>{field.type === "option" ? field.options?.map((option) => <div key={option.id} className="flex justify-between border-b py-1 text-sm"><span>{option.label}</span><strong>{option.marks} daily × 7 = {option.marks * 7}</strong></div>) : field.ranges?.map((range) => <div key={range.id} className="flex justify-between border-b py-1 text-sm"><span>{range.min} to {range.max} weekly total</span><strong>{range.marks} marks</strong></div>)}</div>)}</div></div></div>;
}

function StudentReport({ student, cards, responses, days, remarkText, setRemarkText, savingRemark, saveRemark, onClose }: { student: Student; cards: CustomSadhanaCard[]; responses: CustomSadhanaResponse[]; days: string[]; remarkText: string; setRemarkText: (value: string) => void; savingRemark: boolean; saveRemark: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-yellow-900">{student.name}</h2><p className="text-sm text-gray-600">Daily detail · Sunday {days[0]} to Saturday {days[6]}</p></div><button type="button" onClick={onClose} className="rounded-full border px-3 py-1">Close</button></div><div className="mt-4 space-y-4">{days.map((date) => <div key={date} className="rounded-xl border p-3"><div className="font-semibold text-gray-800">{date}</div>{cards.map((card) => { const response = responses.find((item) => item.cardId === card.id && item.date === date); return <div key={card.id} className="mt-2 text-sm"><div className="font-medium text-yellow-900">{card.title}: {response ? `${response.score} daily marks` : "Not submitted"}</div>{response && <div className="ml-3 mt-1 space-y-1 text-gray-600">{card.fields.map((field) => <div key={field.id}>{field.question}: <strong>{field.type === "option" ? field.options?.find((option) => option.id === String(response.values[field.id]))?.label || "Not answered" : String(response.values[field.id] ?? "Not answered")}</strong></div>)}</div>}</div>; })}</div>)}</div><section className="mt-5 rounded-xl bg-blue-50 p-4"><h3 className="font-bold text-blue-900">Weekly remark</h3><textarea value={remarkText} onChange={(event) => setRemarkText(event.target.value)} placeholder="Write a weekly observation or encouragement..." className="mt-2 min-h-24 w-full rounded-lg border p-3" /><button type="button" disabled={savingRemark} onClick={saveRemark} className="mt-2 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{savingRemark ? "Saving..." : "Save weekly remark"}</button></section></div></div>;
}
