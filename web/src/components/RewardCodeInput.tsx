"use client";

import { useState } from "react";

interface RewardCodeInputProps {
  value: string;
  onChange: (code: string) => void;
}

export default function RewardCodeInput({
  value,
  onChange,
}: RewardCodeInputProps) {
  const [input, setInput] = useState(value);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rewards");
      const data = await res.json();

      if (!data.rewards) {
        setError("COULD NOT VERIFY");
        return;
      }

      // Check if user has earned this reward code
      const code = input.trim().toUpperCase();
      const earned = data.rewards.some(
        (r: { earned: boolean; reward: { type: string; code?: string } }) =>
          r.earned &&
          r.reward.type === "discount" &&
          r.reward.code === code
      );

      if (earned) {
        onChange(code);
        setValidated(true);
        setError("");
      } else {
        setError("CODE NOT EARNED");
        setValidated(false);
      }
    } catch {
      setError("NETWORK ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    onChange("");
    setValidated(false);
    setError("");
  };

  if (validated) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-pixel text-[7px] text-shelley-amber tracking-wider">
          {input} APPLIED
        </span>
        <button
          onClick={handleClear}
          className="font-pixel text-[6px] text-white/30 tracking-wider hover:text-white/50"
        >
          CLEAR
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        placeholder="REWARD CODE"
        maxLength={20}
        className="pixel-input text-[7px] w-28"
      />
      <button
        onClick={handleApply}
        disabled={loading || !input.trim()}
        className="pixel-btn-ghost text-[7px] disabled:opacity-40"
      >
        {loading ? "..." : "APPLY"}
      </button>
      {error && (
        <span className="font-pixel text-[6px] text-red-400 tracking-wider">
          {error}
        </span>
      )}
    </div>
  );
}
