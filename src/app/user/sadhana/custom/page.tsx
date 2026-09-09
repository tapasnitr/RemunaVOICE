"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackPageName from "@/components/BackHeaderButton";
import { CustomSadhanaCard, CustomSadhanaResponse } from "./types";
import { scoreResponse, scoreWeeklyResponses } from "./scoring";
import StudentFieldGroup from "./StudentFieldGroup";

const today = () => new Date().toISOString().slice(0, 10);
const startOfWeek = (date: string) => {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() - value.getDay());
  return value.toISOString().slice(0, 10);
};
const endOfWeek = (date: string) => {
  const value = new Date(`${startOfWeek(date)}T00:00:00`);
  value.setDate(value.getDate() + 6);
  return value.toISOString().slice(0, 10);
};

export default function CustomSadhanaPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<CustomSadhanaCard[]>([]);
  const [responses, setResponses] = useState<Record<string, CustomSadhanaResponse>>({});
  const [allResponses, setAllResponses] = useState<CustomSadhanaResponse[]>([]);
  const [weekScore, setWeekScore] = useState<Record<string, number>>({});
  const [date, setDate] = useState(today());
  const [message, setMessage] = useState("");
  const [remark, setRemark] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [loading, setLoading] = useState(true);
  const batchId = (userData as { batchId?: string } | null)?.batchId;

  useEffect(() => {
    if (!user || !batchId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [cardSnap, responseSnap, remarkSnap] = await Promise.all([getDocs(collection(db, "custom_sadhana_cards")), getDocs(collection(db, "custom_sadhana_responses")), getDocs(collection(db, "custom_sadhana_remarks"))]);
        const assigned = cardSnap.docs.map((item) => ({ id: item.id, ...item.data() } as CustomSadhanaCard)).filter((card) => card.active !== false && (!card.batchIds?.length || card.batchIds.includes(batchId)));
        const userResponses = responseSnap.docs.map((item) => item.data() as CustomSadhanaResponse).filter((response) => response.userId === user.uid);
        setCards(assigned);
        setAllResponses(userResponses);
        setResponses(Object.fromEntries(userResponses.filter((response) => response.date === date).map((response) => [response.cardId, response])));
        const savedRemark = remarkSnap.docs.map((item) => item.data() as { studentId?: string; weekStart?: string; text?: string }).find((item) => item.studentId === user.uid && item.weekStart === startOfWeek(date));
        setRemark(savedRemark?.text || "");
        setWeekScore(Object.fromEntries(assigned.map((card) => {
          const cardResponses = userResponses.filter((response) => response.cardId === card.id && response.date >= startOfWeek(date) && response.date <= endOfWeek(date));
          return [card.id, scoreWeeklyResponses(card.fields, cardResponses).score];
        })));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user, batchId, date]);

  const save = async (card: CustomSadhanaCard, values: Record<string, string | number>) => {
    if (!user) return;
    const missingRequired = card.fields.some((field) => field.required && (values[field.id] === undefined || values[field.id] === ""));
    const invalidInteger = card.fields.some((field) => field.type === "number" && values[field.id] !== undefined && values[field.id] !== "" && !Number.isInteger(Number(values[field.id])));
    if (missingRequired || invalidInteger) {
      setMessage(missingRequired ? "Please complete all required questions before saving." : "Number answers must be whole numbers.");
      return;
    }
    const result = scoreResponse(card.fields, values);
    const response: CustomSadhanaResponse = { cardId: card.id, userId: user.uid, date, values, ...result };
    try {
      await setDoc(doc(db, "custom_sadhana_responses", `${card.id}_${user.uid}_${date}`), { ...response, updatedAt: serverTimestamp() });
      setResponses((current) => ({ ...current, [card.id]: response }));
      setAllResponses((current) => [...current.filter((item) => !(item.cardId === card.id && item.date === date)), response]);
      setWeekScore((current) => ({ ...current, [card.id]: (current[card.id] || 0) - (responses[card.id]?.score || 0) + result.score }));
      setMessage("Sadhana saved successfully.");
    } catch (error) {
      console.error("Could not save custom sadhana response", error);
      setMessage("Sadhana could not be saved. Please check your connection or Firebase permissions.");
    }
  };

  const saveRemark = async () => {
    if (!user || !batchId) return;
    setSavingRemark(true);
    try {
      await setDoc(doc(db, "custom_sadhana_remarks", `${batchId}_${user.uid}_${startOfWeek(date)}`), {
        studentId: user.uid,
        batchId,
        weekStart: startOfWeek(date),
        text: remark.trim(),
        updatedAt: serverTimestamp(),
      });
      setMessage("Your weekly reflection was saved.");
    } catch (error) {
      console.error("Could not save weekly reflection", error);
      setMessage("Your reflection could not be saved.");
    } finally {
      setSavingRemark(false);
    }
  };

  if (!batchId) return <div className="p-8 text-center">Your account is not assigned to a batch yet.</div>;

  const weekResponses = allResponses.filter((response) => response.date >= startOfWeek(date) && response.date <= endOfWeek(date));
  const weeklyTotal = cards.reduce((sum, card) => sum + scoreWeeklyResponses(card.fields, weekResponses.filter((response) => response.cardId === card.id)).score, 0);
  const weeklyMaximum = cards.reduce((sum, card) => sum + scoreWeeklyResponses(card.fields, weekResponses.filter((response) => response.cardId === card.id)).totalMarks, 0);

  return <div className="min-h-screen bg-[#f6f2e8]"><BackPageName title="Custom Sadhana" link="/user/sadhana" /><div className="mx-auto max-w-3xl space-y-5 px-4 pb-12 pt-3">
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#173f46] p-5 text-white shadow-xl sm:p-8"><div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#d9a441]/25" /><div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[#4e9b83]/20" /><div className="relative flex items-start justify-between gap-4"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#f3cb72]">A daily offering</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sadhana practice</h1><p className="mt-3 max-w-md text-sm leading-6 text-[#d8eee5]">Pause, remember, and record your devotional practice one sincere step at a time.</p></div><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#f3cb72]/40 bg-[#f3cb72]/15 text-3xl text-[#f3cb72] shadow-inner">ॐ</div></div><div className="relative mt-7 flex flex-wrap items-center gap-2"><button type="button" onClick={() => setDate((current) => { const value = new Date(`${current}T00:00:00`); value.setDate(value.getDate() - 1); return value.toISOString().slice(0, 10); })} className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-semibold transition hover:bg-white/20">‹ Previous</button><label className="flex min-w-[180px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#fffdf7] px-3 py-3 text-sm font-bold text-[#173f46] shadow-sm">Practice date<input type="date" max={today()} value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 bg-transparent font-bold outline-none" /></label><button type="button" disabled={date >= today()} onClick={() => setDate((current) => { const value = new Date(`${current}T00:00:00`); value.setDate(value.getDate() + 1); return value.toISOString().slice(0, 10); })} className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40">Next ›</button></div></section>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => router.push(`/user/sadhana/custom/analysis?date=${date}`)} className="rounded-xl border border-[#2d7165] bg-white px-4 py-2.5 text-sm font-bold text-[#216252]">View my analysis</button></div>
    {cards.length > 0 && <section className="grid grid-cols-2 gap-3 sm:grid-cols-3"><SummaryTile label="Sadhana card" value="1" tone="teal" /><SummaryTile label="Completed today" value={`${Object.keys(responses).length ? "Yes" : "No"}`} tone="amber" /><SummaryTile label="This week" value={`${weeklyTotal}/${weeklyMaximum || 0}`} tone="blue" /></section>}
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">Loading your cards...</div> : cards.map((card) => <CardForm key={`${card.id}_${date}`} card={card} response={responses[card.id]} weekScore={weekScore[card.id] || 0} onSave={save} />)}
    {!loading && cards.length === 0 && <p className="text-center text-gray-600">No custom sadhana cards are assigned to your batch.</p>}
    {message && <p className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${message.includes("successfully") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
    <WeeklyCustomReport cards={cards} responses={weekResponses} total={weeklyTotal} maximum={weeklyMaximum} date={date} />
    <ReflectionPanel value={remark} setValue={setRemark} saving={savingRemark} onSave={() => void saveRemark()} />
  </div></div>;
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: "teal" | "amber" | "blue" }) {
  const styles = { teal: "border-[#9ed4c2] bg-[#e5f4ed] text-[#155b4c]", amber: "border-[#edcf8b] bg-[#fff5d9] text-[#795314]", blue: "border-[#b8c9e9] bg-[#edf2fb] text-[#294b7a]" };
  return <div className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}><div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div><div className="mt-1 text-xl font-bold">{value}</div></div>;
}

