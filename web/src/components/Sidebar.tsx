"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import { useTransition } from "./TransitionContext";
import { useCodecOverlay } from "@/hooks/useCodecOverlay";
import { useZoneSidebar } from "./ZoneSidebarContext";
import { getGameForRoute } from "@/lib/game-routes";
import GameCartridge from "./GameCartridge";

const PoZoneAnimation = dynamic(() => import("./PoZoneAnimation"), {
  ssr: false,
});

const navItems = [
  { name: "Home", href: "/", icon: "^" },
  { name: "Workshop", href: "/workshop", icon: "W" },
  { name: "Gallery", href: "/gallery", icon: "G" },
  { name: "Librarynth", href: "/librarynth", icon: "L" },
  { name: "Contact", href: "/contact", icon: "C" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { startTransition, isActive } = useTransition();
  const { openCodec } = useCodecOverlay();
  const zone = useZoneSidebar();
  const gameConfig = zone ? getGameForRoute(pathname) : null;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [collapsed]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (pathname === href) return;
    startTransition(href);
  };

  const handleCodecOpen = useCallback(() => {
    if (zone) openCodec(zone.poCostume, zone.id);
  }, [openCodec, zone]);

  const handleCodecKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCodecOpen();
      }
    },
    [handleCodecOpen]
  );

  return (
    <>
      <aside
        className={clsx("site-sidebar", collapsed && "site-sidebar--collapsed")}
        aria-label="Site navigation"
      >
        {/* ── Branding ── */}
        <div className="sidebar-branding">
          <h1 className="font-pixel text-[10px] tracking-widest crt-glow leading-tight text-center">
            SHELLEY<br />
            <span className="text-shelley-amber">GUITARS</span>
          </h1>
        </div>

        {/* ── Navigation ── */}
        <nav
          aria-label="Main navigation"
          className={clsx(
            "sidebar-nav",
            isActive && "pointer-events-none opacity-50"
          )}
          {...(isActive ? { "aria-disabled": "true" } : {})}
        >
          {navItems.map((item) => {
            const hasGame = getGameForRoute(item.href) !== null;
            const isCurrentPage = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                aria-current={isCurrentPage ? "page" : undefined}
                className={clsx(
                  "sidebar-nav-link",
                  isCurrentPage && "sidebar-nav-link--active"
                )}
              >
                <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="sidebar-nav-label">{item.name.toUpperCase()}</span>
                {hasGame && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-shelley-amber/60" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Zone Content (only on zone pages) ── */}
        {zone && (
          <div className="sidebar-zone">
            {/* Divider */}
            <div className={`w-full h-px ${zone.accentColor} opacity-10`} />

            {/* Po Animation */}
            <div className="flex justify-center" data-po-zone-sprite>
              <PoZoneAnimation costume={zone.poCostume} size={64} />
            </div>

            {/* Zone name */}
            <p
              className={`
                font-pixel text-[8px] tracking-wider text-center uppercase
                ${zone.accentColor} opacity-60
              `}
            >
              {zone.subtitle}
            </p>

            {/* Divider */}
            <div className={`w-full h-px ${zone.accentColor} opacity-10`} />

            {/* Game Cartridge */}
            {gameConfig && (
              <GameCartridge
                game={gameConfig}
                accentColor={zone.accentColor}
                accentHex={zone.accentHex}
                coverImage={zone.cartridgeImage}
                className="w-full"
              />
            )}

            {/* Divider */}
            <div className={`w-full h-px ${zone.accentColor} opacity-10`} />

            {/* Talk to Po */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleCodecOpen}
              onKeyDown={handleCodecKeyDown}
              aria-label={`Talk to Po about ${zone.name}`}
              className="cursor-pointer group w-full text-center py-1.5"
            >
              <span className="font-pixel text-[6px] tracking-widest text-white/30 group-hover:text-white/60 transition-colors uppercase">
                Talk to Po
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Drawer toggle (desktop only) ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        className={clsx("sidebar-toggle", collapsed && "sidebar-toggle--collapsed")}
      >
        <span className="sidebar-toggle-icon" aria-hidden="true">
          {collapsed ? "\u25B6" : "\u25C0"}
        </span>
      </button>
    </>
  );
}
