"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

/* ================= CONSTANTS ================= */

const ALL_USER_FEATURES = [
  "admin",
  "seva",
  "sadhana",
  "profile",
  "preaching",
  "morningProgram",
  "library",
  "kitchen",
  "reports",
  "sevaBoard",
];

const ALL_ADMIN_FEATURES = [
  "sevaAlot",
  "morningProgramAlot",
  "kitchen",
];

/* ================= COMPONENT ================= */

export default function AddUser({ onClose, fetchUsers }: any) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dob: "",
    batchId: "",
  });

  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [features, setFeatures] = useState<Record<string, boolean>>(
    ALL_USER_FEATURES.reduce((acc, f) => {
      acc[f] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const [adminFeatures, setAdminFeatures] = useState<string[]>([]);

  /* FETCH BATCHES */
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "batches"));
      setBatches(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    };
    fetch();
  }, []);

  const handleChange =
    (field: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const selected = batches.find((b) => b.id === form.batchId);

      await setDoc(doc(db, "devotees", res.user.uid), {
        uid: res.user.uid,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        batchId: form.batchId,
        batchName: selected?.name || "",
        features,
        adminFeatures,
        createdAt: new Date(),
      });

      fetchUsers();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="font-bold text-lg mb-3">Add User</h2>

      <form onSubmit={handleSubmit} className="space-y-2">

        <Input label="First Name" value={form.firstName} onChange={handleChange("firstName")} />
        <Input label="Last Name" value={form.lastName} onChange={handleChange("lastName")} />
        <Input label="Email" value={form.email} onChange={handleChange("email")} />
        <Input label="Password" type="password" value={form.password} onChange={handleChange("password")} />
        <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={handleChange("confirmPassword")} />
        <Input label="Phone" value={form.phone} onChange={handleChange("phone")} />
        <Input label="DOB" type="date" value={form.dob} onChange={handleChange("dob")} />

        {/* BATCH */}
        <select
          value={form.batchId}
          onChange={handleChange("batchId")}
          className="w-full border px-2 py-1 rounded"
        >
          <option value="">Select Batch</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* FEATURES */}
        <h4 className="font-semibold mt-2">User Features</h4>
        {ALL_USER_FEATURES.map((f) => (
          <Checkbox
            key={f}
            label={f}
            checked={features[f]}
            onChange={(v:any) => setFeatures({ ...features, [f]: v })}
          />
        ))}

        {/* ADMIN */}
        <h4 className="font-semibold mt-2">Admin Permissions</h4>
        {ALL_ADMIN_FEATURES.map((af) => (
          <Checkbox
            key={af}
            label={af}
            checked={adminFeatures.includes(af)}
            onChange={(v:any) =>
              setAdminFeatures(
                v
                  ? [...adminFeatures, af]
                  : adminFeatures.filter((x) => x !== af)
              )
            }
          />
        ))}

        <button
          type="submit"
          className="bg-yellow-700 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </Modal>
  );
}

/* UI */

function Modal({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto bg-white p-6 rounded-3xl shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-yellow-100 p-2 text-lg text-yellow-800 shadow-sm hover:bg-yellow-200"
          aria-label="Close modal"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border px-2 py-1 rounded"
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: any) {
  return (
    <label className="flex gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}