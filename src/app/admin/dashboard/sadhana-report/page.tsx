"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------- TYPES ---------------- */
interface Devotee {
  uid: string;
  firstName: string;
  email: string;
}

interface SadhanaRecord {
  userId: string;
  date: string;
  [key: string]: 0 | 1 | string;
}

/* ---------------- CONSTANTS ---------------- */
const DAILY_MAX_SCORE = 10;

/* ---------------- UTILS ---------------- */
const calculateDailyScore = (record: SadhanaRecord) =>
  Object.entries(record)
    .filter(([, v]) => v === 1)
    .length;

const calculateAveragePercent = (
  total: number,
  days: number
) => {
  if (!days) return 0;
  return Math.round(
    (total / (days * DAILY_MAX_SCORE)) * 100
  );
};

const calculateStreak = (dates: string[]) => {
  const sorted = [...dates].sort().reverse();
  let streak = 0;
  const current = new Date();

  for (const d of sorted) {
    const iso = current.toISOString().split("T")[0];
    if (d === iso) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else break;
  }
  return streak;
};

const getMonthRange = (year: number, month: number) => {
  const start = new Date(year, month, 1)
    .toISOString()
    .split("T")[0];
  const end = new Date(year, month + 1, 0)
    .toISOString()
    .split("T")[0];
  return { start, end };
};

/* ---------------- PAGE ---------------- */
export default function AdminSadhanaReport() {
  const today = new Date();

  const [users, setUsers] = useState<Devotee[]>([]);
  const [records, setRecords] = useState<SadhanaRecord[]>([]);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(false);

  const [detailUser, setDetailUser] =
    useState<Devotee | null>(null);
  const [detailRecords, setDetailRecords] =
    useState<SadhanaRecord[]>([]);

  /* -------- LOAD USERS -------- */
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "devotees"));
      setUsers(
        snap.docs.map((d) => ({
          uid: d.id,
          firstName: d.data().firstName,
          email: d.data().email,
        }))
      );
    };
    loadUsers();
  }, []);

  /* -------- LOAD MONTH DATA -------- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { start, end } = getMonthRange(year, month);

      const q = query(
        collection(db, "sadhana_cards"),
        where("date", ">=", start),
        where("date", "<=", end)
      );

      const snap = await getDocs(q);
      setRecords(
        snap.docs.map((d) => d.data() as SadhanaRecord)
      );
      setLoading(false);
    };
    loadData();
  }, [year, month]);

  /* -------- CALCULATIONS -------- */
  const userRecords = (uid: string) =>
    records.filter((r) => r.userId === uid);

  const totalScore = (uid: string) =>
    userRecords(uid).reduce(
      (s, r) => s + calculateDailyScore(r),
      0
    );

  const avgPercent = (uid: string) =>
    calculateAveragePercent(
      totalScore(uid),
      userRecords(uid).length
    );

  const streak = (uid: string) =>
    calculateStreak(
      userRecords(uid).map((r) => r.date)
    );

  /* -------- EXPORT -------- */
  const exportExcel = () => {
    const rows = users.map((u) => ({
      Name: u.firstName,
      Email: u.email,
      Score: totalScore(u.uid),
      Average: avgPercent(u.uid) + "%",
      Streak: streak(u.uid),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sadhana");
    XLSX.writeFile(wb, "sadhana-report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Name", "Email", "Score", "Avg %", "Streak"]],
      body: users.map((u) => [
        u.firstName,
        u.email,
        totalScore(u.uid),
        avgPercent(u.uid) + "%",
        streak(u.uid),
      ]),
    });
    doc.save("sadhana-report.pdf");
  };


  /* -------- UI -------- */
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        📊 Sadhana Analytics
      </h1>

      {/* FILTER */}
      <div className="flex gap-4 mb-4">
        <select
          value={month}
          onChange={(e) =>
            setMonth(Number(e.target.value))
          }
          className="border px-3 py-2 rounded"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", {
                month: "long",
              })}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) =>
            setYear(Number(e.target.value))
          }
          className="border px-3 py-2 rounded"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-3 rounded"
        >
          Export Excel
        </button>

        <button
          onClick={exportPDF}
          className="bg-red-600 text-white px-3 rounded"
        >
          Export PDF
        </button>

      </div>

      {loading && <p>Loading...</p>}

      {/* TABLE */}
      <table className="w-full border text-sm">
        <thead className="bg-yellow-200">
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Score</th>
            <th className="border p-2">Avg %</th>
            <th className="border p-2">🔥 Streak</th>
            <th className="border p-2">Details</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td className="border p-2">
                {u.firstName}
              </td>
              <td className="border p-2 text-xs">
                {u.email}
              </td>
              <td className="border p-2 text-center">
                {totalScore(u.uid)}
              </td>
              <td className="border p-2 text-center">
                {avgPercent(u.uid)}%
              </td>
              <td className="border p-2 text-center">
                🔥 {streak(u.uid)}
              </td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => {
                    setDetailUser(u);
                    setDetailRecords(
                      userRecords(u.uid)
                    );
                  }}
                  className="text-blue-600"
                >
                  ℹ️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DETAILS MODAL */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[500px] max-h-[80vh] overflow-y-auto">
            <h2 className="font-bold mb-3">
              {detailUser.firstName} – Monthly
              Details
            </h2>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={detailRecords.map((r) => ({
                  date: r.date,
                  score: calculateDailyScore(r),
                }))}
              >
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#15803d"
                />
              </LineChart>
            </ResponsiveContainer>

            {detailRecords.map((r) => (
              <div
                key={r.date}
                className="border p-2 mt-2"
              >
                <strong>{r.date}</strong> – Score{" "}
                {calculateDailyScore(r)}
              </div>
            ))}

            <button
              onClick={() => setDetailUser(null)}
              className="mt-4 w-full bg-yellow-700 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
