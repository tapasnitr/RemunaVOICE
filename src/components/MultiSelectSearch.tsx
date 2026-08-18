"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  label: string;
  value: string;
}

export default function MultiSelectSearch({
  options,
  value,
  onChange,
  placeholder = "Select devotees",
}: {
  options: Option[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* INPUT */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-yellow-300 rounded px-3 py-2 text-left bg-white"
      >
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.map((v) => (
              <span
                key={v}
                className="bg-yellow-200 text-yellow-900 text-xs px-2 py-0.5 rounded"
              >
                {options.find((o) => o.value === v)?.label || v}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-yellow-600">{placeholder}</span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-yellow-300 rounded shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search devotee..."
            className="w-full px-3 py-2 border-b border-yellow-200 focus:outline-none"
          />

          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No results
              </div>
            )}

            {filtered.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2 px-3 py-2 hover:bg-yellow-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(o.value)}
                  onChange={() => toggle(o.value)}
                />
                <span className="text-sm">{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
