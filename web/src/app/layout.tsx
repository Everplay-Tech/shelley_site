import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "@/styles/globals.css";
import dynamic from "next/dynamic";

const MiniGameTransition = dynamic(
  () => import("@/components/MiniGameTransition"),
  { ssr: false }
);
const FooterScene = dynamic(
  () => import("@/components/FooterScene"),
  { ssr: false }
);
const Sidebar = dynamic(
  () => import("@/components/Sidebar"),
  { ssr: false }
);
import { TransitionProvider } from "@/components/TransitionContext";
import { CodecProvider } from "@/hooks/useCodecOverlay";
import { ZoneSidebarProvider } from "@/components/ZoneSidebarContext";

const PoEncounterProvider = dynamic(
  () => import("@/components/PoEncounterProvider"),
  { ssr: false }
);

const CodecOverlay = dynamic(
  () => import("@/components/CodecOverlay"),
  { ssr: false }
);

const CursorStalkEncounter = dynamic(
  () => import("@/components/encounters/CursorStalkEncounter"),
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
        <ZoneSidebarProvider>
        <PoEncounterProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <MiniGameTransition />
          <CodecOverlay />
          <CursorStalkEncounter />
          <Sidebar />
          <div className="crt-boot-line" aria-hidden="true" />
          <main id="main-content" className="crt-boot site-content min-h-screen relative z-[1]">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
              {children}
            </div>
          </main>
          <footer className="pixel-panel dither-border-top relative z-[1] site-content">
            <div className="max-w-7xl mx-auto">
              <FooterScene />
            </div>
          </footer>
        </PoEncounterProvider>
        </ZoneSidebarProvider>
        </CodecProvider>
        </TransitionProvider>
      </body>
    </html>
  );
}
