"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LibraryItemCard } from "@/components/LibraryItemCard";

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

export default function LibraryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/library")
        .then((r) => r.json())
        .then((data) => {
          if (data.items) setItems(data.items);
        })
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-pixel text-[8px] text-white/30 tracking-wider animate-pulse">
          LOADING...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Group items by content type
  const grouped = items.reduce<Record<string, LibraryItem[]>>((acc, item) => {
    const type = item.product.contentType || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    music: "MUSIC",
    comic: "COMICS",
    game: "GAMES",
    book: "BOOKS",
    other: "OTHER",
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="pixel-panel p-6">
        <h1 className="font-pixel text-xs text-shelley-amber crt-glow tracking-wider mb-2">
          DIGITAL LIBRARY
        </h1>
        <p className="text-white/40 text-sm">
          Your owned content — download anytime.
        </p>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-16">
          <p className="font-pixel text-[8px] text-white/30 tracking-wider animate-pulse">
            LOADING LIBRARY...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="pixel-panel-inset p-8 text-center">
          <p className="font-pixel text-[8px] text-white/30 tracking-wider mb-4">
            NO ITEMS YET
          </p>
          <p className="text-white/20 text-sm mb-4">
            Visit the Shop to find music, comics, games, and more.
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="pixel-btn text-[7px]"
          >
            VISIT SHOP
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([type, groupItems]) => (
          <div key={type}>
            <h2 className="font-pixel text-[10px] text-shelley-amber/70 tracking-wider mb-4">
              {typeLabels[type] || type.toUpperCase()}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupItems.map((item) => (
                <LibraryItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
