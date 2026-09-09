"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackPageName from "@/components/BackHeaderButton";
import { CustomSadhanaCard, CustomSadhanaResponse } from "../../../sadhana/custom/types";
import { scoreWeeklyResponses } from "../../../sadhana/custom/scoring";

interface Person {
  id: string;
  name: string;
  batchId?: string;
  batchName?: string;
}

interface Batch {
  id: string;
  name: string;
}

function weekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekDays(base: Date) {
  const start = weekStart(base);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return dateKey(date);
  });
}

export default function CustomSadhanaReportPage() {
  const { userData } = useAuth();
  const [cards, setCards] = useState<CustomSadhanaCard[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [responses, setResponses] = useState<CustomSadhanaResponse[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [weekDate, setWeekDate] = useState(new Date());
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  const allowed = userData?.features?.admin && userData.adminFeatures?.includes("customSadhana");

  useEffect(() => {
    if (!allowed) return;
    const load = async () => {
      const [cardSnap, peopleSnap, batchSnap, responseSnap] = await Promise.all([
        getDocs(collection(db, "custom_sadhana_cards")),
        getDocs(collection(db, "devotees")),
        getDocs(collection(db, "batches")),
        getDocs(collection(db, "custom_sadhana_responses")),
      ]);
      const loadedCards = cardSnap.docs.map((item) => ({ id: item.id, ...item.data() } as CustomSadhanaCard));
      setCards(loadedCards);
      setSelectedCardId(loadedCards[0]?.id || "");
      setPeople(peopleSnap.docs.map((item) => ({ id: item.id, name: `${item.data().firstName || "Devotee"} ${item.data().lastName || ""}`.trim(), batchId: item.data().batchId, batchName: item.data().batchName })));
      setBatches(batchSnap.docs.map((item) => ({ id: item.id, name: item.data().name || item.id })));
      setResponses(responseSnap.docs.map((item) => item.data() as CustomSadhanaResponse));
      setLoading(false);
    };
    void load();
  }, [allowed]);

  const days = weekDays(weekDate);
  const selectedCard = cards.find((card) => card.id === selectedCardId);
  const visiblePeople = people.filter((person) => selectedBatchId === "all" || person.batchId === selectedBatchId);
  const visibleResponses = responses.filter((response) => response.cardId === selectedCardId && days.includes(response.date));
  const activeBatchName = selectedBatchId === "all" ? "All batches" : batches.find((batch) => batch.id === selectedBatchId)?.name || "Selected batch";

  const cardAssignedToBatch = (card: CustomSadhanaCard, batchId: string) => !card.batchIds?.length || card.batchIds.includes(batchId);
  const availableCards = selectedBatchId === "all" ? cards : cards.filter((card) => cardAssignedToBatch(card, selectedBatchId));

  const totals = useMemo(() => visiblePeople.map((person) => {
    const personResponses = visibleResponses.filter((response) => response.userId === person.id);
    const weekly = selectedCard ? scoreWeeklyResponses(selectedCard.fields, personResponses) : { score: 0, totalMarks: 0 };
    return { person, score: weekly.score, maximum: weekly.totalMarks, days: personResponses.length };
  }), [visiblePeople, visibleResponses]);

  if (!allowed) return <div className="p-8 text-center text-red-600 font-semibold">You do not have custom Sadhana report access.</div>;

  return <div className="min-h-screen bg-yellow-50"><BackPageName title="Custom Sadhana Weekly Report" link="/user/admin" /><div className="max-w-6xl mx-auto p-4 space-y-5">
    <section className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm"><div className="flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Batch<select value={selectedBatchId} onChange={(event) => setSelectedBatchId(event.target.value)} className="block border rounded p-2 mt-1"><option value="all">All batches</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label><label className="text-sm font-semibold">Sadhana card<select value={selectedCardId} onChange={(event) => setSelectedCardId(event.target.value)} className="block border rounded p-2 mt-1">{availableCards.map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select></label><button type="button" onClick={() => setWeekDate(new Date(weekDate.getTime() - 7 * 86400000))} className="border rounded px-3 py-2">Previous week</button><button type="button" onClick={() => setWeekDate(new Date())} className="border rounded px-3 py-2">This week</button><button type="button" onClick={() => setWeekDate(new Date(weekDate.getTime() + 7 * 86400000))} className="border rounded px-3 py-2">Next week</button></div><p className="text-sm text-gray-600 mt-3">Showing <strong>{selectedCard?.title || "No card"}</strong> for <strong>{activeBatchName}</strong> from {days[0]} to {days[6]}.</p></section>
    {loading ? <p className="text-center">Loading report...</p> : <section className="bg-white border border-yellow-200 rounded-xl shadow-sm overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-yellow-100"><tr><th className="p-3">Devotee</th><th className="p-3">Batch</th><th className="p-3">Submitted days</th><th className="p-3">Weekly score</th><th className="p-3">Progress</th><th className="p-3">Details</th></tr></thead><tbody>{totals.map(({ person, score, maximum, days: submitted }) => <tr key={person.id} className="border-t"><td className="p-3 font-semibold">{person.name}</td><td className="p-3">{person.batchName || "No batch"}</td><td className="p-3">{submitted} / 7</td><td className="p-3">{score} / {maximum || 0}</td><td className="p-3"><div className="h-2 bg-gray-200 rounded-full min-w-24"><div className="h-2 bg-yellow-600 rounded-full" style={{ width: `${maximum ? Math.min(100, (score / maximum) * 100) : 0}%` }} /></div></td><td className="p-3"><button type="button" onClick={() => setSelectedPerson(person)} className="text-yellow-800 underline font-semibold">View daily details</button></td></tr>)}</tbody></table>{!totals.length && <p className="p-6 text-center text-gray-600">No devotees found for this batch.</p>}</section>}
    {selectedPerson && selectedCard && <PersonDetails person={selectedPerson} card={selectedCard} responses={visibleResponses.filter((response) => response.userId === selectedPerson.id)} days={days} onClose={() => setSelectedPerson(null)} />}
  </div></div>;
}

function PersonDetails({ person, card, responses, days, onClose }: { person: Person; card: CustomSadhanaCard; responses: CustomSadhanaResponse[]; days: string[]; onClose: () => void }) {
  const graph = days.map((date) => { const response = responses.find((item) => item.date === date); return { date: date.slice(5), marks: response?.score || 0, maximum: response?.totalMarks || 0 }; });
  const total = responses.reduce((sum, response) => sum + response.score, 0);
  const displayValue = (field: (typeof card.fields)[number], value: string | number | undefined) => {
    if (value === undefined || value === "") return "Not answered";
    if (field.type === "option") return field.options?.find((option) => option.id === String(value))?.label || String(value);
    return `${value} (${field.ranges?.find((range) => Number(value) >= range.min && Number(value) <= range.max)?.marks || 0} marks)`;
  };
  return <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center"><div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4"><div className="flex justify-between items-start"><div><h2 className="text-xl font-bold text-yellow-900">{person.name}</h2><p className="text-sm text-gray-600">{card.title} · Daily progress</p></div><button type="button" onClick={onClose} className="border rounded px-3 py-1">Close</button></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={graph}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="marks" stroke="#a16207" strokeWidth={3} /></LineChart></ResponsiveContainer></div><div className="font-semibold text-yellow-900">Weekly total: {total} marks</div><div className="space-y-2">{days.map((date) => { const response = responses.find((item) => item.date === date); return <div key={date} className="border rounded-lg p-3"><div className="font-semibold">{date}: {response ? `${response.score} / ${response.totalMarks} marks` : "Not submitted"}</div>{response && <div className="mt-2 text-sm text-gray-600 space-y-1">{card.fields.map((field) => <div key={field.id}>{field.question}: <strong>{displayValue(field, response.values[field.id])}</strong></div>)}</div>}</div>; })}</div></div></div>;
}
