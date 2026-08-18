"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Modal from "@/components/Modal";

import {
  FaArrowLeft,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

/* ================= TYPES ================= */

interface DonorRecord {
  id: string;

  name: string;

  phone: string;

  address: string;

  status: "Active" | "Inactive";
}

type DonorFormState = Omit<DonorRecord, "id">;

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;

  options: string[];
}

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

/* ================= CONSTANTS ================= */

const emptyForm: DonorFormState = {
  name: "",

  phone: "",

  address: "",

  status: "Active",
};

/* ================= PAGE ================= */

export default function DonorsPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState<boolean>(true);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [deleteLoading, setDeleteLoading] =
    useState<string>("");

  const [donors, setDonors] =
    useState<DonorRecord[]>([]);

  const [search, setSearch] =
    useState<string>("");

  const [showForm, setShowForm] =
    useState<boolean>(false);

  const [editingDonor, setEditingDonor] =
    useState<DonorRecord | null>(null);

  const [form, setForm] =
    useState<DonorFormState>(emptyForm);

  /* ================= FETCH ================= */

  const fetchDonors = async () => {
    try {
      setLoading(true);

      const snap = await getDocs(
        collection(db, "accountDonors")
      );

      const list: DonorRecord[] = snap.docs
        .map((item) => {
          const data =
            item.data() as Partial<DonorRecord>;

          return {
            id: item.id,

            name: data.name || "",

            phone: data.phone || "",

            address: data.address || "",

            status: data.status || "Active",
          };
        })
        .sort((a, b) =>
          a.name.localeCompare(b.name)
        );

      setDonors(list);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  /* ================= FILTER ================= */

  const filteredDonors = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return donors;

    return donors.filter(
      (donor) =>
        donor.name.toLowerCase().includes(term) ||
        donor.phone.toLowerCase().includes(term) ||
        donor.address.toLowerCase().includes(term)
    );
  }, [donors, search]);

  /* ================= ACTIONS ================= */

  const openAddForm = () => {
    setEditingDonor(null);

    setForm(emptyForm);

    setShowForm(true);
  };

  const openEditForm = (donor: DonorRecord) => {
    setEditingDonor(donor);

    setForm({
      name: donor.name,

      phone: donor.phone,

      address: donor.address,

      status: donor.status,
    });

    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert("Donor name is required");

      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,

        name,

        updatedAt: new Date(),
      };

      if (editingDonor) {
        await updateDoc(
          doc(db, "accountDonors", editingDonor.id),
          payload
        );
      } else {
        await addDoc(
          collection(db, "accountDonors"),
          { ...payload, createdAt: new Date() }
        );
      }

      await fetchDonors();

      setShowForm(false);

      setEditingDonor(null);
    } catch (error) {
      console.log(error);

      alert("Save failed");
    }

    setSaving(false);
  };

  const handleDelete = async (donor: DonorRecord) => {
    if (!window.confirm("Delete this donor?")) return;

    setDeleteLoading(donor.id);

    try {
      await deleteDoc(
        doc(db, "accountDonors", donor.id)
      );

      await fetchDonors();
    } catch (error) {
      console.log(error);

      alert("Delete failed");
    }

    setDeleteLoading("");
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded bg-white border"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>

            <div>
              <h1 className="text-2xl font-bold">
                Donor List
              </h1>

              <p className="text-sm text-gray-500">
                Manage donor records
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search name, phone or address"
                className="w-full border rounded-lg pl-9 pr-4 py-2 bg-white"
              />
            </div>

            <button
              onClick={openAddForm}
              className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <FaPlus />
              Add Donor
            </button>
          </div>
        </div>

        {/* TABLE */}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-pink-100 text-pink-700">
                <tr>
                  <Th>Donor</Th>
                  <Th>Phone</Th>
                  <Th>Address</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {filteredDonors.map((donor, index) => (
                  <tr
                    key={donor.id}
                    className={
                      index % 2 ? "bg-white" : "bg-gray-50"
                    }
                  >
                    <Td>
                      <div className="font-medium text-gray-900">
                        {donor.name}
                      </div>
                    </Td>

                    <Td>{donor.phone || "-"}</Td>

                    <Td>{donor.address || "-"}</Td>

                    <Td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          donor.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {donor.status}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(donor)}
                          className="p-2 rounded bg-blue-100 text-blue-700"
                          aria-label="Edit donor"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => handleDelete(donor)}
                          disabled={deleteLoading === donor.id}
                          className="p-2 rounded bg-red-100 text-red-700 disabled:opacity-50"
                          aria-label="Delete donor"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}

                {!loading && filteredDonors.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10 text-gray-500"
                    >
                      No Donors Found
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10 text-gray-500"
                    >
                      Loading donors...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <Modal onClose={() => setShowForm(false)}>
            <DonorForm
              form={form}
              saving={saving}
              editingDonor={editingDonor}
              onSubmit={handleSubmit}
              onChange={setForm}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

/* ================= FORM ================= */

function DonorForm({
  form,
  saving,
  editingDonor,
  onSubmit,
  onChange,
}: {
  form: DonorFormState;

  saving: boolean;

  editingDonor: DonorRecord | null;

  onSubmit: (event: FormEvent) => void;

  onChange: (form: DonorFormState) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="font-semibold text-lg">
        {editingDonor ? "Edit Donor" : "Add Donor"}
      </h2>

      <Input
        label="Donor Name *"
        value={form.name}
        required
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange({ ...form, name: e.target.value })
        }
      />

      <Input
        label="Phone"
        value={form.phone}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange({ ...form, phone: e.target.value })
        }
      />

      <Textarea
        label="Address"
        value={form.address}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          onChange({ ...form, address: e.target.value })
        }
      />

      <Select
        label="Status"
        value={form.status}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...form,
            status: e.target.value as DonorFormState["status"],
          })
        }
        options={["Active", "Inactive"]}
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-green-700 text-white px-5 py-2 rounded-lg disabled:opacity-60"
      >
        {saving
          ? "Saving..."
          : editingDonor
            ? "Update Donor"
            : "Save Donor"}
      </button>
    </form>
  );
}

/* ================= COMPONENTS ================= */

function Input({ label, ...props }: InputProps) {
  return (
    <div>
      <label className="text-sm block mb-1">{label}</label>

      <input
        {...props}
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}

function Select({ label, options, ...props }: SelectProps) {
  return (
    <div>
      <label className="text-sm block mb-1">{label}</label>

      <select
        {...props}
        className="w-full border rounded-lg px-3 py-2"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }: TextareaProps) {
  return (
    <div>
      <label className="text-sm block mb-1">{label}</label>

      <textarea
        {...props}
        rows={3}
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 whitespace-nowrap">{children}</td>
  );
}
