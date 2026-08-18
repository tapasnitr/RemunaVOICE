"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------------- TYPES ---------------- */
interface RankItem {
  userId: string;
  name: string;
  score: number;
}

export default function SadhanaRanking({
  ranking,
  myUserId,
  myRank,
}: {
  ranking: RankItem[];
  myUserId: string;
  myRank: number | null;
}) {
  return (
    <div className="px-4 space-y-4">
      <h3 className="font-bold text-lg text-center">
        🏆 Top Devotees (This Month)
      </h3>

      {/* LIST */}
      {ranking.slice(0, 5).map((r, i) => {
        const isMe = r.userId === myUserId;
        return (
          <div
            key={r.userId}
            className={`flex justify-between items-center p-3 rounded shadow ${
              isMe
                ? "bg-blue-100 border border-blue-400"
                : "bg-white"
            }`}
          >
            <span className="font-semibold">
              {i + 1}. {r.name}
              {isMe && " (You)"}
            </span>
            <span className="font-bold text-indigo-700">
              {r.score}
            </span>
          </div>
        );
      })}

      {/* COMPARISON GRAPH */}
      <div className="bg-white p-4 rounded shadow">
        <h4 className="font-semibold mb-2">
          Top 5 Comparison
        </h4>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ranking.slice(0, 5)}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ENCOURAGEMENT */}
      <div className="text-center text-sm font-medium text-gray-700">
        {myRank && myRank <= 3
          ? "🌸 Wonderful consistency! You inspire others."
          : "💪 You are improving steadily. One more push to reach Top 5!"}
      </div>
    </div>
  );
}
