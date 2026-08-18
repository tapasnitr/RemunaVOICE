"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* CONSTANTS */
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
  "account"
];

export default function EditUser({ user, batches, onClose, onSuccess }: any) {
  const [data, setData] = useState({
    ...user,
    features: user.features || {},
    adminFeatures: user.adminFeatures || [],
  });

  const handleUpdate = async () => {
    const selected = batches.find((b: any) => b.id === data.batchId);

    await updateDoc(doc(db, "devotees", data.uid), {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dob: data.dob,
      batchId: data.batchId,
      batchName: selected?.name || "",
      features: data.features,
      adminFeatures: data.adminFeatures,
    });

    onSuccess();
  };

  return (
    <Modal>
      <h2 className="font-bold mb-3">Edit User</h2>

      <Input label="First Name" value={data.firstName} onChange={(v:any)=>setData({...data,firstName:v})}/>
      <Input label="Last Name" value={data.lastName} onChange={(v:any)=>setData({...data,lastName:v})}/>
      <Input label="Phone" value={data.phone} onChange={(v:any)=>setData({...data,phone:v})}/>
      <Input label="DOB" type="date" value={data.dob} onChange={(v:any)=>setData({...data,dob:v})}/>

      {/* BATCH */}
      <select
        value={data.batchId || ""}
        onChange={(e) =>
          setData({ ...data, batchId: e.target.value })
        }
        className="w-full border px-2 py-1 rounded"
      >
        <option value="">Select Batch</option>
        {batches.map((b: any) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      {/* FEATURES */}
      <h4 className="mt-2 font-semibold">User Features</h4>
      {ALL_USER_FEATURES.map((f) => (
        <Checkbox
          key={f}
          label={f}
          checked={data.features[f] || false}
          onChange={(v:any) =>
            setData({
              ...data,
              features: { ...data.features, [f]: v },
            })
          }
        />
      ))}

      {/* ADMIN */}
      <h4 className="mt-2 font-semibold">Admin Permissions</h4>
      {ALL_ADMIN_FEATURES.map((af) => (
        <Checkbox
          key={af}
          label={af}
          checked={data.adminFeatures.includes(af)}
          onChange={(v:any) =>
            setData({
              ...data,
              adminFeatures: v
                ? [...data.adminFeatures, af]
                : data.adminFeatures.filter((x:any) => x !== af),
            })
          }
        />
      ))}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleUpdate}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          Save
        </button>
        <button onClick={onClose} className="border px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </Modal>
  );
}

/* UI */

function Modal({ children }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-[400px]">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
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