"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="pixel-panel p-8 w-full max-w-sm">
        <h1 className="font-pixel text-xs text-shelley-amber crt-glow text-center mb-6 tracking-wider">
          FORGOT PASSWORD
        </h1>

        {sent ? (
          <div className="text-center">
            <p className="font-pixel text-[8px] text-shelley-amber/70 tracking-wider mb-2">
              CHECK YOUR EMAIL
            </p>
            <p className="text-white/50 text-sm">
              If an account exists for{" "}
              <span className="text-white/70">{email}</span>, we sent a
              password reset link. Check your inbox.
            </p>
            <Link href="/login" className="pixel-btn-ghost mt-6 inline-block">
              BACK TO LOGIN
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-white/40 text-sm">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reset-email"
                className="font-pixel text-[7px] text-white/30 tracking-wider"
              >
                EMAIL
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pixel-input"
                required
                aria-required="true"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="font-pixel text-[7px] text-red-400 tracking-wider"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pixel-btn mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>

            <p className="text-center text-white/30 text-xs mt-2">
              <Link
                href="/login"
                className="text-shelley-amber hover:text-shelley-amber/80 transition-colors"
              >
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
