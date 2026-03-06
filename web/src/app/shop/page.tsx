"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import RewardCodeInput from "@/components/RewardCodeInput";
import { useAuth } from "@/hooks/useAuth";

/* ─── Po Pose System (Tom Goes to the Mayor style) ─────────────────────────── */

const PO_POSES = [
  "/sprites/po/shop/po_neutral.png",   // 0: neutral (default)
  "/sprites/po/shop/po_talking.png",    // 1: talking (text changes)
  "/sprites/po/shop/po_arms_out.png",   // 2: arms out (click reaction)
  "/sprites/po/shop/po_arms_up.png",    // 3: arms up (click reaction)
] as const;

type PoseIndex = 0 | 1 | 2 | 3;

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Product {
  id: number;
  name: string;
  description: string;
  product_type: "physical" | "digital";
  content_type: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  metadata: Record<string, unknown>;
}

/* ─── Shelf Item ─────────────────────────────────────────────────────────── */

function ShelfItem({
  product,
  onBuy,
  loading,
  hasRewardCode,
}: {
  product: Product;
  onBuy: () => void;
  loading: boolean;
  hasRewardCode: boolean;
}) {
  const price = (product.price_cents / 100).toFixed(2);

  return (
    <button
      onClick={onBuy}
      disabled={loading}
      className="group flex flex-col items-center gap-1 cursor-pointer disabled:opacity-40"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 pixel-panel-inset flex items-center justify-center overflow-hidden transition-all group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(255,191,0,0.4)]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <span className="font-pixel text-[8px] text-white/15">?</span>
        )}
      </div>
      <span className="font-pixel text-[6px] text-shelley-amber/70 tracking-wider group-hover:text-shelley-amber transition-colors">
        ${price}
      </span>
      <span className="font-pixel text-[5px] text-white/25 tracking-wider text-center leading-tight group-hover:text-white/50 transition-colors max-w-[80px]">
        {product.name.toUpperCase()}
      </span>
      {hasRewardCode && (
        <span className="font-pixel text-[5px] text-emerald-400/50 tracking-wider">
          DISCOUNT
        </span>
      )}
    </button>
  );
}

/* ─── Empty Shelf Slot ───────────────────────────────────────────────────── */

function EmptyShelfSlot() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 border border-dashed border-white/5 flex items-center justify-center">
        <span className="font-pixel text-[8px] text-white/6">·</span>
      </div>
    </div>
  );
}

/* ─── Shelf Plank ────────────────────────────────────────────────────────── */

