"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import GodotEmbed from "@/components/GodotEmbed";
import type { GodotEmbedHandle } from "@/components/GodotEmbed";
import GameBoyControls from "@/components/GameBoyControls";
import { getLandingGame, ONBOARDING_COOKIE } from "@/lib/game-routes";
import { hasCookie, setCookie } from "@/lib/cookies";
import { reportGameEvent } from "@/lib/player-state";
import { usePlayerState } from "@/hooks/usePlayerState";
import type { GodotEvent } from "@/lib/godot-messages";
import { emitGameEvent } from "@/lib/game-events";

type GameScreen = "loading" | "welcome" | "controls" | "playing" | "done";

export default function Home() {
  const { progress } = usePlayerState();
  const [showGame, setShowGame] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [gameConfig, setGameConfig] = useState(() => getLandingGame(false));
  const [screen, setScreen] = useState<GameScreen>("loading");
  const [isMobile, setIsMobile] = useState(false);
  const [isNarrative, setIsNarrative] = useState(false);
  const embedRef = useRef<GodotEmbedHandle>(null);

  useEffect(() => {
    // Detect mobile/touch device
    const touch =
      navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    setIsMobile(touch);
  }, []);

  useEffect(() => {
    // Check both cookie (legacy) and server state
    const returning = hasCookie(ONBOARDING_COOKIE) || progress.onboardingComplete;
    setGameConfig(getLandingGame(returning));
    if (returning) {
      setShowGame(false);
      setScreen("done");
    }
  }, [progress.onboardingComplete]);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
    switch (event.type) {
      case "game_ready":
        // Godot loaded — transition from loading spinner to welcome screen
        setScreen((prev) => (prev === "loading" ? "welcome" : prev));
        break;
      case "narrative_start":
        setIsNarrative(true);
        break;
      case "narrative_end":
        setIsNarrative(false);
        break;
      case "onboarding_complete":
        reportGameEvent({ type: "onboarding_complete", gameName: "po_runner" });
        setCookie(ONBOARDING_COOKIE, "1");
        setScreen("done");
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setShowGame(false), 800);
        }, 2000);
        break;
      case "player_state":
        if ("data" in event) {
          reportGameEvent({
            type: "score_update",
            gameName: "po_runner",
            score: event.data.score,
          });
        }
        break;
      default:
        break;
    }
  }, []);

  const handlePlay = useCallback(() => {
    setScreen("controls");
  }, []);

  const handleStart = useCallback(() => {
    setScreen("playing");
    embedRef.current?.sendCommand({ command: "start" });
  }, []);

  const handleSkip = useCallback(() => {
    reportGameEvent({ type: "skipped", gameName: "po_runner" });
    setScreen("done");
    setFadeOut(true);
    setTimeout(() => setShowGame(false), 600);
  }, []);

  const sendCommand = useCallback(
    (cmd: Parameters<GodotEmbedHandle["sendCommand"]>[0]) => {
      embedRef.current?.sendCommand(cmd);
    },
    []
  );

  return (
    <>
      {/* Full-screen game overlay — covers everything including nav */}
      {showGame && (
        <div
          className={`fixed inset-0 z-[100] bg-black transition-opacity duration-700 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Game iframe — always mounted, loads in background */}
          <div className="absolute inset-0">
            <GodotEmbed
              ref={embedRef}
              gameName={gameConfig.gameName}
              onEvent={handleGodotEvent}
              fullScreen
            />
          </div>

          {/* ─── WELCOME SCREEN ─── */}
          {screen === "welcome" && (
            <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-8 px-6 text-center max-w-md">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-shelley-amber mb-2">
                    WELCOME!
                  </h1>
                  <p className="text-xl sm:text-2xl font-bold text-white/90">
                    To our LABS!!!
                  </p>
                </div>

                <p className="text-sm text-white/50 font-mono">
                  Choose to play or skip intro. Have a nice day
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button
                    onClick={handlePlay}
                    className="px-8 py-3 bg-shelley-amber text-black font-bold text-lg rounded hover:bg-shelley-amber/90 transition-colors"
                  >
                    PLAY
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-8 py-3 bg-white/10 text-white/60 font-bold text-lg rounded hover:bg-white/20 hover:text-white/80 transition-colors"
                  >
                    SKIP INTRO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── CONTROLS INFOGRAPHIC ─── */}
          {screen === "controls" && (
            <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/75 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-6 px-4 text-center max-w-sm w-full">
                <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white/90 uppercase font-mono">
                  Controls
                </h2>

                {/* Controller infographic card */}
                <div className="w-full bg-[#1a1a1a]/90 border border-white/10 rounded-xl p-6 sm:p-8">
                  {/* Game Boy layout with callouts */}
                  <div className="flex items-center justify-between mb-6">
                    {/* D-pad visual */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-[72px] h-[72px]">
                        {/* Cross */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute w-[24px] h-[66px] bg-[#333] rounded-[2px]" />
                          <div className="absolute w-[66px] h-[24px] bg-[#333] rounded-[2px]" />
                        </div>
                        {/* Arrows */}
                        <div className="absolute top-[4px] left-1/2 -translate-x-1/2 text-white/20 text-[10px]">▲</div>
                        <div className="absolute top-1/2 left-[6px] -translate-y-1/2 text-white/20 text-[10px]">◀</div>
                        <div className="absolute top-1/2 right-[6px] -translate-y-1/2 text-white/20 text-[10px]">▶</div>
                        <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 text-shelley-amber text-[10px]">▼</div>
                        {/* Center */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/10" />
                      </div>
                      <span className="text-[10px] font-mono text-white/40 tracking-wider">D-PAD</span>
                    </div>

                    {/* A/B visual */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-[72px] h-[60px]">
                        {/* B */}
                        <div className="absolute top-0 left-0 w-[32px] h-[32px] rounded-full bg-[#333] border border-white/15 flex items-center justify-center">
                          <span className="text-white/40 text-xs font-bold">B</span>
                        </div>
                        {/* A */}
                        <div className="absolute bottom-0 right-0 w-[32px] h-[32px] rounded-full bg-[#333] border border-shelley-amber/30 flex items-center justify-center">
                          <span className="text-shelley-amber text-xs font-bold">A</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 tracking-wider">BUTTONS</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-white/8 mb-5" />

                  {/* Action callouts */}
                  <div className="flex flex-col gap-3 text-left">
                    {/* Jump */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#333] border border-shelley-amber/30 flex items-center justify-center shrink-0">
                        <span className="text-shelley-amber text-[10px] font-bold">A</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-white/80 font-mono text-xs font-bold">JUMP</span>
                        {!isMobile && (
                          <span className="text-white/30 font-mono text-[10px] ml-2">SPACE / ↑</span>
                        )}
                      </div>
                    </div>

                    {/* Slide */}
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#333] border border-white/15 flex items-center justify-center">
                          <span className="text-white/40 text-[10px] font-bold">B</span>
                        </div>
                        <div className="w-7 h-7 rounded-sm bg-[#333] border border-white/15 flex items-center justify-center">
                          <span className="text-shelley-amber text-[10px]">▼</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="text-white/80 font-mono text-xs font-bold">SLIDE</span>
                        {!isMobile && (
                          <span className="text-white/30 font-mono text-[10px] ml-2">↓ / S</span>
                        )}
                      </div>
                    </div>

                    {/* Advance (narrative) */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#333] border border-shelley-amber/30 flex items-center justify-center shrink-0">
                        <span className="text-shelley-amber text-[10px] font-bold">A</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-white/80 font-mono text-xs font-bold">TALK</span>
                        <span className="text-white/25 font-mono text-[10px] ml-2">during dialogue</span>
                        {!isMobile && (
                          <span className="text-white/30 font-mono text-[10px] ml-1">/ ENTER</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-white/25 font-mono leading-relaxed">
                      Jump on enemies to defeat them. Slide through them for bonus points.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStart}
                  className="px-10 py-3 bg-shelley-amber text-black font-bold text-lg rounded hover:bg-shelley-amber/90 transition-colors tracking-wider font-mono"
                >
                  START
                </button>
              </div>
            </div>
          )}

          {/* ─── LOADING SPINNER ─── */}
          {screen === "loading" && (
            <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shelley-amber" />
                <span className="text-white/40 text-sm font-mono">
                  Loading...
                </span>
              </div>
            </div>
          )}

          {/* ─── GAMEBOY CONTROLS (mobile, during gameplay) ─── */}
          {screen === "playing" && isMobile && (
            <GameBoyControls
              sendCommand={sendCommand}
              isNarrative={isNarrative}
            />
          )}

          {/* Skip button during gameplay */}
          {screen === "playing" && (
            <button
              onClick={handleSkip}
              className="absolute bottom-4 right-4 z-[101] px-3 py-1.5 text-xs font-mono text-white/30 hover:text-white/70 bg-black/30 hover:bg-black/50 rounded backdrop-blur-sm transition-all"
            >
              Skip Intro
            </button>
          )}
        </div>
      )}

      {/* Site content — revealed after game completes or is skipped */}
      <div className="flex flex-col gap-12">
        <section className="text-center py-20">
          <h2 className="text-6xl font-black mb-6 tracking-tight">
            CRAFTING <span className="text-shelley-amber">SOUND</span>, <br />
            BUILDING <span className="text-shelley-amber">LEGENDS</span>.
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Handcrafted guitars built with intention. Explore the workshop.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">The Workshop</h4>
            <p className="text-white/60 mb-6">Take a look inside the shop where every Shelley guitar is born.</p>
            <a href="/workshop" className="text-shelley-amber font-medium hover:underline">Go to Workshop &rarr;</a>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">The Gallery</h4>
            <p className="text-white/60 mb-6">Browse our completed works and custom orders.</p>
            <a href="/gallery" className="text-shelley-amber font-medium hover:underline">View Gallery &rarr;</a>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
            <h4 className="text-lg font-bold mb-4 uppercase">The Librarynth</h4>
            <p className="text-white/60 mb-6">Guitars, comics, music, and philosophy — the creative labyrinth.</p>
            <a href="/librarynth" className="text-shelley-amber font-medium hover:underline">Enter &rarr;</a>
          </div>
        </div>
      </div>
    </>
  );
}
