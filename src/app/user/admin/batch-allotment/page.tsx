"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import BackPageName from "@/components/BackHeaderButton";

interface Batch {
  id: string;
  name: string;
  description?: string;
}

interface Devotee {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  batchId?: string;
  batchName?: string;
}

export default function BatchAllotmentPage() {
  const { userData } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedDevotees, setSelectedDevotees] = useState<string[]>([]);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDescription, setNewBatchDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const allowed = userData?.features?.admin && userData.adminFeatures?.includes("batchAllotment");

  const load = async () => {
    setLoading(true);
    try {
      const [batchSnap, devoteeSnap] = await Promise.all([
        getDocs(collection(db, "batches")),
        getDocs(collection(db, "devotees")),
      ]);
      setBatches(batchSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Batch)));
      setDevotees(devoteeSnap.docs.map((item) => ({ uid: item.id, ...item.data() } as Devotee)));
    } catch (error) {
      console.error("Could not load batch allotment", error);
      setMessage("Could not load batches and devotees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) void load();
  }, [allowed]);

  const unassigned = useMemo(() => devotees.filter((devotee) => !devotee.batchId), [devotees]);
  const members = (batchId: string) => devotees.filter((devotee) => devotee.batchId === batchId);
  const devoteeName = (devotee: Devotee) => `${devotee.firstName || "Devotee"} ${devotee.lastName || ""}`.trim();

  const assignSelected = async () => {
    if (!selectedBatch || !selectedDevotees.length) return;
    setSaving(true);
    setMessage("");
    try {
      await Promise.all(selectedDevotees.map((uid) => updateDoc(doc(db, "devotees", uid), {
        batchId: selectedBatch.id,
        batchName: selectedBatch.name,
      })));
      setDevotees((current) => current.map((devotee) => selectedDevotees.includes(devotee.uid)
        ? { ...devotee, batchId: selectedBatch.id, batchName: selectedBatch.name }
        : devotee));
      setSelectedDevotees([]);
      setMessage(`${selectedDevotees.length} devotee${selectedDevotees.length === 1 ? "" : "s"} added to ${selectedBatch.name}.`);
    } catch (error) {
      console.error("Could not assign devotees", error);
      setMessage("Devotees could not be assigned.");
    } finally {
      setSaving(false);
    }
  };

  const removeFromBatch = async (devotee: Devotee) => {
    if (!window.confirm(`Remove ${devoteeName(devotee)} from ${devotee.batchName || "this batch"}?`)) return;
    await updateDoc(doc(db, "devotees", devotee.uid), { batchId: "", batchName: "" });
    setDevotees((current) => current.map((item) => item.uid === devotee.uid ? { ...item, batchId: "", batchName: "" } : item));
  };

  const addBatch = async () => {
    if (!newBatchName.trim()) return;
    setSaving(true);
    try {
      const result = await addDoc(collection(db, "batches"), {
        name: newBatchName.trim(),
        description: newBatchDescription.trim(),
        createdAt: serverTimestamp(),
      });
      setBatches((current) => [...current, { id: result.id, name: newBatchName.trim(), description: newBatchDescription.trim() }]);
      setNewBatchName("");
      setNewBatchDescription("");
      setShowAddBatch(false);
      setMessage("Batch created.");
    } catch (error) {
      console.error("Could not create batch", error);
      setMessage("Batch could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const updateBatch = async (name: string, description: string) => {
    if (!editingBatch || !name.trim()) return;
    const nextName = name.trim();
    const nextDescription = description.trim();
    setSaving(true);
    setMessage("");
    try {
      await updateDoc(doc(db, "batches", editingBatch.id), { name: nextName, description: nextDescription });
      const affectedDevotees = members(editingBatch.id);
      if (editingBatch.name !== nextName) {
        await Promise.all(affectedDevotees.map((devotee) => updateDoc(doc(db, "devotees", devotee.uid), { batchName: nextName })));
      }
      setBatches((current) => current.map((batch) => batch.id === editingBatch.id ? { ...batch, name: nextName, description: nextDescription } : batch));
      setDevotees((current) => current.map((devotee) => devotee.batchId === editingBatch.id ? { ...devotee, batchName: nextName } : devotee));
      setEditingBatch(null);
      setMessage("Batch updated.");
    } catch (error) {
      console.error("Could not update batch", error);
      setMessage("Batch could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBatch = async (batch: Batch) => {
    const memberList = members(batch.id);
    const suffix = memberList.length ? ` Its ${memberList.length} member${memberList.length === 1 ? " will" : "s will"} become unassigned.` : "";
    if (!window.confirm(`Delete ${batch.name}?${suffix}`)) return;
    setSaving(true);
    setMessage("");
    try {
      await Promise.all(memberList.map((devotee) => updateDoc(doc(db, "devotees", devotee.uid), { batchId: "", batchName: "" })));
      await deleteDoc(doc(db, "batches", batch.id));
      setBatches((current) => current.filter((item) => item.id !== batch.id));
      setDevotees((current) => current.map((devotee) => devotee.batchId === batch.id ? { ...devotee, batchId: "", batchName: "" } : devotee));
      if (selectedBatch?.id === batch.id) setSelectedBatch(null);
      setMessage(`Batch ${batch.name} deleted.`);
    } catch (error) {
      console.error("Could not delete batch", error);
      setMessage("Batch could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return <div className="p-8 text-center text-red-600 font-semibold">You do not have batch allotment access.</div>;

  return <div className="min-h-screen bg-yellow-50"><BackPageName title="Batch Allotment" link="/user/admin" /><div className="mx-auto max-w-6xl space-y-5 p-4">
    <section className="rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-500 p-5 text-white shadow-lg"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-blue-100">Group management</p><h1 className="text-2xl font-bold">Batch Allotment</h1><p className="text-sm text-blue-100">Assign unassigned devotees to one batch at a time.</p></div><button type="button" onClick={() => setShowAddBatch(true)} className="rounded-lg bg-white px-4 py-2 font-semibold text-indigo-800">+ Add batch</button></div></section>
    {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
    {loading ? <p className="text-center text-gray-600">Loading...</p> : <section className="grid gap-4 md:grid-cols-2">{batches.map((batch) => <div key={batch.id} className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-indigo-950">{batch.name}</h2><p className="text-sm text-gray-500">{batch.description || "No description"}</p></div><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setSelectedBatch(batch); setSelectedDevotees([]); setMessage(""); }} className="rounded-lg bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-900">+ Add devotee</button><button type="button" onClick={() => setEditingBatch(batch)} className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800">Edit</button><button type="button" disabled={saving} onClick={() => void deleteBatch(batch)} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Delete</button></div></div><div className="mt-4 space-y-2"><div className="text-xs font-bold uppercase tracking-wide text-gray-500">Members · {members(batch.id).length}</div>{members(batch.id).map((devotee) => <div key={devotee.uid} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm"><span>{devoteeName(devotee)}</span><button type="button" onClick={() => void removeFromBatch(devotee)} className="text-xs font-semibold text-red-700">Remove</button></div>)}{members(batch.id).length === 0 && <p className="rounded-lg border border-dashed p-3 text-sm text-gray-500">No devotees assigned yet.</p>}</div></div>)}{batches.length === 0 && <p className="text-gray-600">No batches found.</p>}</section>}
    {!loading && <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><h2 className="font-bold text-gray-900">Unassigned devotees · {unassigned.length}</h2><p className="mt-1 text-sm text-gray-500">Students already in another batch do not appear here. Remove them from their current batch first.</p>{unassigned.length === 0 && <p className="mt-3 text-sm text-gray-600">Every devotee currently has a batch.</p>}</section>}
    {selectedBatch && <AssignModal batch={selectedBatch} devotees={unassigned} selected={selectedDevotees} setSelected={setSelectedDevotees} saving={saving} onSave={() => void assignSelected()} onClose={() => setSelectedBatch(null)} />}
    {showAddBatch && <AddBatchModal name={newBatchName} description={newBatchDescription} setName={setNewBatchName} setDescription={setNewBatchDescription} saving={saving} onSave={() => void addBatch()} onClose={() => setShowAddBatch(false)} />}
    {editingBatch && <EditBatchModal batch={editingBatch} saving={saving} onSave={(name, description) => void updateBatch(name, description)} onClose={() => setEditingBatch(null)} />}
  </div></div>;
}

function EditBatchModal({ batch, saving, onSave, onClose }: { batch: Batch; saving: boolean; onSave: (name: string, description: string) => void; onClose: () => void }) {
  const [name, setName] = useState(batch.name);
  const [description, setDescription] = useState(batch.description || "");
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-indigo-950">Edit batch</h2><button type="button" disabled={saving} onClick={onClose} className="rounded-full border px-3 py-1 disabled:opacity-50">Close</button></div><label className="mt-4 block text-sm font-semibold">Batch name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label><label className="mt-3 block text-sm font-semibold">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border p-3" /></label><button type="button" disabled={!name.trim() || saving} onClick={() => onSave(name, description)} className="mt-4 w-full rounded-lg bg-indigo-700 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button></div></div>;
}

function AssignModal({ batch, devotees, selected, setSelected, saving, onSave, onClose }: { batch: Batch; devotees: Devotee[]; selected: string[]; setSelected: (value: string[]) => void; saving: boolean; onSave: () => void; onClose: () => void }) {
  const toggle = (uid: string) => setSelected(selected.includes(uid) ? selected.filter((id) => id !== uid) : [...selected, uid]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-indigo-950">Add devotees</h2><p className="text-sm text-gray-600">To {batch.name}</p></div><button type="button" onClick={onClose} className="rounded-full border px-3 py-1">Close</button></div><p className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">Only devotees without a batch are shown. Select multiple students and add them together.</p><div className="mt-4 max-h-72 space-y-2 overflow-y-auto">{devotees.map((devotee) => <label key={devotee.uid} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selected.includes(devotee.uid) ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"}`}><input type="checkbox" checked={selected.includes(devotee.uid)} onChange={() => toggle(devotee.uid)} /><span><span className="block font-medium">{devotee.firstName || "Devotee"} {devotee.lastName || ""}</span><span className="text-xs text-gray-500">{devotee.email || "No email"}</span></span></label>)}{!devotees.length && <p className="text-sm text-gray-600">No unassigned devotees available.</p>}</div><div className="mt-5 flex items-center justify-between"><span className="text-sm text-gray-600">{selected.length} selected</span><button type="button" disabled={!selected.length || saving} onClick={onSave} className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Adding..." : "Add to batch"}</button></div></div></div>;
}

function AddBatchModal({ name, description, setName, setDescription, saving, onSave, onClose }: { name: string; description: string; setName: (value: string) => void; setDescription: (value: string) => void; saving: boolean; onSave: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-indigo-950">Add batch</h2><button type="button" onClick={onClose} className="rounded-full border px-3 py-1">Close</button></div><label className="mt-4 block text-sm font-semibold">Batch name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Bhakti Beginners" className="mt-1 w-full rounded-lg border p-3" /></label><label className="mt-3 block text-sm font-semibold">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional batch description" className="mt-1 min-h-24 w-full rounded-lg border p-3" /></label><button type="button" disabled={!name.trim() || saving} onClick={onSave} className="mt-4 w-full rounded-lg bg-indigo-700 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Creating..." : "Create batch"}</button></div></div>;
}