function WeeklyCustomReport({ cards, responses, total, maximum, date }: { cards: CustomSadhanaCard[]; responses: CustomSadhanaResponse[]; total: number; maximum: number; date: string }) {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Reflection</p><h2 className="mt-1 text-xl font-bold text-slate-900">Weekly progress</h2><p className="mt-1 text-sm text-slate-500">Sunday {weekStart} to Saturday {weekEnd}</p></div><div className="text-right"><div className="text-2xl font-bold text-teal-800">{total}</div><div className="text-xs text-slate-500">of {maximum || 0} marks</div></div></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-amber-400" style={{ width: `${maximum ? Math.min(100, Math.max(0, (total / maximum) * 100)) : 0}%` }} /></div>{cards.map((card) => { const cardResponses = responses.filter((response) => response.cardId === card.id); const weekly = scoreWeeklyResponses(card.fields, cardResponses); return <div key={card.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex justify-between gap-3 text-sm"><strong className="text-slate-800">{card.title}</strong><strong className="text-teal-800">{weekly.score} / {weekly.totalMarks}</strong></div><div className="mt-1 text-xs text-slate-500">{cardResponses.length} day{cardResponses.length === 1 ? "" : "s"} submitted</div>{card.fields.filter((field) => field.type === "number").map((field) => { const weeklyNumber = cardResponses.reduce((sum, response) => sum + Number(response.values[field.id] || 0), 0); const marks = field.ranges?.find((range) => weeklyNumber >= range.min && weeklyNumber <= range.max)?.marks || 0; return <div key={field.id} className="mt-2 text-xs text-slate-600">{field.question}: <strong>{weeklyNumber}</strong> weekly total → <strong>{marks} marks</strong></div>; })}</div>; })}<div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-800">How scoring works:</strong> choices earn their configured marks each day from Sunday through Saturday. Number entries are added across the same Sunday–Saturday week, then the weekly total is matched to the admin&apos;s range.</div></section>;
}

