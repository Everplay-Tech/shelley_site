"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Workshop", href: "/workshop" },
  { name: "Gallery", href: "/gallery" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="flex gap-6 items-center">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            "text-lg font-medium transition-colors hover:text-shelley-amber",
            pathname === item.href ? "text-shelley-amber" : "text-white/80"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
