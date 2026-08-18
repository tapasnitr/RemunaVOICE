"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import AddTransaction from "./AddTransaction";
import EditTransaction from "./EditTransaction";
import TransactionsTable from "./TransactionsTable";

import Modal from "@/components/Modal";

import {
  FaArrowRight,
  FaPlus,
  FaDownload,
} from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

export interface Transaction {
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

export default function TransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [showAdd, setShowAdd] =
    useState<boolean>(false);

  const [editingData, setEditingData] =
    useState<Transaction | null>(null);

  /* ================= MONTH FILTER ================= */

  const currentMonth =
    new Date().getMonth();

  const [selectedMonth, setSelectedMonth] =
    useState<number>(currentMonth);

  /* ================= FETCH ================= */

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "accountTransactions"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const list: Transaction[] = snap.docs.map(
        (doc) => ({
          id: doc.id,

          ...(doc.data() as Omit<
            Transaction,
            "id"
          >),
        })
      );

      setTransactions(list);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* ================= MONTHLY TRANSACTIONS ================= */

  const monthlyTransactions =
    useMemo(() => {
      return transactions.filter(
        (item) => {
          if (!item.date)
            return false;

          const month =
            new Date(
              item.date
            ).getMonth();

          return (
            month === selectedMonth
          );
        }
      );
    }, [
      transactions,
      selectedMonth,
    ]);

  /* ================= MONTHLY DONATION ================= */

  const monthlyDonation =
    useMemo(() => {
      return monthlyTransactions
        .filter(
          (t) => t.type === "Credit"
        )
        .reduce(
          (sum, t) => sum + t.amount,
          0
        );
    }, [monthlyTransactions]);

  /* ================= MONTHLY EXPENSE ================= */

  const monthlyExpense =
    useMemo(() => {
      return monthlyTransactions
        .filter(
          (t) => t.type === "Debit"
        )
        .reduce(
          (sum, t) => sum + t.amount,
          0
        );
    }, [monthlyTransactions]);

  /* ================= TOTAL BALANCE ================= */

  const totalBalance = useMemo(() => {
    return transactions.reduce(
      (sum, t) => {
        return t.type === "Credit"
          ? sum + t.amount
          : sum - t.amount;
      },
      0
    );
  }, [transactions]);

  /* ================= EXPORT PDF ================= */

