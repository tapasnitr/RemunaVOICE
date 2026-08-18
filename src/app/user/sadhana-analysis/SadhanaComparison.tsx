"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RankItem {
  userId: string;
  name: string;
  score: number;
}

export default function SadhanaComparison({
  ranking,
  myUserId,
}: {
  ranking: RankItem[];
  myUserId: string;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-center">
        🏆 Top Devotees (Monthly)
      </h3>

      {ranking.slice(0, 5).map((r, i) => (
        <div
          key={r.userId}
          className={`flex justify-between p-3 rounded shadow ${
            r.userId === myUserId
              ? "bg-blue-100 border border-blue-400"
              : "bg-white"
          }`}
        >
          <span>
            {i + 1}. {r.name} {r.userId === myUserId && "(You)"}
          </span>
          <span className="font-bold text-indigo-700">
            {r.score}
          </span>
        </div>
      ))}

      <div className="bg-white p-4 rounded shadow">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={ranking.slice(0, 5)}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
