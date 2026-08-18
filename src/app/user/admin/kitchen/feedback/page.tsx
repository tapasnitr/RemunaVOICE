"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import BackPageName from "@/components/BackHeaderButton";

export default function MenuFeedbackPage() {
  const [text, setText] = useState("");

  const save = async () => {
    await addDoc(collection(db, "menu_feedback"), {
      date: new Date().toISOString().split("T")[0],
      feedback: text,
      createdAt: new Date(),
    });
    setText("");
    alert("Feedback saved");
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <BackPageName title="Kitchen Feedback" link="/kitchen" />

      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Salt less / masala high / quantity low..."
        className="w-full border p-3 rounded"
      />

      <button
        onClick={save}
        className="w-full bg-green-700 text-white py-2 rounded"
      >
        Submit Feedback
      </button>
    </div>
  );
}
