"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      {/* User Info */}
      <div className="pixel-panel p-6">
        <h1 className="font-pixel text-xs text-shelley-amber crt-glow tracking-wider mb-4">
          {user.displayName ? user.displayName.toUpperCase() : "ADVENTURER"}
        </h1>
        <p className="text-white/40 text-sm">{user.email}</p>
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

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={handleLogout} className="pixel-btn-ghost flex-1">
          LOG OUT
        </button>
      </div>
    </div>
  );
}