function ShelfPlank() {
  return (
    <div className="h-[8px] bg-gradient-to-b from-[#8a6a40] to-[#5a4025] border-b-[3px] border-[#3a2815] shadow-[0_4px_8px_rgba(0,0,0,0.4)]" />
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardCode, setRewardCode] = useState("");
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  const [poseIndex, setPoseIndex] = useState<PoseIndex>(0);
  const revertTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Pose snaps to a reaction frame, then reverts to neutral after a delay */
  const flashPose = useCallback((pose: PoseIndex, ms = 1200) => {
    setPoseIndex(pose);
    clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => setPoseIndex(0), ms);
  }, []);

  /* Loading finishes → talking pose */
  useEffect(() => {
    if (!loading) flashPose(1, 2000);
  }, [loading, flashPose]);

  /* Click anywhere → arms reaction */
  const handlePageClick = useCallback(() => {
    const pose: PoseIndex = Math.random() < 0.5 ? 2 : 3;
    flashPose(pose);
  }, [flashPose]);

  /* Toggle fullscreen body class */
  useEffect(() => {
    document.body.classList.add("shop-fullscreen");
    return () => document.body.classList.remove("shop-fullscreen");
  }, []);

  useEffect(() => {
    fetch("/api/shop/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (productId: number) => {
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/shop";
      return;
    }

    setCheckingOut(productId);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rewardCode: rewardCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch {
      alert("Network error — try again");
    } finally {
      setCheckingOut(null);
    }
  };

  const topShelf = products.slice(0, 4);
  const bottomShelf = products.slice(4, 8);
  const hasProducts = products.length > 0;

  return (
    <div
      className="relative h-screen overflow-hidden"
      onClick={handlePageClick}
    >
      {/* ═══════ BACK WALL ═══════ */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2e2218] via-[#261c12] to-[#1e160e] flex flex-col">

        {/* Shop sign */}
        <div className="text-center pt-6 sm:pt-8 pb-2">
          <h1 className="font-pixel text-sm sm:text-base text-shelley-amber/80 tracking-[0.5em] crt-glow">
            SHELLEY SHOP
          </h1>
          <p className="font-pixel text-[5px] sm:text-[6px] text-white/15 tracking-[0.3em] mt-1.5">
            GUITARS · MUSIC · ART · MORE
          </p>
        </div>

        {/* ── Shelves area (offset right to avoid Po overlap) ── */}
        <div className="flex-1 flex flex-col justify-center pl-[35%] sm:pl-[30%] pr-6 sm:pr-12 lg:pr-16 gap-2">

          {/* SHELF 1 */}
          <div>
            <div className="flex gap-4 sm:gap-6 justify-center pb-2 min-h-[80px] sm:min-h-[100px] items-end">
              {loading ? (
                <p className="font-pixel text-[7px] text-white/20 tracking-wider animate-pulse">
                  CHECKING STOCK...
                </p>
              ) : hasProducts ? (
                <>
                  {topShelf.map((p) => (
                    <ShelfItem
                      key={p.id}
                      product={p}
                      onBuy={() => handleBuy(p.id)}
                      loading={checkingOut === p.id}
                      hasRewardCode={!!rewardCode}
                    />
                  ))}
                  {Array.from({ length: Math.max(0, 4 - topShelf.length) }).map((_, i) => (
                    <EmptyShelfSlot key={`et-${i}`} />
                  ))}
                </>
              ) : (
                <>
                  <EmptyShelfSlot />
                  <EmptyShelfSlot />
                  <EmptyShelfSlot />
                  <EmptyShelfSlot />
                </>
              )}
            </div>
            <ShelfPlank />
          </div>

          {/* SHELF 2 */}
          <div className="mt-1">
            <div className="flex gap-4 sm:gap-6 justify-center pb-2 min-h-[80px] sm:min-h-[100px] items-end">
              {!loading && hasProducts && bottomShelf.length > 0 ? (
                <>
                  {bottomShelf.map((p) => (
                    <ShelfItem
                      key={p.id}
                      product={p}
                      onBuy={() => handleBuy(p.id)}
                      loading={checkingOut === p.id}
                      hasRewardCode={!!rewardCode}
                    />
                  ))}
                  {Array.from({ length: Math.max(0, 4 - bottomShelf.length) }).map((_, i) => (
                    <EmptyShelfSlot key={`eb-${i}`} />
                  ))}
                </>
              ) : (
                <>
                  <EmptyShelfSlot />
                  <EmptyShelfSlot />
                  <EmptyShelfSlot />
                </>
              )}
            </div>
            <ShelfPlank />
          </div>
        </div>
      </div>

      {/* ═══════ PO BARTENDER (full-height, TGTTM style) ═══════ */}
      <div className="shop-po-container absolute inset-0 pointer-events-none z-10 flex items-end justify-start">
        <div className="relative h-[85%] sm:h-[90%] aspect-[704/1536] ml-2 sm:ml-6 lg:ml-12">
          {PO_POSES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={i === 0 ? "Po the shopkeeper" : ""}
              className="absolute inset-0 w-full h-full object-contain object-bottom transition-none"
              style={{
                opacity: poseIndex === i ? 1 : 0,
                imageRendering: "auto",
              }}
              draggable={false}
            />
          ))}
        </div>
      </div>

      {/* ═══════ SPEECH BUBBLE (bottom-right) ═══════ */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 lg:right-16 z-20 max-w-xs sm:max-w-sm pointer-events-auto">
        <div className="pixel-panel p-3 sm:p-4 relative">
          {/* Arrow pointing left toward Po */}
          <div
            className="absolute -left-[8px] bottom-4 w-0 h-0"
            style={{
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderRight: "8px solid rgba(255,255,255,0.08)",
            }}
          />

          {loading ? (
            <p className="font-pixel text-[7px] text-white/30 tracking-wider animate-pulse">
              HANG ON...
            </p>
          ) : !hasProducts ? (
            <div>
              <p className="font-pixel text-[7px] sm:text-[8px] text-white/50 tracking-wider leading-relaxed">
                STOCK&apos;S COMING IN SOON. STILL SETTING UP THE SHELVES.
                CHECK BACK — THERE&apos;LL BE GUITARS, PICKS, MUSIC, ALL
                KINDS OF GOOD STUFF.
              </p>
              <p className="font-pixel text-[5px] text-shelley-amber/25 tracking-wider mt-2">
                &#9834; *WHISTLES WHILE ARRANGING EMPTY SHELVES*
              </p>
            </div>
          ) : (
            <div>
              <p className="font-pixel text-[7px] sm:text-[8px] text-white/50 tracking-wider leading-relaxed">
                WELCOME. CLICK ANYTHING ON THE SHELVES — IF YOU LIKE IT,
                IT&apos;S YOURS.
              </p>
              {isAuthenticated && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <RewardCodeInput value={rewardCode} onChange={setRewardCode} />
                </div>
              )}
            </div>
          )}
        </div>
        <span className="font-pixel text-[5px] text-shelley-amber/25 tracking-[0.2em] mt-1 block text-center">
          SHOPKEEP PO
        </span>
      </div>
    </div>
  );
}
