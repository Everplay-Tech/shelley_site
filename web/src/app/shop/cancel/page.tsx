"use client";

import Link from "next/link";

export default function ShopCancelPage() {
  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto text-center">
      <div className="pixel-panel p-8">
        <h1 className="font-pixel text-xs text-white/60 tracking-wider mb-4">
          CHECKOUT CANCELLED
        </h1>
        <p className="text-white/40 text-sm mb-6">
          No worries — your cart is waiting whenever you&apos;re ready.
        </p>
        <Link href="/shop" className="pixel-btn text-center inline-block">
          BACK TO SHOP
        </Link>
      </div>
    </div>
  );
}
