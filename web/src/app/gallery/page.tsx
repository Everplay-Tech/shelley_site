"use client";

import PixelSectionHeader from "@/components/PixelSectionHeader";
import PixelCard from "@/components/PixelCard";
import AmbientParticles from "@/components/AmbientParticles";
import { ZONES } from "@/lib/zone-config";
import { useSetZoneSidebar } from "@/components/ZoneSidebarContext";

/* ─── Instagram post panes ──────────────────────────────────────────────── */

const instaPosts = [
  { id: 1, url: "", thumbnail: "", alt: "", coverLabel: "PEEK" },
  { id: 2, url: "", thumbnail: "", alt: "", coverLabel: "PEEK" },
  { id: 3, url: "", thumbnail: "", alt: "", coverLabel: "PEEK" },
  { id: 4, url: "", thumbnail: "", alt: "", coverLabel: "PEEK" },
  { id: 5, url: "", thumbnail: "", alt: "", coverLabel: "PEEK" },
  { id: 6, url: "", thumbnail: "", alt: "", coverLabel: "PEEK" },
];

/* ─── Completed instruments ─────────────────────────────────────────────── */

const instruments: {
  name: string;
  model: string;
  woods: string;
  year: string;
  description: string;
  image?: string;
}[] = [
  // Showcase-ready instruments go here once completed
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Gallery() {
  useSetZoneSidebar(ZONES.gallery);

  return (
    <div className="relative flex flex-col gap-16">
      <AmbientParticles type="motes" count={10} />

      {/* ─── INSTAGRAM FEED ─── */}
      <section>
        <PixelSectionHeader color="purple">@shelleyguitars</PixelSectionHeader>

        <PixelCard variant="raised" hover={false}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Instagram profile card */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-shelley-charcoal flex items-center justify-center">
                  <span className="text-xl">&#127928;</span>
                </div>
              </div>
              <div>
                <h3 className="font-pixel text-[9px] text-white/80 tracking-wider">@SHELLEYGUITARS</h3>
                <p className="text-white/35 text-xs">Daily builds &amp; process</p>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-white/45 text-sm leading-relaxed mb-4">
                The build in real time. Wood selection, shaping, voicing, finishing —
                and the occasional tangent about the nature of sound.
              </p>
              <a
                href="https://www.instagram.com/shelleyguitars/"
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn"
              >
                FOLLOW ON INSTAGRAM
              </a>
            </div>
          </div>

          {/* Instagram post grid — Po reveals */}
          <div className="mt-6">
            <span className="font-pixel text-[6px] text-purple-400/40 tracking-wider mb-2 block">
              LIVE FEED
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {instaPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.url || "https://www.instagram.com/shelleyguitars/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square pixel-panel-inset overflow-hidden"
                >
                  {/* Content layer — Instagram post thumbnail (revealed on hover) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {post.thumbnail ? (
                      <img
                        src={post.thumbnail}
                        alt={post.alt || "Instagram post"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-pixel text-[7px] text-purple-400/20 tracking-wider">
                        AWAITING SIGNAL
                      </span>
                    )}
                  </div>

                  {/* Cover layer — Po with curtain/reveal prop */}
                  <div className="absolute inset-0 bg-shelley-charcoal/95 flex flex-col items-center justify-center transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-110">
                    {/* Po sprite */}
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-no-repeat bg-contain bg-center image-rendering-pixelated mb-1"
                      style={{
                        backgroundImage: "url(/sprites/po/costumes/artist_static.png)",
                        imageRendering: "pixelated",
                      }}
                    />
                    <span className="font-pixel text-[6px] text-purple-400/30 tracking-wider">
                      {post.coverLabel}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </PixelCard>
      </section>

      {/* ─── INSTRUMENT SHOWCASE ─── */}
      <section>
        <PixelSectionHeader color="purple">Instruments</PixelSectionHeader>

        {instruments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {instruments.map((instrument) => (
              <PixelCard key={instrument.name} variant="raised" className="exhibition-frame">
                {/* Instrument image or placeholder */}
                <div className="aspect-[4/3] pixel-panel-inset flex items-center justify-center mb-4 -mx-5 -mt-5">
                  {instrument.image ? (
                    <img
                      src={instrument.image}
                      alt={instrument.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full m-3 border-2 border-dashed border-white/5 flex items-center justify-center">
                      <span className="font-pixel text-[7px] text-white/10 tracking-wider">
                        AWAITING EXHIBIT
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-pixel text-[10px] text-white/85 tracking-wider">
                      {instrument.name.toUpperCase()}
                    </h3>
                    <p className="font-pixel text-[7px] text-white/30 tracking-wider mt-0.5">
                      {instrument.model}
                    </p>
                  </div>
                </div>
                <p className="font-pixel text-[7px] text-white/25 mb-3 tracking-wider">
                  {instrument.woods} &middot; {instrument.year}
                </p>
                <p className="text-white/45 text-sm leading-relaxed">
                  {instrument.description}
                </p>
              </PixelCard>
            ))}
          </div>
        ) : (
          <PixelCard variant="inset" hover={false} className="text-center py-12">
            <p className="font-pixel text-[10px] text-white/20 tracking-wider mb-3">
              FIRST INSTRUMENTS IN THE WORKSHOP
            </p>
            <p className="text-white/30 text-sm max-w-md mx-auto leading-relaxed">
              Five guitars are being built right now. When they&apos;re finished, they&apos;ll live here.
            </p>
            <a href="/workshop" className="pixel-btn-ghost mt-6 inline-block">
              SEE CURRENT BUILDS &rarr;
            </a>
          </PixelCard>
        )}

        {/* Commission CTA */}
        <div className="mt-8 text-center">
          <a href="/contact" className="pixel-btn">
            COMMISSION A CUSTOM BUILD &rarr;
          </a>
        </div>
      </section>
    </div>
  );
}
