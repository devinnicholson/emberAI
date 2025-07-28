// src/components/Sidebar.jsx
import { useState } from "react";

export default function Sidebar({ onSearch, onFilter }) {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-4">
      <input
        className="w-full p-2 border rounded"
        placeholder="Search fires…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(q)}
      />
      <button
        className="w-full bg-primary text-white py-2 rounded"
        onClick={() => onSearch(q)}>
        Search
      </button>
      <label className="block text-sm font-medium">
        Min Confidence: {/*display current if you like*/}
      </label>
      <input
        type="range"
        min="0"
        max="100"
        onChange={(e) => onFilter(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
