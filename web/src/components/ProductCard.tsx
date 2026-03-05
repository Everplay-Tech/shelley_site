"use client";

interface Product {
  id: number;
  name: string;
  description: string;
  product_type: "physical" | "digital";
  content_type: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
}

interface ProductCardProps {
  product: Product;
  onBuy: () => void;
  loading?: boolean;
  hasRewardCode?: boolean;
}

export default function ProductCard({
  product,
  onBuy,
  loading,
  hasRewardCode,
}: ProductCardProps) {
  const price = (product.price_cents / 100).toFixed(2);

  return (
    <div className="pixel-panel p-4 flex flex-col gap-3">
      {/* Image */}
      {product.image_url ? (
        <div className="w-full aspect-square bg-black/30 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-black/20 flex items-center justify-center">
          <span className="font-pixel text-[8px] text-white/10 tracking-wider">
            NO IMAGE
          </span>
        </div>
      )}

      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span
          className={`font-pixel text-[6px] tracking-wider px-1.5 py-0.5 ${
            product.product_type === "digital"
              ? "bg-blue-500/20 text-blue-300"
              : "bg-amber-500/20 text-shelley-amber"
          }`}
        >
          {product.product_type.toUpperCase()}
        </span>
        {product.content_type && (
          <span className="font-pixel text-[6px] tracking-wider text-white/30">
            {product.content_type.toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <h3 className="font-pixel text-[8px] text-white/80 tracking-wider mb-1">
          {product.name.toUpperCase()}
        </h3>
        {product.description && (
          <p className="text-white/30 text-xs line-clamp-2">
            {product.description}
          </p>
        )}
      </div>

      {/* Price + Buy */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="font-pixel text-[9px] text-shelley-amber tracking-wider">
          ${price}
        </span>
        <button
          onClick={onBuy}
          disabled={loading}
          className="pixel-btn text-[7px] disabled:opacity-40"
        >
          {loading ? "..." : hasRewardCode ? "BUY (DISCOUNT)" : "BUY"}
        </button>
      </div>
    </div>
  );
}
