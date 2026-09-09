"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, getDocs, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackPageName from "@/components/BackHeaderButton";
import {
  CustomFieldType,
  CustomFieldCategory,
  CustomSadhanaCard,
  CustomSadhanaField,
} from "../../sadhana/custom/types";
import StudentFieldGroup from "../../sadhana/custom/StudentFieldGroup";

type Batch = { id: string; name: string };

const newField = (type: CustomFieldType = "option", category: CustomFieldCategory = "soul"): CustomSadhanaField => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  question: "",
  type,
  category,
  required: true,
  options:
    type === "option"
      ? [{ id: `option_${Date.now()}`, label: "", marks: 0 }]
      : undefined,
  ranges:
    type === "number"
      ? [{ id: `range_${Date.now()}`, min: 0, max: 0, marks: 0 }]
      : undefined,
});

export default function CustomSadhanaAdminPage() {
  const { userData, user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [cards, setCards] = useState<CustomSadhanaCard[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [fields, setFields] = useState<CustomSadhanaField[]>([newField()]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewCard, setViewCard] = useState<CustomSadhanaCard | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [assignCard, setAssignCard] = useState<CustomSadhanaCard | null>(null);
  const [assignSelection, setAssignSelection] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const allowed = userData?.features?.admin && userData.adminFeatures?.includes("customSadhana");

  const load = async () => {
    setLoading(true);
    try {
      const [batchSnap, cardSnap] = await Promise.all([
        getDocs(collection(db, "batches")),
        getDocs(collection(db, "custom_sadhana_cards")),
      ]);
      setBatches(batchSnap.docs.map((item) => ({ id: item.id, name: item.data().name || item.id })));
      setCards(cardSnap.docs.map((item) => ({ id: item.id, ...item.data() } as CustomSadhanaCard)));
    } catch (error) {
      console.error("Could not load custom sadhana cards", error);
      const code = error instanceof Error ? error.message : "unknown error";
      setMessage(`Could not load cards: ${code}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) void load();
  }, [allowed]);

  if (!allowed) {
    return <div className="p-8 text-center text-red-600 font-semibold">You do not have custom sadhana admin access.</div>;
  }

  const updateField = (fieldId: string, update: Partial<CustomSadhanaField>) => {
    setFields((current) => current.map((field) => (field.id === fieldId ? { ...field, ...update } : field)));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBatchIds([]);
    setFields([newField()]);
    setEditingCardId(null);
    setFieldErrors({});
  };

  const editCard = (card: CustomSadhanaCard) => {
    setTitle(card.title);
    setDescription(card.description || "");
    setBatchIds(card.batchIds || []);
    setFields(card.fields.map((field) => ({ ...field, category: field.category || "soul" })));
    setEditingCardId(card.id);
    setMessage("");
    setFieldErrors({});
    setShowForm(true);
  };

  const removeCard = async (card: CustomSadhanaCard) => {
    if (!window.confirm(`Delete “${card.title}”? Student responses will remain in the report history.`)) return;
    try {
      await deleteDoc(doc(db, "custom_sadhana_cards", card.id));
      setCards((current) => current.filter((item) => item.id !== card.id));
      if (viewCard?.id === card.id) setViewCard(null);
      setMessage("Card deleted.");
    } catch (error) {
      console.error("Could not delete custom sadhana card", error);
      setMessage("Card could not be deleted.");
    }
  };

  const save = async () => {
    const selectedBatches = batches.filter((batch) => batchIds.includes(batch.id));
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Enter a card title.";
    if (!fields.length) errors.fields = "Add at least one field.";
    fields.forEach((field) => {
      if (!field.question.trim()) errors[field.id] = "Enter the question.";
      if (field.type === "option") {
        if (!field.options?.length) errors[`${field.id}.options`] = "Add at least one option.";
        field.options?.forEach((option) => {
          if (!option.label.trim()) errors[`${field.id}.${option.id}.label`] = "Enter option text.";
          if (!Number.isInteger(option.marks)) errors[`${field.id}.${option.id}.marks`] = "Use a whole number, including negative marks.";
        });
      } else {
        if (!field.ranges?.length) errors[`${field.id}.ranges`] = "Add at least one range.";
        field.ranges?.forEach((range) => {
          if (range.min > range.max) errors[`${field.id}.${range.id}.range`] = "Minimum must be less than maximum.";
          if (!Number.isInteger(range.min) || !Number.isInteger(range.max)) errors[`${field.id}.${range.id}.range`] = "Use whole numbers for the range.";
          if (!Number.isInteger(range.marks)) errors[`${field.id}.${range.id}.marks`] = "Use a whole number, including negative marks.";
        });
      }
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      // Firestore does not accept undefined values. Keep only the scoring
      // configuration used by each field type.
      const firestoreFields = fields.map((field) => ({
        id: field.id,
        question: field.question.trim(),
        type: field.type,
        category: field.category || "soul",
        required: field.required,
        ...(field.type === "option"
          ? { options: field.options || [] }
          : { ranges: field.ranges || [] }),
      }));

      const cardData = {
        title: title.trim(),
        description: description.trim(),
        batchIds,
        batchNames: selectedBatches.map((batch) => batch.name),
        fields: firestoreFields,
        active: true,
        createdBy: user?.uid || "",
        createdAt: serverTimestamp(),
      };
      if (editingCardId) {
        await updateDoc(doc(db, "custom_sadhana_cards", editingCardId), cardData);
        setCards((current) => current.map((card) => card.id === editingCardId ? { ...card, ...cardData, id: editingCardId } as CustomSadhanaCard : card));
        setMessage("Custom sadhana card updated.");
      } else {
        await addDoc(collection(db, "custom_sadhana_cards"), cardData);
        setMessage("Custom sadhana card created.");
      }
      resetForm();
      await load();
      setShowForm(false);
    } catch (error) {
      console.error("Could not create custom sadhana card", error);
      const code = error instanceof Error ? error.message : "unknown error";
      setFieldErrors({ form: `Card could not be saved: ${code}` });
    } finally {
      setSaving(false);
    }
  };

  const assignBatches = async (card: CustomSadhanaCard, nextBatchIds: string[]) => {
    const nextBatchNames = batches
      .filter((batch) => nextBatchIds.includes(batch.id))
      .map((batch) => batch.name);
    try {
      await updateDoc(doc(db, "custom_sadhana_cards", card.id), {
        batchIds: nextBatchIds,
        batchNames: nextBatchNames,
      });
      setCards((current) => current.map((item) => item.id === card.id
        ? { ...item, batchIds: nextBatchIds, batchNames: nextBatchNames }
        : item));
    } catch (error) {
      console.error("Could not update card batches", error);
      setMessage("Batch assignment could not be saved.");
    }
  };

  const openAssignment = (card: CustomSadhanaCard) => {
    setAssignCard(card);
    setAssignSelection(card.batchIds || []);
  };

  const saveAssignment = async () => {
    if (!assignCard) return;
    setAssigning(true);
    await assignBatches(assignCard, assignSelection);
    setAssigning(false);
    setAssignCard(null);
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      <BackPageName title="Custom Sadhana Cards" link="/user/admin" />
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <section className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-bold text-yellow-900">Existing custom sadhana cards</h2><p className="text-sm text-gray-600">Review cards already created and the batches receiving them.</p></div>
            <button type="button" onClick={() => { resetForm(); setMessage(""); setShowForm(true); }} className="bg-yellow-700 text-white px-4 py-2 rounded font-semibold">+ Create new card</button>
          </div>
          {message && !showForm && <p className="mt-3 text-sm text-red-700">{message}</p>}
          {loading ? <p className="mt-4 text-sm text-gray-600">Loading cards...</p> : cards.length === 0 ? <p className="mt-4 text-sm text-gray-600">No custom cards have been created yet.</p> : <div className="overflow-x-auto mt-4"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Card</th><th className="p-2">Assign batches</th><th className="p-2">Fields</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead><tbody>{cards.map((card) => <tr key={card.id} className="border-b align-top"><td className="p-2 font-semibold">{card.title}</td><td className="p-2"><button type="button" onClick={() => openAssignment(card)} className="rounded-lg bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-900">Assign batches</button><div className="text-xs text-gray-500 mt-1">{card.batchIds?.length ? card.batchNames?.join(", ") : "All batches"}</div></td><td className="p-2">{card.fields?.length || 0}</td><td className="p-2">{card.active === false ? "Inactive" : "Active"}</td><td className="p-2"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setViewCard(card)} className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-900 font-semibold">View</button><button type="button" onClick={() => editCard(card)} className="rounded-full bg-blue-100 px-3 py-1 text-blue-900 font-semibold">Edit</button><button type="button" onClick={() => void removeCard(card)} className="rounded-full bg-red-100 px-3 py-1 text-red-800 font-semibold">Delete</button></div></td></tr>)}</tbody></table></div>}
        </section>

        {viewCard && <CardDetails card={viewCard} onClose={() => setViewCard(null)} />}
        {assignCard && <AssignmentModal card={assignCard} batches={batches} selection={assignSelection} setSelection={setAssignSelection} saving={assigning} onSave={() => void saveAssignment()} onClose={() => setAssignCard(null)} />}

        {showForm && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
        <section className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-2xl space-y-4 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-yellow-900">{editingCardId ? "Edit Sadhana card" : "Create a new card"}</h2><p className="text-sm text-gray-600">This is a live preview of what students will receive.</p></div><button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="border px-3 py-1 rounded">Cancel</button></div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-900"><strong>What should I enter?</strong><p className="mt-1">Title is the card name. Description explains the purpose. Each field is one daily question. Use Option when students choose an answer, and Number when they enter minutes, rounds, pages, or another number. Give the answer or number range the marks it should earn.</p></div>
          <label className="block text-sm font-semibold">Card title<input className={`w-full rounded p-2 mt-1 border ${fieldErrors.title ? "border-red-500" : "border-gray-300"}`} placeholder="Example: Weekly Sadhana Practice" value={title} onChange={(event) => setTitle(event.target.value)} />{fieldErrors.title && <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.title}</span>}</label>
          <label className="block text-sm font-semibold">Description<textarea className="w-full border rounded p-2 mt-1" placeholder="Example: Daily hearing, reading, and chanting practice" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="block text-sm font-semibold">Assign to batches<select multiple value={batchIds} onChange={(event) => setBatchIds(Array.from(event.target.selectedOptions, (option) => option.value))} className="w-full border rounded p-2 mt-1 min-h-24">{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select><span className="font-normal text-xs text-gray-500">Hold Command/Ctrl to select more than one batch.</span></label>
          {fieldErrors.fields && <p className="text-xs text-red-600">{fieldErrors.fields}</p>}
          <div className="space-y-4">{fields.map((field, index) => <FieldEditor key={field.id} field={field} index={index} errors={fieldErrors} onChange={(update) => updateField(field.id, update)} onRemove={() => setFields((current) => current.filter((item) => item.id !== field.id))} />)}</div>
          <button type="button" onClick={() => setFields((current) => [...current, newField()])} className="border border-yellow-700 text-yellow-800 px-3 py-2 rounded">+ Add field</button>
          <button type="button" disabled={saving} onClick={save} className="block w-full bg-yellow-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50">{saving ? (editingCardId ? "Updating..." : "Creating...") : (editingCardId ? "Update card" : "Create card")}</button>
          {fieldErrors.form && <p className="text-sm text-red-700">{fieldErrors.form}</p>}
        </section>
        </div>}
      </div>
    </div>
  );
}

function AssignmentModal({ card, batches, selection, setSelection, saving, onSave, onClose }: { card: CustomSadhanaCard; batches: Batch[]; selection: string[]; setSelection: (selection: string[]) => void; saving: boolean; onSave: () => void; onClose: () => void }) {
  const toggleBatch = (batchId: string) => {
    setSelection(selection.includes(batchId) ? selection.filter((id) => id !== batchId) : [...selection, batchId]);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-yellow-900">Assign batches</h2><p className="text-sm text-gray-600">{card.title}</p></div><button type="button" onClick={onClose} className="rounded-full border px-3 py-1 text-sm">Close</button></div><p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">Select one or more batches. Leave everything unselected to show this card to all batches.</p><div className="mt-4 max-h-64 space-y-2 overflow-y-auto">{batches.map((batch) => <label key={batch.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${selection.includes(batch.id) ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"}`}><input type="checkbox" checked={selection.includes(batch.id)} onChange={() => toggleBatch(batch.id)} className="h-4 w-4" /><span className="font-medium">{batch.name}</span></label>)}{batches.length === 0 && <p className="text-sm text-gray-500">No batches found.</p>}</div><div className="mt-5 flex items-center justify-between gap-3"><span className="text-sm text-gray-600">{selection.length ? `${selection.length} batch${selection.length === 1 ? "" : "es"} selected` : "All batches"}</span><button type="button" disabled={saving} onClick={onSave} className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save assignment"}</button></div></div></div>;
}

function LegacyCardPreview({ title, description, fields, batchNames }: { title: string; description: string; fields: CustomSadhanaField[]; batchNames: string[] }) {
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const soulFields = fields.filter((field) => (field.category || "soul") === "soul");
  const bodyFields = fields.filter((field) => field.category === "body");
  const group = (label: string, groupFields: CustomSadhanaField[], color: string) => groupFields.length > 0 && <div className="space-y-3"><h3 className={`font-bold ${color}`}>{label}</h3>{groupFields.map((field) => <div key={field.id} className="rounded-lg border bg-white p-3"><div className="text-sm font-semibold text-gray-900">{field.question || "Your question will appear here"}{field.required ? " *" : ""}</div>{field.type === "option" ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">{field.options?.map((option) => <button type="button" key={option.id} onClick={() => setPreviewValues((current) => ({ ...current, [field.id]: option.id }))} className={`text-left rounded-lg border p-2 text-sm ${previewValues[field.id] === option.id ? "border-yellow-700 bg-yellow-100 ring-2 ring-yellow-200" : "hover:bg-yellow-50"}`}><span className="block">{option.label || "Option label"}</span><span className="text-xs text-gray-500">{option.marks} marks</span></button>)}</div> : <div className="mt-2"><input type="number" placeholder="Enter today&apos;s number" className="w-full rounded border p-2 text-sm" readOnly /><p className="mt-1 text-xs text-gray-500">Weekly range scoring is shown to the student here.</p></div>}</div>)}</div>;
  return <div className="rounded-xl bg-white p-4 shadow-sm space-y-4"><div><h2 className="text-lg font-bold text-yellow-900">{title}</h2><p className="text-sm text-gray-600">{description || "Your card description will appear here."}</p><p className="mt-1 text-xs text-gray-500">{batchNames.length ? `Assigned to: ${batchNames.join(", ")}` : "Visible to all batches"}</p></div>{group("Soul", soulFields, "text-yellow-800")}{group("Body", bodyFields, "text-green-800")}<button type="button" className="w-full rounded-lg bg-yellow-700 py-2 text-sm font-semibold text-white">Save selected date</button></div>;
}

function CardPreview({ title, description, fields, batchNames }: { title: string; description: string; fields: CustomSadhanaField[]; batchNames: string[] }) {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const update = (fieldId: string, value: string | number) => setValues((current) => ({ ...current, [fieldId]: value }));
  return <div className="overflow-hidden rounded-[1.5rem] border border-[#d8d4c8] bg-[#fffdf8] shadow-[0_12px_35px_rgba(35,61,57,0.08)]"><div className="border-b border-[#e7e2d7] bg-[#f8f4e9] p-5"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#dcefe7] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#226354]"><span className="h-1.5 w-1.5 rounded-full bg-[#d19b32]" />Today&apos;s offering</div><h2 className="text-xl font-bold text-[#243f40]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#66736e]">{description || "Complete your devotional practice with attention."}</p></div><div className="space-y-6 p-5"><StudentFieldGroup title="Soul" fields={fields.filter((field) => (field.category || "soul") === "soul")} values={values} update={update} tone="yellow" /><StudentFieldGroup title="Body" fields={fields.filter((field) => field.category === "body")} values={values} update={update} tone="green" /><div className="border-t border-[#e7e2d7] pt-5"><button type="button" disabled className="w-full rounded-xl bg-[#216252] px-6 py-3.5 text-sm font-bold text-white opacity-70">Save my practice</button></div></div></div>;
}

function CardDetails({ card, onClose }: { card: CustomSadhanaCard; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-bold text-yellow-900">{card.title}</h2><p className="text-sm text-gray-600">{card.description || "No description"}</p></div>
          <button type="button" onClick={onClose} className="border px-3 py-1 rounded">Close</button>
        </div>
        <div className="text-sm"><strong>Assigned batches:</strong> {card.batchNames?.join(", ") || "-"}</div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3"><div className="text-xs font-bold uppercase tracking-wide text-blue-800 mb-2">Student view</div><CardPreview title={card.title} description={card.description} fields={card.fields} batchNames={card.batchNames || []} /></div>
      </div>
    </div>
  );
}

function FieldEditor({ field, index, errors, onChange, onRemove }: { field: CustomSadhanaField; index: number; errors: Record<string, string>; onChange: (update: Partial<CustomSadhanaField>) => void; onRemove: () => void }) {
  const updateOption = (id: string, update: { label?: string; marks?: number }) => onChange({ options: field.options?.map((option) => option.id === id ? { ...option, ...update } : option) });
  const updateRange = (id: string, update: { min?: number; max?: number; marks?: number }) => onChange({ ranges: field.ranges?.map((range) => range.id === id ? { ...range, ...update } : range) });

  return (
    <div className="border border-yellow-200 rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-center"><strong>Field {index + 1}</strong><button onClick={onRemove} className="text-red-600 text-sm">Remove</button></div>
      <input className={`w-full rounded p-2 border ${errors[field.id] ? "border-red-500" : "border-gray-300"}`} placeholder="Question" value={field.question} onChange={(event) => onChange({ question: event.target.value })} />
      {errors[field.id] && <p className="text-xs text-red-600">{errors[field.id]}</p>}
      <div className="flex flex-wrap gap-2 text-sm"><span className="font-semibold">Category:</span><button type="button" onClick={() => onChange({ category: "soul" })} className={`px-3 py-1 rounded-full ${field.category === "soul" ? "bg-yellow-700 text-white" : "bg-yellow-100 text-yellow-900"}`}>Soul</button><button type="button" onClick={() => onChange({ category: "body" })} className={`px-3 py-1 rounded-full ${field.category === "body" ? "bg-green-700 text-white" : "bg-green-100 text-green-900"}`}>Body</button><label className="ml-2"><input type="checkbox" checked={field.required} onChange={(event) => onChange({ required: event.target.checked })} /> Required</label></div>
      <div className="flex gap-2 text-sm"><button type="button" className={`px-3 py-1 rounded ${field.type === "option" ? "bg-blue-700 text-white" : "bg-gray-100"}`} onClick={() => onChange({ ...newField("option", field.category || "soul"), id: field.id, question: field.question, required: field.required })}>Choice buttons</button><button type="button" className={`px-3 py-1 rounded ${field.type === "number" ? "bg-blue-700 text-white" : "bg-gray-100"}`} onClick={() => onChange({ ...newField("number", field.category || "soul"), id: field.id, question: field.question, required: field.required })}>Integer number input</button></div>
      {field.type === "option" ? <div className="space-y-2">{field.options?.map((option) => <div className="grid grid-cols-[1fr_auto] gap-2" key={option.id}><div><input className={`w-full rounded p-2 border ${errors[`${field.id}.${option.id}.label`] ? "border-red-500" : "border-gray-300"}`} placeholder="Option" value={option.label} onChange={(event) => updateOption(option.id, { label: event.target.value })} />{errors[`${field.id}.${option.id}.label`] && <p className="text-xs text-red-600">{errors[`${field.id}.${option.id}.label`]}</p>}</div><div><input className={`w-24 rounded p-2 border ${errors[`${field.id}.${option.id}.marks`] ? "border-red-500" : "border-gray-300"}`} type="number" step="1" placeholder="Marks" value={option.marks} onChange={(event) => updateOption(option.id, { marks: Number(event.target.value) })} />{errors[`${field.id}.${option.id}.marks`] && <p className="w-24 text-xs text-red-600">{errors[`${field.id}.${option.id}.marks`]}</p>}</div></div>)}{errors[`${field.id}.options`] && <p className="text-xs text-red-600">{errors[`${field.id}.options`]}</p>}<p className="text-xs text-gray-500">Marks may be negative, zero, or positive whole numbers.</p><button type="button" onClick={() => onChange({ options: [...(field.options || []), { id: `option_${Date.now()}`, label: "", marks: 0 }] })} className="text-sm text-yellow-800">+ Add option</button></div> : <div className="space-y-2">{field.ranges?.map((range) => <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={range.id}><div><input className={`w-full rounded p-2 border ${errors[`${field.id}.${range.id}.range`] ? "border-red-500" : "border-gray-300"}`} type="number" step="1" placeholder="Min" value={range.min} onChange={(event) => updateRange(range.id, { min: Number(event.target.value) })} /></div><div><input className={`w-full rounded p-2 border ${errors[`${field.id}.${range.id}.range`] ? "border-red-500" : "border-gray-300"}`} type="number" step="1" placeholder="Max" value={range.max} onChange={(event) => updateRange(range.id, { max: Number(event.target.value) })} />{errors[`${field.id}.${range.id}.range`] && <p className="col-span-2 text-xs text-red-600">{errors[`${field.id}.${range.id}.range`]}</p>}</div><div><input className={`w-24 rounded p-2 border ${errors[`${field.id}.${range.id}.marks`] ? "border-red-500" : "border-gray-300"}`} type="number" step="1" placeholder="Marks" value={range.marks} onChange={(event) => updateRange(range.id, { marks: Number(event.target.value) })} />{errors[`${field.id}.${range.id}.marks`] && <p className="w-24 text-xs text-red-600">{errors[`${field.id}.${range.id}.marks`]}</p>}</div></div>)}{errors[`${field.id}.ranges`] && <p className="text-xs text-red-600">{errors[`${field.id}.ranges`]}</p>}<p className="text-xs text-gray-500">Range marks may be negative, zero, or positive whole numbers.</p><button type="button" onClick={() => onChange({ ranges: [...(field.ranges || []), { id: `range_${Date.now()}`, min: 0, max: 0, marks: 0 }] })} className="text-sm text-yellow-800">+ Add number range</button></div>}
    </div>
  );
}
