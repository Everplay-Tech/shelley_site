import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "@/styles/globals.css";
import Navigation from "@/components/Navigation";
import PoStatus from "@/components/PoStatus";
import MiniGameTransition from "@/components/MiniGameTransition";
import { TransitionProvider } from "@/components/TransitionContext";

const inter = Inter({ subsets: ["latin"] });

const pixelFont = localFont({
  src: "../../public/fonts/press-start-2p.woff2",
  variable: "--font-pixel",
  display: "swap",
});

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
      <body className={`${inter.className} ${pixelFont.variable}`}>
        <TransitionProvider>
          <MiniGameTransition />
          <header className="fixed top-0 left-0 right-0 z-40 pixel-panel dither-border-bottom px-6 py-3">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-6">
                <h1 className="font-pixel text-[10px] sm:text-xs tracking-widest crt-glow">
                  SHELLEY<span className="text-shelley-amber">GUITARS</span>
                </h1>
                <Navigation />
              </div>
              <PoStatus />
            </div>
          </header>
          <main className="pt-20 min-h-screen relative z-[1]">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
              {children}
            </div>
          </main>
          <footer className="pixel-panel dither-border-top px-6 py-5 relative z-[1]">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="font-pixel text-[7px] text-white/25 tracking-wider">
                &copy; 2026 SHELLEY GUITARS
              </span>
              <div className="hidden sm:flex items-center gap-4">
                <span className="font-pixel text-[7px] text-white/15">
                  BUILT BY HAND
                </span>
                <span className="font-pixel text-[7px] text-shelley-amber/30">
                  PLAYED WITH HEART
                </span>
              </div>
              {/* Po idle sprite */}
              <div
                className="sprite-anim animate-sprite-idle w-8 h-8 sm:w-10 sm:h-10 shrink-0"
                style={{
                  backgroundImage: 'url(/sprites/po/idle_sheet.png)',
                  backgroundSize: '128px 32px',
                }}
                aria-label="Po the ghost mascot"
              />
            </div>
          </footer>
        </TransitionProvider>
      </body>
    </html>
  );
}
