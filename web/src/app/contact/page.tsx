"use client";

import { useState, useCallback, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import GodotEmbed from "@/components/GodotEmbed";
import { getGameForRoute } from "@/lib/game-routes";
import { emitGameEvent } from "@/lib/game-events";
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

    // Client-side validation
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

      // Cooldown — prevent spam re-submits
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    } catch {
      setErrorMsg("Network error — please try again");
      setFormState("error");
    }
  };

  return (
    <div className="flex flex-col gap-16">
      {/* ─── HERO ─── */}
      <section className="text-center py-8">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
          Get in <span className="text-shelley-amber">Touch</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Custom build inquiry, collaboration idea, or just want to talk guitars?
          We&apos;re listening.
        </p>
      </section>

      {/* ─── CONTACT DASH ─── */}
      {gameConfig && (
        <section className="bg-gradient-to-b from-shelley-amber/5 to-transparent rounded-3xl p-8 border border-shelley-amber/10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-xl font-bold text-shelley-amber">Contact Dash</h3>
              <p className="text-white/50 text-sm">
                Help Hpar the ronin catch your messages before they hit the ground
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-white/25 block">
                Arrow keys or tap screen halves
              </span>
            </div>
          </div>
          <GodotEmbed gameName={gameConfig.gameName} onEvent={handleGodotEvent} />
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* ─── CONTACT FORM ─── */}
        <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
          {formState === "success" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">&#x2709;&#xFE0F;</div>
              <h3 className="text-xl font-bold text-shelley-amber mb-2">
                Message Sent
              </h3>
              <p className="text-white/50 text-sm max-w-xs">
                We got it. We&apos;ll get back to you soon. In the meantime,
                check out the workshop or play some more.
              </p>
              <button
                onClick={() => setFormState("idle")}
                className="mt-6 text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <h3 className="text-lg font-bold text-white/80 mb-1">
                Send a Message
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors text-white placeholder:text-white/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors text-white placeholder:text-white/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors text-white placeholder:text-white/20 resize-none"
                />
              </div>

              {/* Error message */}
              {formState === "error" && errorMsg && (
                <p className="text-red-400 text-xs font-mono">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={formState === "sending" || cooldown}
                className="mt-2 bg-shelley-amber text-shelley-charcoal font-bold py-3.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {formState === "sending"
                  ? "Sending..."
                  : cooldown
                    ? "Message Sent \u2713"
                    : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* ─── CONNECT ─── */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white/80">
            Other Ways to Connect
          </h3>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/shelleyguitars/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white/5 p-5 rounded-xl border border-white/5 hover:border-pink-500/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white/80 group-hover:text-white transition-colors">
                @shelleyguitars
              </p>
              <p className="text-white/40 text-xs">Daily builds &amp; process on Instagram</p>
            </div>
          </a>

          {/* Discord */}
          <div className="flex items-center gap-4 bg-white/5 p-5 rounded-xl border border-dashed border-white/10">
            <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white/50">Discord</p>
              <p className="text-white/25 text-xs">Community server coming soon</p>
            </div>
          </div>

          {/* YouTube */}
          <div className="flex items-center gap-4 bg-white/5 p-5 rounded-xl border border-dashed border-white/10">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white/50">YouTube</p>
              <p className="text-white/25 text-xs">Build logs &amp; music — coming soon</p>
            </div>
          </div>

          {/* General note */}
          <div className="mt-4 p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <p className="text-white/25 text-xs leading-relaxed">
              Messages go straight to our team on Discord. We typically respond
              within 24 hours. For urgent builds, mention your timeline in the
              message.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
