"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useTransition } from "./TransitionContext";
import { getGameForRoute } from "@/lib/game-routes";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Workshop", href: "/workshop" },
  { name: "Gallery", href: "/gallery" },
  { name: "Librarynth", href: "/librarynth" },
  { name: "Contact", href: "/contact" },
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
        "flex gap-6 items-center transition-opacity",
        isActive && "pointer-events-none opacity-50"
      )}
    >
      {navItems.map((item) => {
        const hasGame = getGameForRoute(item.href) !== null;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => handleClick(e, item.href)}
            className={clsx(
              "text-lg font-medium transition-colors hover:text-shelley-amber flex items-center gap-1.5",
              pathname === item.href ? "text-shelley-amber" : "text-white/80"
            )}
          >
            {item.name}
            {hasGame && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-shelley-amber/60" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
