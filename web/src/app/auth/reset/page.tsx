"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="font-pixel text-[8px] text-red-400 tracking-wider mb-4">
          INVALID LINK
        </p>
        <p className="text-white/40 text-sm mb-6">
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="pixel-btn-ghost">
          REQUEST NEW LINK
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <p className="font-pixel text-[8px] text-shelley-amber/70 tracking-wider mb-2">
          PASSWORD UPDATED &#10003;
        </p>
        <p className="text-white/50 text-sm">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-white/40 text-sm">
        Enter your new password.
      </p>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="new-password"
          className="font-pixel text-[7px] text-white/30 tracking-wider"
        >
          NEW PASSWORD
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="pixel-input"
          required
          minLength={6}
          aria-required="true"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirm-password"
          className="font-pixel text-[7px] text-white/30 tracking-wider"
        >
          CONFIRM PASSWORD
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="pixel-input"
          required
          minLength={6}
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
        {loading ? "RESETTING..." : "SET NEW PASSWORD"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="pixel-panel p-8 w-full max-w-sm">
        <h1 className="font-pixel text-xs text-shelley-amber crt-glow text-center mb-6 tracking-wider">
          RESET PASSWORD
        </h1>
        <Suspense
          fallback={
            <p className="font-pixel text-[8px] text-white/30 tracking-wider text-center animate-pulse">
              LOADING...
            </p>
          }
        >
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
