"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.push("/profile");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await signup(email, password, displayName || undefined);
      if (result.ok) {
        router.push("/profile");
      } else {
        setError(result.error || "Signup failed");
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
          JOIN THE CREW
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="signup-name"
              className="font-pixel text-[7px] text-white/30 tracking-wider"
            >
              DISPLAY NAME
            </label>
            <input
              id="signup-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name (optional)"
              className="pixel-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="signup-email"
              className="font-pixel text-[7px] text-white/30 tracking-wider"
            >
              EMAIL
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pixel-input"
              required
              aria-required="true"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="signup-password"
              className="font-pixel text-[7px] text-white/30 tracking-wider"
            >
              PASSWORD
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="pixel-input"
              required
              aria-required="true"
              minLength={6}
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
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-shelley-amber hover:text-shelley-amber/80 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
