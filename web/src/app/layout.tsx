import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "@/styles/globals.css";
import Navigation from "@/components/Navigation";
import dynamic from "next/dynamic";

const MiniGameTransition = dynamic(
  () => import("@/components/MiniGameTransition"),
  { ssr: false }
);
const FooterScene = dynamic(
  () => import("@/components/FooterScene"),
  { ssr: false }
);
import { TransitionProvider } from "@/components/TransitionContext";
import { CodecProvider } from "@/hooks/useCodecOverlay";

const CodecOverlay = dynamic(
  () => import("@/components/CodecOverlay"),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

const pixelFont = localFont({
  src: "../../public/fonts/press-start-2p.woff2",
  variable: "--font-pixel",
  display: "swap",
});

const SITE_URL = "https://www.shelleyguitar.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shelley Guitar | Handcrafted Instruments & Creative Universe",
    template: "%s | Shelley Guitar",
  },
  description:
    "Boutique handcrafted guitars built with intention. Explore the workshop, gallery, and creative universe of Shelley Guitar — where luthier craft meets pixel-art adventure.",
  keywords: [
    "handmade guitars",
    "luthier",
    "custom guitars",
    "shelley guitar",
    "boutique guitars",
    "acoustic guitar builder",
    "handcrafted instruments",
  ],
  authors: [{ name: "Shelley Guitar" }],
  creator: "Shelley Guitar",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Shelley Guitar",
    title: "Shelley Guitar | Handcrafted Instruments & Creative Universe",
    description:
      "Boutique handcrafted guitars built with intention. Luthier craft meets pixel-art adventure.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shelley Guitar",
    description:
      "Boutique handcrafted guitars built with intention. Luthier craft meets pixel-art adventure.",
  },
  robots: { index: true, follow: true },
  other: { "theme-color": "#1a1a1a" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${pixelFont.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Shelley Guitar",
              url: SITE_URL,
              description:
                "Boutique handcrafted guitars built with intention.",
              sameAs: ["https://www.instagram.com/shelleyguitars/"],
            }),
          }}
        />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function() {
                  navigator.serviceWorker.register("/sw.js", { scope: "/" })
                    .then(function(reg) { reg.update(); })
                    .catch(function() {});
                });
              }
            `,
          }}
        />
        <TransitionProvider>
        <CodecProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <MiniGameTransition />
          <CodecOverlay />
          <header className="fixed top-0 left-0 right-0 z-40 pixel-panel dither-border-bottom px-6 py-3">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-6">
                <h1 className="font-pixel text-[10px] sm:text-xs tracking-widest crt-glow">
                  SHELLEY<span className="text-shelley-amber">GUITARS</span>
                </h1>
                <Navigation />
              </div>
            </div>
          </header>
          <div className="crt-boot-line" aria-hidden="true" />
          <main id="main-content" className="crt-boot pt-20 min-h-screen relative z-[1]">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
              {children}
            </div>
          </main>
          <footer className="pixel-panel dither-border-top relative z-[1]">
            <div className="max-w-7xl mx-auto">
              <FooterScene />
            </div>
          </footer>
        </CodecProvider>
        </TransitionProvider>
      </body>
    </html>
  );
}