  const exportMonthlyPDF = () => {
    try {
      const doc = new jsPDF();

      const monthName = MONTHS[selectedMonth];

      // Totals
      const totalIncoming = monthlyTransactions
        .filter((t) => t.type === "Credit")
        .reduce((s, t) => s + t.amount, 0);

      const totalExpenditure = monthlyTransactions
        .filter((t) => t.type === "Debit")
        .reduce((s, t) => s + t.amount, 0);

      const cashLeft = monthlyTransactions
        .filter((t) => t.paymentType === "Cash")
        .reduce((s, t) => (t.type === "Credit" ? s + t.amount : s - t.amount), 0);

      const onlineLeft = monthlyTransactions
        .filter((t) => t.paymentType === "Online")
        .reduce((s, t) => (t.type === "Credit" ? s + t.amount : s - t.amount), 0);

      // Group by department and collect transactions per dept
      const deptMap: Record<string, { credit: number; debit: number }> = {};
      const deptTx: Record<string, Transaction[]> = {};

      monthlyTransactions.forEach((t) => {
        const d = t.dept || "Unspecified";
        if (!deptMap[d]) deptMap[d] = { credit: 0, debit: 0 };
        if (!deptTx[d]) deptTx[d] = [];
        deptTx[d].push(t);

        if (t.type === "Credit") deptMap[d].credit += t.amount;
        else deptMap[d].debit += t.amount;
      });

      // Title and overall summary
      doc.setFontSize(14);
      doc.text(`Monthly Transactions Report - ${monthName}`, 14, 20);

      doc.setFontSize(11);
      doc.text(`Total Incoming: Rs. ${totalIncoming}`, 14, 30);
      doc.text(`Total Expenditure: Rs. ${totalExpenditure}`, 14, 36);
      doc.text(`Net: Rs. ${totalIncoming - totalExpenditure}`, 14, 42);
      doc.text(`Cash Left: Rs. ${cashLeft}`, 14, 48);
      doc.text(`Online Left: Rs. ${onlineLeft}`, 14, 54);

      // Department summary table
      const deptRows = Object.entries(deptMap).map(([dept, v]) => [dept, `Rs. ${v.credit}`, `Rs. ${v.debit}`, `Rs. ${v.credit - v.debit}`]);

      autoTable(doc, {
        startY: 62,
        head: [["Department", "Credit", "Debit", "Net"]],
        body: deptRows,
        styles: { fontSize: 10 },
      });

      // Detailed transactions per department
      const depts = Object.keys(deptTx).sort();
      for (const dept of depts) {
        const finalY = (doc as any).lastAutoTable?.finalY || 0;
        const startY = finalY + 10;

        doc.setFontSize(12);
        doc.text(`${dept} - Transactions`, 14, startY);

        const txBody = deptTx[dept]
          .sort((a, b) => (a.date < b.date ? -1 : 1))
          .map((t) => [
            t.date,
            t.devoteeName || "-",
            t.type,
            t.paymentType,
            `Rs. ${t.amount}`,
            t.purpose || "-",
            t.remarks || "-",
          ]);

        autoTable(doc, {
          startY: startY + 6,
          head: [["Date", "Name", "Type", "Payment", "Amount", "Purpose", "Remarks"]],
          body: txBody,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [230, 230, 230] },
          margin: { left: 14, right: 14 },
        });
      }

      doc.save(`transactions-report-${monthName}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };

  /* ================= ONLINE BALANCE ================= */

  const onlineBalance = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.paymentType === "Online"
      )
      .reduce((sum, t) => {
        return t.type === "Credit"
          ? sum + t.amount
          : sum - t.amount;
      }, 0);
  }, [transactions]);

  /* ================= CASH BALANCE ================= */

  const cashBalance = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.paymentType === "Cash"
      )
      .reduce((sum, t) => {
        return t.type === "Credit"
          ? sum + t.amount
          : sum - t.amount;
      }, 0);
  }, [transactions]);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Account Transactions
            </h1>

            <p className="text-sm text-gray-500">
              Manage temple donations &
              expenses
            </p>
          </div>

          <div className="flex gap-3">
            {/* MONTH */}

            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(
                  Number(
                    e.target.value
                  )
                )
              }
              className="border rounded-lg px-4 py-2 bg-white"
            >
              {MONTHS.map(
                (month, index) => (
                  <option
                    key={month}
                    value={index}
                  >
                    {month}
                  </option>
                )
              )}
            </select>

            {/* DOWNLOAD REPORT */}
            <button
              onClick={() => exportMonthlyPDF()}
              className="bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2"
            >
              <FaDownload />
              Download Report
            </button>

            {/* ADD */}

            <button
              onClick={() =>
                setShowAdd(true)
              }
              className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaPlus />

              Add Transaction
            </button>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* DONATION */}

          <Card
            title="Donation"
            amount={monthlyDonation}
            color="bg-green-100 text-green-700"
            onClick={() =>
              router.push(
                `/user/admin/account/donations?month=${selectedMonth}`
              )
            }
            showArrow
          />

          {/* EXPENSE */}

          <Card
            title="Expense"
            amount={monthlyExpense}
            color="bg-red-100 text-red-700"
            onClick={() =>
              router.push(
                `/user/admin/account/expenses?month=${selectedMonth}`
              )
            }
            showArrow
          />

          {/* TOTAL BALANCE */}

          <Card
            title="Balance"
            amount={totalBalance}
            color="bg-blue-100 text-blue-700"
          />

          {/* ONLINE */}

          <Card
            title="Online"
            amount={onlineBalance}
            color="bg-purple-100 text-purple-700"
          />

          {/* CASH */}

          <Card
            title="Cash"
            amount={cashBalance}
            color="bg-orange-100 text-orange-700"
          />
        </div>

        {/* TABLE */}

        <TransactionsTable
          data={monthlyTransactions}
          loading={loading}
          onEdit={(item) =>
            setEditingData(item)
          }
          onSuccess={fetchTransactions}
        />

        {/* ADD MODAL */}

        {showAdd && (
          <Modal
            onClose={() =>
              setShowAdd(false)
            }
          >
            <AddTransaction
              onSuccess={() => {
                fetchTransactions();

                setShowAdd(false);
              }}
            />
          </Modal>
        )}

        {/* EDIT MODAL */}

        {editingData && (
          <Modal
            onClose={() =>
              setEditingData(null)
            }
          >
            <EditTransaction
              data={editingData}
              onClose={() =>
                setEditingData(null)
              }
              onSuccess={() => {
                fetchTransactions();

                setEditingData(null);
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

/* ================= CARD ================= */

function Card({
  title,
  amount,
  color,
  onClick,
  showArrow = false,
}: {
  title: string;

  amount: number;

  color: string;

  onClick?: () => void;

  showArrow?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 ${color} ${
        showArrow
          ? "cursor-pointer hover:scale-[1.02] transition"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {title}
        </div>

        {showArrow && (
          <FaArrowRight className="text-sm" />
        )}
      </div>

      <div className="text-2xl font-bold mt-2">
        Rs. {amount}
      </div>
    </div>
  );
}