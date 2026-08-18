"use client";

import React from "react";

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

export default function Input({
  label,
  value,
  onChange,
  type = "text",
}: InputProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm mb-1 font-medium">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
    </div>
  );
}