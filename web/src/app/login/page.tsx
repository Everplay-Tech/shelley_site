"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, requestMagicLink, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    router.push("/profile");
    return null;
  }

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.ok) {
        router.push("/profile");
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await requestMagicLink(email);
      if (result.ok) {
        setMagicSent(true);
      } else {
        setError(result.error || "Failed to send magic link");
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
          ENTER THE WORKSHOP
        </h1>

        {magicSent ? (
          <div className="text-center">
            <p className="font-pixel text-[8px] text-shelley-amber/70 tracking-wider mb-2">
              CHECK YOUR EMAIL
            </p>
            <p className="text-white/50 text-sm">
              We sent a magic link to{" "}
              <span className="text-white/70">{email}</span>. Click it to sign
              in.
            </p>
            <button
              onClick={() => setMagicSent(false)}
              className="pixel-btn-ghost mt-6"
            >
              TRY AGAIN
            </button>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode("password")}
                className={`flex-1 font-pixel text-[7px] tracking-wider py-2 border-b-2 transition-colors ${
                  mode === "password"
                    ? "border-shelley-amber text-shelley-amber"
                    : "border-transparent text-white/30 hover:text-white/50"
                }`}
              >
                PASSWORD
              </button>
              <button
                type="button"
                onClick={() => setMode("magic")}
                className={`flex-1 font-pixel text-[7px] tracking-wider py-2 border-b-2 transition-colors ${
                  mode === "magic"
                    ? "border-shelley-amber text-shelley-amber"
                    : "border-transparent text-white/30 hover:text-white/50"
                }`}
              >
                MAGIC LINK
              </button>
            </div>

            <form
              onSubmit={
                mode === "password" ? handlePasswordLogin : handleMagicLink
              }
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-email"
                  className="font-pixel text-[7px] text-white/30 tracking-wider"
                >
                  EMAIL
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pixel-input"
                  required
                  aria-required="true"
                />
              </div>

              {mode === "password" && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="login-password"
                    className="font-pixel text-[7px] text-white/30 tracking-wider"
                  >
                    PASSWORD
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pixel-input"
                    required
                    aria-required="true"
                  />
                </div>
              )}

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
                {loading
                  ? "LOADING..."
                  : mode === "password"
                    ? "LOG IN"
                    : "SEND MAGIC LINK"}
              </button>
            </form>

            {mode === "password" && (
              <p className="text-center text-white/30 text-xs mt-2">
                <Link
                  href="/forgot-password"
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  Forgot password?
                </Link>
              </p>
            )}

            <p className="text-center text-white/30 text-xs mt-4">
              No account?{" "}
              <Link
                href="/signup"
                className="text-shelley-amber hover:text-shelley-amber/80 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
