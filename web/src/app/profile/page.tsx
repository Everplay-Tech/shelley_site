"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface RewardTier {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  newlyEarned: boolean;
  reward:
    | { type: "badge"; value: string }
    | { type: "discount"; code: string; percent: number };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [rewards, setRewards] = useState<RewardTier[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/rewards")
        .then((r) => r.json())
        .then((data) => {
          if (data.rewards) setRewards(data.rewards);
        })
        .catch(() => {})
        .finally(() => setRewardsLoading(false));

      fetch("/api/auth/account")
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.hasPassword === "boolean") {
            setHasPassword(data.hasPassword);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-pixel text-[8px] text-white/30 tracking-wider animate-pulse">
          LOADING...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* User Info + Edit Name */}
      <div className="pixel-panel p-6">
        <h1 className="font-pixel text-xs text-shelley-amber crt-glow tracking-wider mb-4">
          {user.displayName ? user.displayName.toUpperCase() : "ADVENTURER"}
        </h1>
        <p className="text-white/40 text-sm mb-4">{user.email}</p>
        <EditDisplayName currentName={user.displayName} />
      </div>

      {/* Rewards */}
      <div className="pixel-panel p-6">
        <h2 className="font-pixel text-[10px] text-shelley-amber/70 tracking-wider mb-4">
          REWARD TIERS
        </h2>

        {rewardsLoading ? (
          <p className="font-pixel text-[7px] text-white/20 tracking-wider animate-pulse">
            LOADING REWARDS...
          </p>
        ) : rewards.length === 0 ? (
          <p className="text-white/30 text-sm">
            Play games to earn rewards!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rewards.map((tier) => (
              <div
                key={tier.id}
                className={`pixel-panel-inset p-4 transition-colors ${
                  tier.earned ? "border-shelley-amber/30" : "opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-pixel text-[8px] text-white/70 tracking-wider">
                    {tier.earned ? "\u2605 " : "\u2606 "}
                    {tier.name.toUpperCase()}
                  </p>
                  {tier.earned && tier.reward.type === "discount" && (
                    <span className="font-pixel text-[7px] text-shelley-amber tracking-wider">
                      {tier.reward.code} ({tier.reward.percent}% OFF)
                    </span>
                  )}
                  {tier.earned && tier.reward.type === "badge" && (
                    <span className="font-pixel text-[7px] text-shelley-amber tracking-wider">
                      BADGE EARNED
                    </span>
                  )}
                </div>
                <p className="text-white/30 text-xs">{tier.description}</p>
                {tier.newlyEarned && (
                  <p className="font-pixel text-[7px] text-shelley-amber mt-1 tracking-wider animate-pulse">
                    NEW!
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link href="/shop" className="pixel-btn-ghost flex-1 text-center">
          SHOP
        </Link>
        <Link href="/library" className="pixel-btn-ghost flex-1 text-center">
          MY LIBRARY
        </Link>
      </div>

      {/* Password Management */}
      <div className="pixel-panel p-6">
        <h2 className="font-pixel text-[10px] text-shelley-amber/70 tracking-wider mb-4">
          {hasPassword ? "CHANGE PASSWORD" : "SET PASSWORD"}
        </h2>
        {hasPassword ? <ChangePassword /> : <SetPassword onSet={() => setHasPassword(true)} />}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={handleLogout} className="pixel-btn-ghost flex-1">
          LOG OUT
        </button>
      </div>
    </div>
  );
}

// ─── Edit Display Name ──────────────────────────────────────────────────────

function EditDisplayName({ currentName }: { currentName: string | null }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_name", displayName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed to update");
      } else {
        setMsg("Updated! Refresh to see changes.");
        setEditing(false);
      }
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-pixel text-[7px] text-white/30 tracking-wider hover:text-white/50 transition-colors"
      >
        EDIT NAME
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-2 mt-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        placeholder="Display name"
        className="pixel-input"
      />
      {msg && (
        <p className="font-pixel text-[7px] text-shelley-amber/70 tracking-wider">
          {msg}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="pixel-btn text-[7px] disabled:opacity-40"
        >
          {loading ? "SAVING..." : "SAVE"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="pixel-btn-ghost text-[7px]"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

// ─── Change Password (has existing password) ────────────────────────────────

function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-pixel text-[7px] text-white/30 tracking-wider hover:text-white/50 transition-colors"
      >
        CHANGE PASSWORD
      </button>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPw.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
        }, 2000);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <p className="font-pixel text-[8px] text-shelley-amber/70 tracking-wider">
        PASSWORD UPDATED &#10003;
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        value={currentPw}
        onChange={(e) => setCurrentPw(e.target.value)}
        placeholder="Current password"
        className="pixel-input"
        required
      />
      <input
        type="password"
        value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        placeholder="New password"
        className="pixel-input"
        required
        minLength={6}
      />
      <input
        type="password"
        value={confirmPw}
        onChange={(e) => setConfirmPw(e.target.value)}
        placeholder="Confirm new password"
        className="pixel-input"
        required
        minLength={6}
      />
      {error && (
        <p role="alert" className="font-pixel text-[7px] text-red-400 tracking-wider">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="pixel-btn text-[7px] disabled:opacity-40"
        >
          {loading ? "UPDATING..." : "UPDATE"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="pixel-btn-ghost text-[7px]"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

// ─── Set Password (magic-link-only accounts) ────────────────────────────────

function SetPassword({ onSet }: { onSet: () => void }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPw.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_password", newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        onSet();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-white/30 text-xs">
        You signed up with a magic link. Set a password to also log in with email + password.
      </p>
      <input
        type="password"
        value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        placeholder="Choose a password"
        className="pixel-input"
        required
        minLength={6}
      />
      <input
        type="password"
        value={confirmPw}
        onChange={(e) => setConfirmPw(e.target.value)}
        placeholder="Confirm password"
        className="pixel-input"
        required
        minLength={6}
      />
      {error && (
        <p role="alert" className="font-pixel text-[7px] text-red-400 tracking-wider">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="pixel-btn text-[7px] disabled:opacity-40"
      >
        {loading ? "SETTING..." : "SET PASSWORD"}
      </button>
    </form>
  );
}
