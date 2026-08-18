"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AddUser from "./AddUser";
import EditUser from "./EditUser";

/* ================= TYPES ================= */

interface Devotee {
  uid: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  dob?: string;

  batchId?: string;
  batchName?: string;

  features: Record<string, boolean>;
  adminFeatures: string[];
}

/* ================= PAGE ================= */

export default function AdminUserList() {
  const [users, setUsers] = useState<Devotee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<Devotee | null>(null);
  const [viewUser, setViewUser] = useState<Devotee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);

  /* ---------- FETCH ---------- */
  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "devotees"));
    setUsers(
      snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      }))
    );
    setLoading(false);
  };

  const fetchBatches = async () => {
    const snap = await getDocs(collection(db, "batches"));
    setBatches(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
    );
  };

  useEffect(() => {
    fetchUsers();
    fetchBatches();
  }, []);

  /* ---------- DELETE ---------- */
  const handleDelete = async (u: Devotee) => {
    if (!confirm("Delete user?")) return;

    await deleteDoc(doc(db, "devotees", u.uid));
    setUsers((prev) => prev.filter((x) => x.uid !== u.uid));
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Users</h2>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          + Add
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-yellow-700 text-white">
          <tr>
            <th className="p-2">Name</th>
            <th>Email</th>
            <th>Batch</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u, i) => (
            <tr key={u.uid} className={i % 2 ? "bg-white" : "bg-yellow-50"}>
              <td className="p-2">
                {u.firstName} {u.lastName}
              </td>
              <td>{u.email}</td>
              <td className="text-green-700">{u.batchName || "-"}</td>

              <td>
                <div className="flex gap-2 justify-center">

                  <button
                    onClick={() => setViewUser(u)}
                    className="bg-gray-100 px-2 py-1 rounded"
                  >
                    View
                  </button>

                  <button
                    onClick={() => setEditUser(u)}
                    className="bg-blue-100 px-2 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(u)}
                    className="bg-red-100 px-2 py-1 rounded"
                  >
                    Delete
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD */}
      {isModalOpen && (
        <AddUser
          onClose={() => setIsModalOpen(false)}
          fetchUsers={fetchUsers}
        />
      )}

      {/* EDIT */}
      {editUser && (
        <EditUser
          user={editUser}
          batches={batches}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* VIEW */}
      {viewUser && (
        <Modal>
          <h3 className="font-bold text-lg mb-3">User Details</h3>

          <p><b>Name:</b> {viewUser.firstName} {viewUser.lastName}</p>
          <p><b>Email:</b> {viewUser.email}</p>
          <p><b>Phone:</b> {viewUser.phone || "-"}</p>
          <p><b>DOB:</b> {viewUser.dob || "-"}</p>
          <p><b>Batch:</b> {viewUser.batchName || "-"}</p>

          {/* USER FEATURES */}
          <div className="mt-4">
            <p className="font-semibold mb-1">User Features:</p>

            <div className="flex flex-wrap gap-2">
              {viewUser.features &&
                Object.keys(viewUser.features).filter((f) => viewUser.features[f]).length > 0 ? (
                Object.keys(viewUser.features)
                  .filter((f) => viewUser.features[f])
                  .map((f) => (
                    <span
                      key={f}
                      className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs"
                    >
                      {f}
                    </span>
                  ))
              ) : (
                <span className="text-gray-500 text-sm">No features assigned</span>
              )}
            </div>
          </div>

          {/* ADMIN FEATURES */}
          <div className="mt-4">
            <p className="font-semibold mb-1">Admin Permissions:</p>

            <div className="flex flex-wrap gap-2">
              {viewUser.adminFeatures?.length > 0 ? (
                viewUser.adminFeatures.map((af) => (
                  <span
                    key={af}
                    className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                  >
                    {af}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No admin access</span>
              )}
            </div>
          </div>

          <div className="mt-5 text-right">
            <button
              onClick={() => setViewUser(null)}
              className="border px-4 py-2 rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* MODAL */
function Modal({ children }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-[400px]">{children}</div>
    </div>
  );
}