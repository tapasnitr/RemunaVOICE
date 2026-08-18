"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface Donor {
  id: string;

  name: string;

  status: "Active" | "Inactive";
}

interface DonorNameFieldProps {
  value: string;

  transactionType: "Credit" | "Debit";

  onChange: (value: string) => void;
}

export default function DonorNameField({
  value,
  transactionType,
  onChange,
}: DonorNameFieldProps) {
  const [donors, setDonors] = useState<
    Donor[]
  >([]);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const snap = await getDocs(
          collection(db, "accountDonors")
        );

        const list: Donor[] = snap.docs
          .map((item) => {
            const data =
              item.data() as Partial<Donor>;

            return {
              id: item.id,

              name: data.name || "",

              status:
                data.status || "Active",
            };
          })
          .filter(
            (donor) =>
              donor.name &&
              donor.status === "Active"
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          );

        setDonors(list);
      } catch (error) {
        console.log(error);
      }
    };

    fetchDonors();
  }, []);

  if (transactionType === "Debit") {
    return (
      <div>
        <label className="text-sm block mb-1">
          Devotee Name
        </label>

        <input
          value={value}
          onChange={(
            e: ChangeEvent<HTMLInputElement>
          ) => onChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm block mb-1">
        Donor Name
      </label>

      <select
        value={value}
        onChange={(
          e: ChangeEvent<HTMLSelectElement>
        ) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      >
        <option value="">
          Select Donor
        </option>

        {donors.map((donor) => (
          <option
            key={donor.id}
            value={donor.name}
          >
            {donor.name}
          </option>
        ))}
      </select>
    </div>
  );
}