function CardForm({ card, response, weekScore, onSave }: { card: CustomSadhanaCard; response?: CustomSadhanaResponse; weekScore: number; onSave: (card: CustomSadhanaCard, values: Record<string, string | number>) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string | number>>(response?.values || {});
  const update = (fieldId: string, value: string | number) => setValues((current) => ({ ...current, [fieldId]: value }));
  const soulFields = card.fields.filter((field) => (field.category || "soul") === "soul");
  const bodyFields = card.fields.filter((field) => field.category === "body");
  return <section className="overflow-hidden rounded-[1.5rem] border border-[#d8d4c8] bg-[#fffdf8] shadow-[0_12px_35px_rgba(35,61,57,0.08)]"><div className="border-b border-[#e7e2d7] bg-[#f8f4e9] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#dcefe7] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#226354]"><span className="h-1.5 w-1.5 rounded-full bg-[#d19b32]" />Today&apos;s offering</div><h2 className="text-xl font-bold text-[#243f40] sm:text-2xl">{card.title}</h2><p className="mt-2 text-sm leading-6 text-[#66736e]">{card.description || "Complete your devotional practice with attention."}</p></div><div className="rounded-2xl border border-[#c5e0d4] bg-[#e9f5ef] px-3 py-2 text-right shadow-sm"><div className="text-[11px] font-bold uppercase tracking-wide text-[#568276]">This week</div><strong className="text-xl text-[#216252]">{weekScore}</strong><div className="text-[11px] text-[#568276]">marks</div></div></div></div><div className="space-y-6 p-5 sm:p-6"><StudentFieldGroup title="Soul" fields={soulFields} values={values} update={update} tone="yellow" /><StudentFieldGroup title="Body" fields={bodyFields} values={values} update={update} tone="green" /><div className="flex flex-col gap-3 border-t border-[#e7e2d7] pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-[#78827d]">{response ? `Saved: ${response.score} daily marks` : "Your response is not saved yet"}</span><button onClick={() => onSave(card, values)} className="rounded-xl bg-[#216252] px-6 py-3.5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(33,98,82,0.22)] transition hover:bg-[#174b40] active:scale-[0.98]">{response ? "Update my practice" : "Save my practice"}</button></div></div></section>;
}

function ReflectionPanel({ value, setValue, saving, onSave }: { value: string; setValue: (value: string) => void; saving: boolean; onSave: () => void }) {
  return <section className="rounded-2xl border border-[#c5e0d4] bg-[#e9f5ef] p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Personal note</p><h2 className="mt-1 text-xl font-bold text-[#234746]">Weekly reflection or remarks</h2><p className="mt-1 text-sm text-[#5f756e]">Write anything you want to remember about this Sunday–Saturday week. It will appear in your personal analysis.</p></div><span className="text-xs font-semibold text-teal-700">Private to your analysis</span></div><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="What did you practice, learn, or want to improve this week?" className="mt-4 min-h-28 w-full rounded-xl border border-[#b9d9ca] bg-white p-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-[#bce2cf]" /><div className="mt-3 flex justify-end"><button type="button" disabled={saving} onClick={onSave} className="rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50">{saving ? "Saving..." : "Save weekly reflection"}</button></div></section>;
}
