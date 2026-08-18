"use client";

import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BackHeader from "@/components/BackHeader";

export default function AdminDailyQuote() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!text && !file) return alert("Add quote or image");

    setLoading(true);
    let imageUrl = "";

    try {
      if (file) {
        const imgRef = ref(storage, `daily-quotes/current.jpg`);
        await uploadBytes(imgRef, file);
        imageUrl = await getDownloadURL(imgRef);
      }

      await setDoc(doc(db, "daily_quote", "current"), {
        text,
        imageUrl,
        updatedAt: serverTimestamp(),
      });

      alert("Quote updated successfully 🙏");
      setText("");
      setFile(null);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <BackHeader title="Daily Quote Upload" />

      <div className="max-w-md mx-auto p-4 space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Śrīla Prabhupāda quote..."
          className="w-full border rounded p-2 text-sm"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-yellow-700 text-white py-2 rounded"
        >
          {loading ? "Uploading..." : "Upload Quote"}
        </button>
      </div>
    </div>
  );
}
