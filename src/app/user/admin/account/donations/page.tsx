"use client";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { FaArrowLeft } from "react-icons/fa";

/* ================= TYPES ================= */

interface Transaction {
  id: string;
  dept: string;
  devoteeName: string;
  amount: number;
  date: string;
  type: "Credit" | "Debit";
  paymentType: "Online" | "Cash";
  purpose: string;
  remarks: string;
}

/* ================= MONTHS ================= */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ================= MAIN PAGE ================= */

export default function DonationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-5">
          Loading...
        </div>
      }
    >
      <DonationsContent />
    </Suspense>
  );
}

/* ================= CONTENT ================= */

function DonationsContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const monthParam =
    Number(
      searchParams.get("month")
    ) || 0;

  const [loading, setLoading] =
    useState(true);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  /* ================= FETCH ================= */

  const fetchData = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "accountTransactions"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const list: Transaction[] =
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<
            Transaction,
            "id"
          >),
        }));

      setTransactions(list);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= DONATIONS ================= */

  const donations = useMemo(() => {
    return transactions.filter(
      (item) => {
        if (
          item.type !== "Credit"
        )
          return false;

        if (!item.date)
          return false;

        const month =
          new Date(
            item.date
          ).getMonth();

        return month === monthParam;
      }
    );
  }, [
    transactions,
    monthParam,
  ]);

  /* ================= TOTAL ================= */

  const totalDonation =
    useMemo(() => {
      return donations.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );
    }, [donations]);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() =>
              router.back()
            }
            className="p-2 rounded bg-white border"
          >
            <FaArrowLeft />
          </button>

          <div>
            <h1 className="text-2xl font-bold">
              {MONTHS[monthParam]}{" "}
              Donations
            </h1>

            <p className="text-sm text-gray-500">
              Total Donation: ₹{" "}
              {totalDonation}
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100 text-green-700">
                <tr>
                  <Th>
                    Devotee
                  </Th>
                  <Th>
                    Department
                  </Th>
                  <Th>
                    Amount
                  </Th>
                  <Th>Date</Th>
                  <Th>
                    Payment
                  </Th>
                  <Th>
                    Purpose
                  </Th>
                  <Th>
                    Remarks
                  </Th>
                </tr>
              </thead>

              <tbody>
                {donations.map(
                  (item, index) => (
                    <tr
                      key={item.id}
                      className={
                        index % 2
                          ? "bg-white"
                          : "bg-gray-50"
                      }
                    >
                      <Td>
                        {
                          item.devoteeName
                        }
                      </Td>

                      <Td>
                        {item.dept}
                      </Td>

                      <Td>
                        ₹{" "}
                        {
                          item.amount
                        }
                      </Td>

                      <Td>
                        {item.date}
                      </Td>

                      <Td>
                        {
                          item.paymentType
                        }
                      </Td>

                      <Td>
                        {
                          item.purpose
                        }
                      </Td>

                      <Td>
                        {
                          item.remarks
                        }
                      </Td>
                    </tr>
                  )
                )}

                {!loading &&
                  donations.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-gray-500"
                      >
                        No Donations
                        Found
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= TABLE ================= */

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="text-left px-4 py-3 whitespace-nowrap">
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
    <td className="px-4 py-3 whitespace-nowrap">
      {children}
    </td>
  );
}