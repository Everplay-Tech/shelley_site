"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import { useTransition } from "./TransitionContext";
import { useZoneSidebar } from "./ZoneSidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { getGameForRoute } from "@/lib/game-routes";
import GameCartridge from "./GameCartridge";
import {
  HomeIcon,
  WorkshopIcon,
  GalleryIcon,
  LibrarynthIcon,
  ContactIcon,
  ShopIcon,
  LibraryIcon,
} from "./ZoneIcons";

const PoZoneAnimation = dynamic(() => import("./PoZoneAnimation"), {
  ssr: false,
});

const navItems = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Workshop", href: "/workshop", icon: WorkshopIcon },
  { name: "Gallery", href: "/gallery", icon: GalleryIcon },
  { name: "Librarynth", href: "/librarynth", icon: LibrarynthIcon },
  { name: "Contact", href: "/contact", icon: ContactIcon },
  { name: "Shop", href: "/shop", icon: ShopIcon },
  { name: "Library", href: "/library", icon: LibraryIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { startTransition, isActive } = useTransition();
  const zone = useZoneSidebar();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
                <span className="sidebar-nav-icon" aria-hidden="true"><item.icon /></span>
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

          </div>
        )}

        {/* ── Auth Button (bottom) ── */}
        {!authLoading && (
          <div className="mt-auto px-3 pb-3">
            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              className="sidebar-nav-link text-center w-full justify-center"
            >
              <span className="font-pixel text-[8px] tracking-wider truncate">
                {isAuthenticated
                  ? (user?.displayName || user?.email || "PROFILE").toUpperCase()
                  : "LOG IN"}
              </span>
            </Link>
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
