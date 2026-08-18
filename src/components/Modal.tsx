"use client";

import React from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void; // 🔥 optional close handler
}

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
      onClick={onClose} // 🔥 click outside to close
    >
      <div
        className="bg-white p-6 rounded w-[400px] max-h-[90vh] overflow-y-auto shadow-lg relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* ❌ CLOSE BUTTON */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-red-600 text-lg font-bold"
          >
            ✕
          </button>
        )}

        {children}
      </div>
    </div>
  );
}