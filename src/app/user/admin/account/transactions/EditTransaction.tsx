"use client";

import {
  ChangeEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  useEffect,
  useState,
} from "react";

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { Transaction } from "./page";
import DonorNameField from "./DonorNameField";

/* ================= TYPES ================= */

interface Props {
  data: Transaction;

  onClose: () => void;

  onSuccess: () => void;
}

interface Department {
  id: string;

  name: string;
}

interface FormState {
  dept: string;

  devoteeName: string;

  amount: string;

  date: string;

  type: "Credit" | "Debit";

  paymentType: "Online" | "Cash";

  purpose: string;

  remarks: string;
}

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;

  options: string[];
}

/* ================= COMPONENT ================= */

export default function EditTransaction({
  data,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] =
    useState<boolean>(false);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [form, setForm] = useState<FormState>({
    dept: data.dept,

    devoteeName: data.devoteeName,

    amount: String(data.amount),

    date: data.date,

    type: data.type,

    paymentType: data.paymentType,

    purpose: data.purpose,

    remarks: data.remarks,
  });

  /* ================= FETCH DEPARTMENTS ================= */

  useEffect(() => {
    const fetchDepartments =
      async () => {
        try {
          const snap =
            await getDocs(
              collection(
                db,
                "departments"
              )
            );

          const list: Department[] =
            snap.docs.map((doc) => ({
              id: doc.id,

              ...(doc.data() as Omit<
                Department,
                "id"
              >),
            }));

          setDepartments(list);
        } catch (error) {
          console.log(error);
        }
      };

    fetchDepartments();
  }, []);

  /* ================= UPDATE ================= */

  const handleUpdate = async () => {
    setLoading(true);

    try {
      await updateDoc(
        doc(
          db,
          "accountTransactions",
          data.id
        ),
        {
          ...form,

          amount: Number(form.amount),
        }
      );

      onSuccess();
    } catch (error) {
      console.log(error);

      alert("Update failed");
    }

    setLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div >
      {/* HEADER */}

      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-lg">
          Edit Transaction
        </h2>

        <button
          onClick={onClose}
          className="text-red-600"
        >
          ✕
        </button>
      </div>

      {/* FORM */}

      <div className="grid md:grid-cols-1 gap-4">
        {/* DEPARTMENT */}

        <Select
          label="Department"
          value={form.dept}
          onChange={(
            e: ChangeEvent<HTMLSelectElement>
          ) =>
            setForm({
              ...form,
              dept: e.target.value,
            })
          }
          options={departments.map(
            (d) => d.name
          )}
        />

        {/* DONOR / DEVOTEE */}

        <DonorNameField
          value={form.devoteeName}
          transactionType={form.type}
          onChange={(value) =>
            setForm({
              ...form,
              devoteeName: value,
            })
          }
        />

        {/* AMOUNT */}

        <Input
          label="Amount"
          type="number"
          value={form.amount}
          onChange={(
            e: ChangeEvent<HTMLInputElement>
          ) =>
            setForm({
              ...form,
              amount: e.target.value,
            })
          }
        />

        {/* DATE */}

        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(
            e: ChangeEvent<HTMLInputElement>
          ) =>
            setForm({
              ...form,
              date: e.target.value,
            })
          }
        />

        {/* TYPE */}

        <Select
          label="Transaction Type"
          value={form.type}
          onChange={(
            e: ChangeEvent<HTMLSelectElement>
          ) =>
            setForm({
              ...form,
              type: e.target
                .value as FormState["type"],
            })
          }
          options={[
            "Credit",
            "Debit",
          ]}
        />

        {/* PAYMENT TYPE */}

        <Select
          label="Payment Type"
          value={form.paymentType}
          onChange={(
            e: ChangeEvent<HTMLSelectElement>
          ) =>
            setForm({
              ...form,
              paymentType: e.target
                .value as FormState["paymentType"],
            })
          }
          options={[
            "Online",
            "Cash",
          ]}
        />

        {/* PURPOSE */}

        <Input
          label="Purpose"
          value={form.purpose}
          onChange={(
            e: ChangeEvent<HTMLInputElement>
          ) =>
            setForm({
              ...form,
              purpose: e.target.value,
            })
          }
        />

        {/* REMARKS */}

        <Input
          label="Remarks"
          value={form.remarks}
          onChange={(
            e: ChangeEvent<HTMLInputElement>
          ) =>
            setForm({
              ...form,
              remarks: e.target.value,
            })
          }
        />
      </div>

      {/* BUTTON */}

      <button
        onClick={handleUpdate}
        disabled={loading}
        className="mt-5 bg-blue-700 text-white px-5 py-2 rounded-lg"
      >
        {loading
          ? "Updating..."
          : "Update"}
      </button>
    </div>
  );
}

/* ================= INPUT ================= */

function Input({
  label,
  ...props
}: InputProps) {
  return (
    <div>
      <label className="text-sm block mb-1">
        {label}
      </label>

      <input
        {...props}
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}

/* ================= SELECT ================= */

function Select({
  label,
  options,
  ...props
}: SelectProps) {
  return (
    <div>
      <label className="text-sm block mb-1">
        {label}
      </label>

      <select
        {...props}
        className="w-full border rounded-lg px-3 py-2"
      >
        <option value="">
          Select {label}
        </option>

        {options.map((item) => (
          <option
            key={item}
            value={item}
          >
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
