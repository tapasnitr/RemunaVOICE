"use client";

/* ---------- TYPES ---------- */
interface SadhanaRecord {
  userId: string;
  date: string;

  // Soul
  japaBefore10?: number;
  personalHearing1hr?: number;
  spBookReading1hr?: number;
  bookReadingAttended?: number;
  slokaLearnt?: number;

  // Body
  dayRestBelow30?: number;
  sleptBeforeTime?: number;
  wakeUpBeforeTime?: number;
  studyOrPreaching1hr?: number;
}

interface Props {
  record: SadhanaRecord;
  onClose: () => void;
}

/* ---------- UTILS ---------- */
const formatDateIN = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

/* ---------- COMPONENT ---------- */
export default function SadhanaDayDetailsModal({
  record,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[360px] p-5 rounded shadow">
        <h3 className="font-bold mb-3">
          Sadhana Details – {formatDateIN(record.date)}
        </h3>

        {/* DETAILS */}
        {(
          Object.entries(record) as [
            keyof SadhanaRecord,
            SadhanaRecord[keyof SadhanaRecord]
          ][]
        )
          .filter(
            ([k]) => k !== "userId" && k !== "date"
          )
          .map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b py-1 text-sm"
            >
              <span className="capitalize">
                {String(k).replace(/([A-Z])/g, " $1")}
              </span>
              <span>
                {v === 1 ? "Yes" : "No"}
              </span>
            </div>
          ))}

        <button
          onClick={onClose}
          className="mt-4 w-full bg-yellow-700 text-white py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
