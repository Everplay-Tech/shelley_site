import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Navigation from "@/components/Navigation";
import PoStatus from "@/components/PoStatus";
import MiniGameTransition from "@/components/MiniGameTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shelley Guitars | Luthier Craft & Adventure",
  description: "Boutique guitar building with Po the mascot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MiniGameTransition />
        <header className="fixed top-0 left-0 right-0 z-40 bg-shelley-charcoal/80 backdrop-blur-md border-b border-white/5 px-8 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold tracking-tighter">
                SHELLEY<span className="text-shelley-amber">GUITARS</span>
              </h1>
              <Navigation />
            </div>
            <PoStatus />
          </div>
        </header>
        <main className="pt-24 min-h-screen">
          <div className="max-w-7xl mx-auto px-8 py-12">
            {children}
          </div>
        </main>
        <footer className="bg-shelley-charcoal border-t border-white/5 px-8 py-12">
          <div className="max-w-7xl mx-auto text-center text-white/40 text-sm">
            © 2026 Shelley Guitars. All rights reserved. Built by hand, played with heart.
          </div>
        </footer>
      </body>
    </html>
  );
}
