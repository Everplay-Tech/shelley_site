"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useTransition } from "./TransitionContext";
import { getGameForRoute } from "@/lib/game-routes";

const navItems = [
  { name: "Home", href: "/", icon: "^" },
  { name: "Workshop", href: "/workshop", icon: "W" },
  { name: "Gallery", href: "/gallery", icon: "G" },
  { name: "Librarynth", href: "/librarynth", icon: "L" },
  { name: "Contact", href: "/contact", icon: "C" },
];

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { startTransition, isActive } = useTransition();

  const handleClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (pathname === href) return;
    startTransition(href);
  };

  return (
    <nav
      className={clsx(
        "flex gap-1 sm:gap-2 items-center transition-opacity",
        isActive && "pointer-events-none opacity-50"
      )}
    >
      {navItems.map((item) => {
        const hasGame = getGameForRoute(item.href) !== null;
        const isCurrentPage = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => handleClick(e, item.href)}
            className={clsx(
              "relative font-pixel text-[7px] sm:text-[8px] tracking-wider px-2 sm:px-3 py-1.5 sm:py-2 transition-all",
              isCurrentPage
                ? "pixel-panel-raised text-shelley-amber crt-glow"
                : "text-white/40 hover:text-shelley-amber hover:bg-white/[0.03] border border-transparent hover:border-white/10"
            )}
          >
            <span className="hidden sm:inline">{item.name.toUpperCase()}</span>
            <span className="sm:hidden">{item.icon}</span>
            {hasGame && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-shelley-amber/60" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
