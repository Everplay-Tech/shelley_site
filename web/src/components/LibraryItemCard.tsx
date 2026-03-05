"use client";

import { useState } from "react";

interface LibraryProduct {
  name: string;
  description: string;
  contentType: string | null;
  imageUrl: string | null;
}

interface LibraryItem {
  id: number;
  product: LibraryProduct;
  source: string;
  grantedAt: string;
  downloadCount: number;
}

const SOURCE_LABELS: Record<string, string> = {
  purchase: "PURCHASED",
  reward: "REWARD",
  free: "FREE",
  gift: "GIFT",
};

const SOURCE_COLORS: Record<string, string> = {
  purchase: "text-shelley-amber",
  reward: "text-purple-400",
  free: "text-green-400",
  gift: "text-blue-400",
};

const TYPE_LABELS: Record<string, string> = {
  music: "MUSIC",
  comic: "COMIC",
  game: "GAME",
  book: "BOOK",
};

export function LibraryItemCard({ item }: { item: LibraryItem }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/library/download/${item.id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Download failed");
        return;
      }

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed — please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const contentType = item.product.contentType || "other";
  const sourceLabel = SOURCE_LABELS[item.source] || item.source.toUpperCase();
  const sourceColor = SOURCE_COLORS[item.source] || "text-white/50";
  const typeLabel = TYPE_LABELS[contentType] || contentType.toUpperCase();

  return (
    <div className="pixel-panel-inset p-4 flex flex-col gap-3">
      {/* Image */}
      {item.product.imageUrl && (
        <div className="w-full aspect-square bg-black/30 overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.product.imageUrl}
            alt={item.product.name}
            className="w-full h-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      {/* Badges */}
      <div className="flex gap-2">
        <span className="font-pixel text-[6px] text-white/40 tracking-wider px-2 py-0.5 border border-white/10">
          {typeLabel}
        </span>
        <span className={`font-pixel text-[6px] tracking-wider px-2 py-0.5 border border-white/10 ${sourceColor}`}>
          {sourceLabel}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="font-pixel text-[8px] text-white/80 tracking-wider mb-1">
          {item.product.name.toUpperCase()}
        </h3>
        {item.product.description && (
          <p className="text-white/30 text-xs line-clamp-2">
            {item.product.description}
          </p>
        )}
      </div>

      {/* Download */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="pixel-btn text-[7px] disabled:opacity-40"
        >
          {downloading ? "DOWNLOADING..." : "DOWNLOAD"}
        </button>
        {item.downloadCount > 0 && (
          <span className="font-pixel text-[6px] text-white/20 tracking-wider">
            {item.downloadCount}x
          </span>
        )}
      </div>
    </div>
  );
}
