"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import RewardCodeInput from "@/components/RewardCodeInput";
import { useAuth } from "@/hooks/useAuth";

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

type FilterTab = "ALL" | "PHYSICAL" | "DIGITAL";

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [rewardCode, setRewardCode] = useState("");
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/shop/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "ALL"
      ? products
      : products.filter(
          (p) => p.product_type === filter.toLowerCase()
        );

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

  const tabs: FilterTab[] = ["ALL", "PHYSICAL", "DIGITAL"];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pixel-panel p-6">
        <h1 className="font-pixel text-xs text-shelley-amber crt-glow tracking-wider mb-2">
          SHOP
        </h1>
        <p className="text-white/40 text-sm">
          Handcrafted guitars, picks, digital music, comics, and more.
        </p>
      </div>

      {/* Filter tabs + reward code */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`font-pixel text-[7px] tracking-wider px-3 py-1.5 transition-colors ${
                filter === tab
                  ? "pixel-btn"
                  : "pixel-btn-ghost"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isAuthenticated && (
          <div className="ml-auto">
            <RewardCodeInput value={rewardCode} onChange={setRewardCode} />
          </div>
        )}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="font-pixel text-[8px] text-white/30 tracking-wider animate-pulse">
            LOADING PRODUCTS...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pixel-panel p-8 text-center">
          <p className="font-pixel text-[8px] text-white/30 tracking-wider">
            {products.length === 0
              ? "NO PRODUCTS YET — CHECK BACK SOON"
              : "NO PRODUCTS IN THIS CATEGORY"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuy={() => handleBuy(product.id)}
              loading={checkingOut === product.id}
              hasRewardCode={!!rewardCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
