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

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

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

/* ================= PAGE ================= */

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-5">
          Loading...
        </div>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}

/* ================= CONTENT ================= */

function ExpensesContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const monthParam =
    Number(
      searchParams.get("month")
    ) || 0;

  const deptParam = searchParams.get("dept") || null;

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

  /* ================= MONTHLY EXPENSES ================= */

  const expenses = useMemo(() => {
    return transactions.filter(
      (item) => {
        if (
          item.type !== "Debit"
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

  /* ================= TOTAL EXPENSE ================= */

  const totalExpense =
    useMemo(() => {
      return expenses.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );
    }, [expenses]);

  /* ================= DEPARTMENT WISE ================= */

  const departmentWiseExpense =
    useMemo(() => {
      const result: Record<
        string,
        number
      > = {};

      expenses.forEach((item) => {
        const dept =
          item.dept ||
          "No Department";

        if (!result[dept]) {
          result[dept] = 0;
        }

        result[dept] += item.amount;
      });

      return Object.entries(
        result
      ).sort(
        (a, b) => b[1] - a[1]
      );
    }, [expenses]);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* HEADER */}

        <div className="flex items-center gap-3">
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
              {MONTHS[monthParam]} Expenses
              {deptParam ? ` — ${deptParam}` : ""}
            </h1>

            <p className="text-sm text-gray-500">
              {deptParam ? (
                <>Department Expense: ₹ {departmentWiseExpense.find(([d]) => d === deptParam)?.[1] ?? 0}</>
              ) : (
                <>Total Expense: ₹ {totalExpense}</>
              )}
            </p>
          </div>

          {deptParam && (
            <div className="ml-auto">
              <button
                onClick={() =>
                  router.push(`/user/admin/account/expenses?month=${monthParam}`)
                }
                className="px-3 py-2 bg-white border rounded"
              >
                Clear Department
              </button>
            </div>
          )}
        </div>

        {/* DEPARTMENT SUMMARY */}

        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">
            Department Wise
            Expense
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {departmentWiseExpense.map(
              ([dept, amount]) => (
                <div
                  key={dept}
                  className="border rounded-xl p-4 bg-red-50 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm text-gray-600">
                      {dept}
                    </div>

                    <div className="text-2xl font-bold text-red-700 mt-2">
                      ₹ {amount}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() =>
                        router.push(
                          `/user/admin/account/expenses?month=${monthParam}&dept=${encodeURIComponent(dept)}`
                        )
                      }
                      className="p-2 bg-white rounded border"
                    >
                      <FaArrowRight />
                    </button>
                  </div>
                </div>
              )
            )}

            {!loading &&
              departmentWiseExpense.length ===
                0 && (
                <div className="text-gray-500">
                  No Expense Data
                </div>
              )}
          </div>
        </div>

        {/* TABLE */}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-100 text-red-700">
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
                {(deptParam ? expenses.filter(e => e.dept === deptParam) : expenses).map(
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
                  expenses.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-gray-500"
                      >
                        No Expenses
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