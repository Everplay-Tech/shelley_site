"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto text-center">
      <div className="pixel-panel p-8">
        <h1 className="font-pixel text-xs text-shelley-amber crt-glow tracking-wider mb-4">
          ORDER CONFIRMED
        </h1>
        <p className="text-white/50 text-sm mb-6">
          Thank you for your purchase! Your order is being processed.
        </p>
        {sessionId && (
          <p className="font-pixel text-[7px] text-white/20 tracking-wider mb-6 break-all">
            REF: {sessionId}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/shop" className="pixel-btn text-center">
            CONTINUE SHOPPING
          </Link>
          <Link href="/library" className="pixel-btn-ghost text-center">
            MY LIBRARY
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ShopSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="font-pixel text-[8px] text-white/30 tracking-wider animate-pulse">
            LOADING...
          </p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
