"use client";

import { useState, useCallback, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import PixelCard from "@/components/PixelCard";
import ZoneHeader from "@/components/ZoneHeader";
import AmbientParticles from "@/components/AmbientParticles";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
import { ZONES } from "@/lib/zone-config";
import type { GodotEvent } from "@/lib/godot-messages";

type FormState = "idle" | "sending" | "success" | "error";

export default function Contact() {
  const pathname = usePathname();
  const gameConfig = getGameForRoute(pathname);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(false);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (cooldown || formState === "sending") return;

    if (!name.trim()) {
      setErrorMsg("Name is required");
      setFormState("error");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email");
      setFormState("error");
      return;
    }
    if (!message.trim()) {
      setErrorMsg("Message is required");
      setFormState("error");
      return;
    }

    setFormState("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong");
        setFormState("error");
        return;
      }

      setFormState("success");
      setName("");
      setEmail("");
      setMessage("");

      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    } catch {
      setErrorMsg("Network error — please try again");
      setFormState("error");
    }
  };

  return (
    <div className="relative flex flex-col gap-16">
      <AmbientParticles type="signals" count={6} />

      {/* ─── ZONE HEADER ─── */}
      <ZoneHeader zone={ZONES.contact} />

      {/* ─── CONTACT DASH ─── */}
      {gameConfig && (
        <section className="pixel-panel p-5 sm:p-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-pixel text-[10px] text-shelley-spirit-green crt-glow-green tracking-wider">CONTACT DASH</h3>
              <p className="text-white/40 text-xs mt-1">
                Help Hpar the ronin catch your messages before they hit the ground
              </p>
            </div>
            <span className="font-pixel text-[7px] text-white/20 hidden sm:block">
              ARROWS OR TAP
            </span>
          </div>
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ─── CONTACT FORM ─── */}
        <div className="zone-contact transmission-console">
          <PixelCard hover={false}>
            <div role="status" aria-live="polite">
              {formState === "success" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <h3 className="font-pixel text-xs text-shelley-spirit-green crt-glow-green mb-2 tracking-wider">
                    SIGNAL RECEIVED &#10003;
                  </h3>
                  <p className="text-white/45 text-sm max-w-xs">
                    We got it. We&apos;ll get back to you soon. In the meantime,
                    check out the workshop or play some more.
                  </p>
                  <button
                    onClick={() => setFormState("idle")}
                    className="pixel-btn-ghost mt-6"
                  >
                    TRANSMIT AGAIN
                  </button>
                </div>
              )}
            </div>
            {formState !== "success" && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                <h3 className="font-pixel text-[10px] text-shelley-spirit-green/70 tracking-wider">
                  TRANSMIT SIGNAL
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-name" className="font-pixel text-[7px] text-shelley-spirit-green/30 tracking-wider">
                    NAME
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="pixel-input"
                    aria-required="true"
                    aria-describedby={formState === "error" ? "form-error" : undefined}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-email" className="font-pixel text-[7px] text-shelley-spirit-green/30 tracking-wider">
                    EMAIL
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pixel-input"
                    aria-required="true"
                    aria-describedby={formState === "error" ? "form-error" : undefined}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-message" className="font-pixel text-[7px] text-shelley-spirit-green/30 tracking-wider">
                    MESSAGE
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    className="pixel-input resize-none"
                    aria-required="true"
                    aria-describedby={formState === "error" ? "form-error" : undefined}
                  />
                </div>

                {formState === "error" && errorMsg && (
                  <p id="form-error" role="alert" className="font-pixel text-[7px] text-red-400 tracking-wider">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formState === "sending" || cooldown}
                  aria-disabled={formState === "sending" || cooldown}
                  className="pixel-btn-green mt-2 disabled:opacity-40 disabled:cursor-not-allowed text-center"
                >
                  {formState === "sending"
                    ? "TRANSMITTING..."
                    : cooldown
                      ? "SIGNAL SENT \u2713"
                      : "TRANSMIT SIGNAL"}
                </button>
              </form>
            )}
          </PixelCard>
        </div>

        {/* ─── FREQUENCY CHANNELS ─── */}
        <div className="flex flex-col gap-4">
          <h3 className="font-pixel text-[10px] text-shelley-spirit-green/60 tracking-wider">
            FREQUENCY CHANNELS
          </h3>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/shelleyguitars/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow @shelleyguitars on Instagram"
            className="flex items-center gap-4 pixel-panel p-4 hover:border-pink-500/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            <div>
              <p className="font-pixel text-[7px] text-shelley-spirit-green/25 tracking-wider mb-0.5">FREQ 01</p>
              <p className="font-pixel text-[8px] text-white/70 group-hover:text-white transition-colors tracking-wider">
                @SHELLEYGUITARS
              </p>
              <p className="text-white/35 text-xs">Daily builds &amp; process on Instagram</p>
            </div>
          </a>

          {/* Discord */}
          <div className="flex items-center gap-4 pixel-panel-inset p-4">
            <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
            </div>
            <div>
              <p className="font-pixel text-[7px] text-shelley-spirit-green/25 tracking-wider mb-0.5">FREQ 02</p>
              <p className="font-pixel text-[8px] text-white/40 tracking-wider">DISCORD</p>
              <p className="text-white/20 text-xs">Community server coming soon</p>
            </div>
          </div>

          {/* YouTube */}
          <div className="flex items-center gap-4 pixel-panel-inset p-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <p className="font-pixel text-[7px] text-shelley-spirit-green/25 tracking-wider mb-0.5">FREQ 03</p>
              <p className="font-pixel text-[8px] text-white/40 tracking-wider">YOUTUBE</p>
              <p className="text-white/20 text-xs">Build logs &amp; music — coming soon</p>
            </div>
          </div>

          {/* Note */}
          <PixelCard variant="inset" hover={false} className="p-3 mt-2">
            <p className="text-white/20 text-xs leading-relaxed">
              Signals reach our team directly. We typically respond
              within 24 hours. For urgent builds, mention your timeline.
            </p>
          </PixelCard>
        </div>
      </div>
    </div>
  );
}
