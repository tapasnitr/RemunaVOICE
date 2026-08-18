"use client";

import {
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

import { useState } from "react";

import { Transaction } from "./page";

interface Props {
  data: Transaction[];

  loading: boolean;

  onEdit: (item: Transaction) => void;

  onSuccess: () => void;
}

export default function TransactionsTable({
  data,
  loading,
  onEdit,
  onSuccess,
}: Props) {
  const [page, setPage] =
    useState<number>(1);

  const [deleteLoading, setDeleteLoading] =
    useState<string>("");

  const PER_PAGE = 50;

  const totalPages = Math.ceil(
    data.length / PER_PAGE
  );

  const paginated = data.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  const handleDelete = async (
    id: string
  ) => {
    try {
      const confirmDelete = window.confirm(
        "Delete this transaction?"
      );

      if (!confirmDelete) return;

      setDeleteLoading(id);

      await deleteDoc(
        doc(db, "accountTransactions", id)
      );

      onSuccess();
    } catch (error) {
      console.log(error);

      alert("Delete failed");
    }

    setDeleteLoading("");
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-green-50">
            <tr>
              <Th>Name</Th>

              <Th>Dept</Th>

              <Th>Amount</Th>

              <Th>Type</Th>

              <Th>Payment</Th>

              <Th>Date</Th>

              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((item) => (
              <tr
                key={item.id}
                className="border-t"
              >
                <Td>{item.devoteeName}</Td>

                <Td>{item.dept}</Td>

                <Td>
                  ₹ {item.amount}
                </Td>

                <Td>{item.type}</Td>

                <Td>
                  {item.paymentType}
                </Td>

                <Td>{item.date}</Td>

                <Td>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onEdit(item)
                      }
                      className="p-2 rounded bg-blue-100 text-blue-700"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      disabled={
                        deleteLoading === item.id
                      }
                      className="p-2 rounded bg-red-100 text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}

      <div className="flex justify-between items-center p-4 border-t">
        <button
          disabled={page === 1}
          onClick={() =>
            setPage((prev) => prev - 1)
          }
          className="px-4 py-2 bg-gray-100 rounded"
        >
          Previous
        </button>

        <div>
          {page} / {totalPages || 1}
        </div>

        <button
          disabled={
            page === totalPages
          }
          onClick={() =>
            setPage((prev) => prev + 1)
          }
          className="px-4 py-2 bg-gray-100 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="text-left px-4 py-3">
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-3">
      {children}
    </td>
  );
}