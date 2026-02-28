"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import GodotEmbed from "@/components/GodotEmbed";
import type { GodotEmbedHandle } from "@/components/GodotEmbed";
import GameBoyControls from "@/components/GameBoyControls";
import PixelCard from "@/components/PixelCard";
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
  const [showReward, setShowReward] = useState(false);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [rewardDismissing, setRewardDismissing] = useState(false);
  const embedRef = useRef<GodotEmbedHandle>(null);

  useEffect(() => {
    const touch =
      navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    setIsMobile(touch);
  }, []);

  const isNgPlus = gameConfig.mode === "ng_plus";

  useEffect(() => {
    const returning = hasCookie(ONBOARDING_COOKIE) || progress.onboardingComplete;
    setGameConfig(getLandingGame(returning));
  }, [progress.onboardingComplete]);

  const dismissReward = useCallback(() => {
    setRewardDismissing(true);
    setTimeout(() => {
      setShowReward(false);
      setRewardDismissing(false);
    }, 500);
  }, []);

  const handleGodotEvent = useCallback((event: GodotEvent) => {
    emitGameEvent(event);
    switch (event.type) {
      case "game_ready":
        setScreen((prev) => (prev === "loading" ? "welcome" : prev));
        // Send any narrative overrides from the CMS to the game
        fetch("/api/narrative")
          .then((r) => r.json())
          .then((data) => {
            const overridden = (data.beats ?? []).filter(
              (b: { _overridden?: boolean }) => b._overridden
            );
            if (overridden.length > 0) {
              embedRef.current?.sendCommand({
                command: "update_narrative",
                data: { beats: overridden },
              });
            }
          })
          .catch(() => {
            /* CMS unavailable — game uses bundled defaults */
          });
        break;
      case "narrative_start":
        setIsNarrative(true);
        break;
      case "narrative_end":
        setIsNarrative(false);
        break;
      case "piece_collected":
        if ("data" in event) {
          reportGameEvent({
            type: "piece_collected",
            gameName: "po_runner",
            pieceIndex: event.data.piece,
            pieceTotal: event.data.total,
          });
        }
        break;
      case "onboarding_complete":
        reportGameEvent({ type: "onboarding_complete", gameName: "po_runner" }).then((p) => {
          // If player collected all 6 pieces, prepare reward reveal
          if (p.rewardCode) {
            setRewardCode(p.rewardCode);
          }
        });
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

  // Show reward once we have a code and game is done
  useEffect(() => {
    if (rewardCode && !showGame && !showReward) {
      const timer = setTimeout(() => setShowReward(true), 600);
      return () => clearTimeout(timer);
    }
  }, [rewardCode, showGame, showReward]);

  // Auto-dismiss reward after 12 seconds
  useEffect(() => {
    if (showReward && !rewardDismissing) {
      const timer = setTimeout(dismissReward, 12000);
      return () => clearTimeout(timer);
    }
  }, [showReward, rewardDismissing, dismissReward]);

  const handlePlay = useCallback(() => {
    setScreen("controls");
  }, []);

  const handleStart = useCallback(() => {
    setScreen("playing");
    embedRef.current?.sendCommand({
      command: "start",
      data: { mode: (gameConfig.mode as "standard" | "ng_plus") ?? "standard" },
    });
  }, [gameConfig.mode]);

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
      {/* Full-screen game overlay */}
      {showGame && (
        <div
          className={`fixed inset-0 z-[100] bg-black transition-opacity duration-700 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Game iframe */}
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
              <div className="pixel-panel p-8 sm:p-10 flex flex-col items-center gap-6 text-center max-w-md mx-4">
                <div>
                  <h1 className="font-pixel text-lg sm:text-2xl tracking-wider text-shelley-amber crt-glow mb-2">
                    {isNgPlus ? "PO'S BACK" : "WELCOME!"}
                  </h1>
                  <p className="font-pixel text-[8px] sm:text-[9px] text-white/70 tracking-wider">
                    {isNgPlus ? "STRONGER. WITH NEW POWERS." : "TO OUR LABS!!!"}
                  </p>
                </div>

                <p className="text-xs text-white/40">
                  {isNgPlus
                    ? "New jacket. More health. Smoke arm attacks."
                    : "Choose to play or skip intro. Have a nice day"}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button onClick={handlePlay} className="pixel-btn">
                    PLAY
                  </button>
                  <button onClick={handleSkip} className="pixel-btn-ghost">
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
                <h2 className="font-pixel text-sm tracking-widest text-white/80 crt-glow">
                  CONTROLS
                </h2>

                {/* Controller infographic card */}
                <div className="pixel-panel p-6 sm:p-8 w-full">
                  {/* Game Boy layout with callouts */}
                  <div className="flex items-center justify-between mb-6">
                    {/* D-pad visual */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-[72px] h-[72px]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute w-[24px] h-[66px] bg-[#333] rounded-[2px]" />
                          <div className="absolute w-[66px] h-[24px] bg-[#333] rounded-[2px]" />
                        </div>
                        <div className="absolute top-[4px] left-1/2 -translate-x-1/2 text-white/20 text-[10px]">&#9650;</div>
                        <div className="absolute top-1/2 left-[6px] -translate-y-1/2 text-shelley-amber text-[10px]">&#9664;</div>
                        <div className="absolute top-1/2 right-[6px] -translate-y-1/2 text-shelley-amber text-[10px]">&#9654;</div>
                        <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 text-shelley-amber text-[10px]">&#9660;</div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/10" />
                      </div>
                      <span className="font-pixel text-[7px] text-white/30 tracking-wider">D-PAD</span>
                    </div>

                    {/* A/B/C visual */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`relative ${isNgPlus ? "w-[90px] h-[70px]" : "w-[72px] h-[60px]"}`}>
                        <div className="absolute top-0 left-0 w-[32px] h-[32px] rounded-full bg-[#333] border border-white/15 flex items-center justify-center">
                          <span className="text-white/40 text-xs font-bold">B</span>
                        </div>
                        <div className="absolute bottom-0 right-0 w-[32px] h-[32px] rounded-full bg-[#333] border border-shelley-amber/30 flex items-center justify-center">
                          <span className="text-shelley-amber text-xs font-bold">A</span>
                        </div>
                        {isNgPlus && (
                          <div className="absolute top-0 right-0 w-[28px] h-[28px] rounded-full bg-[#333] border border-purple-400/30 flex items-center justify-center">
                            <span className="text-purple-400 text-[10px] font-bold">C</span>
                          </div>
                        )}
                      </div>
                      <span className="font-pixel text-[7px] text-white/30 tracking-wider">BUTTONS</span>
                    </div>
                  </div>

                  <div className="pixel-divider mb-5" />

                  {/* Action callouts */}
                  <div className="flex flex-col gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#333] border border-shelley-amber/30 flex items-center justify-center shrink-0">
                        <span className="text-shelley-amber text-[10px] font-bold">A</span>
                      </div>
                      <div className="flex-1">
                        <span className="font-pixel text-[8px] text-white/70 tracking-wider">JUMP</span>
                        {!isMobile && (
                          <span className="text-white/25 font-mono text-[10px] ml-2">SPACE / &#8593;</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#333] border border-white/15 flex items-center justify-center">
                          <span className="text-white/40 text-[10px] font-bold">B</span>
                        </div>
                        <div className="w-7 h-7 rounded-sm bg-[#333] border border-white/15 flex items-center justify-center">
                          <span className="text-shelley-amber text-[10px]">&#9660;</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="font-pixel text-[8px] text-white/70 tracking-wider">SLIDE</span>
                        {!isMobile && (
                          <span className="text-white/25 font-mono text-[10px] ml-2">&#8595; / S</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#333] border border-shelley-amber/30 flex items-center justify-center shrink-0">
                        <span className="text-shelley-amber text-[10px] font-bold">A</span>
                      </div>
                      <div className="flex-1">
                        <span className="font-pixel text-[8px] text-white/70 tracking-wider">TALK</span>
                        <span className="text-white/20 font-mono text-[10px] ml-2">during dialogue</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 shrink-0">
                        <div className="w-7 h-7 rounded-sm bg-[#333] border border-shelley-amber/20 flex items-center justify-center">
                          <span className="text-shelley-amber text-[10px]">&#9664;</span>
                        </div>
                        <div className="w-7 h-7 rounded-sm bg-[#333] border border-shelley-amber/20 flex items-center justify-center">
                          <span className="text-shelley-amber text-[10px]">&#9654;</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="font-pixel text-[8px] text-white/70 tracking-wider">MOVE</span>
                        <span className="text-white/20 font-mono text-[10px] ml-2">during fights &amp; after morph</span>
                        {!isMobile && (
                          <span className="text-white/25 font-mono text-[10px] ml-2">A/D / &#8592;&#8594;</span>
                        )}
                      </div>
                    </div>

                    {isNgPlus && (
                      <>
                        <div className="pixel-divider my-1" />
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#333] border border-purple-400/40 flex items-center justify-center shrink-0">
                            <span className="text-purple-400 text-[10px] font-bold">C</span>
                          </div>
                          <div className="flex-1">
                            <span className="font-pixel text-[8px] text-white/70 tracking-wider">ATTACK</span>
                            <span className="text-white/20 font-mono text-[10px] ml-2">tap = fist, hold = whip</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tip */}
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <p className="font-pixel text-[7px] text-white/20 leading-relaxed tracking-wider">
                      {isNgPlus
                        ? "STOMP OR SLIDE ENEMIES. TAP C FOR SPIRIT FIST. HOLD C FOR GHOST WHIP."
                        : "JUMP ON ENEMIES TO DEFEAT THEM. SLIDE THROUGH FOR BONUS POINTS."}
                    </p>
                  </div>
                </div>

                <button onClick={handleStart} className="pixel-btn">
                  START
                </button>
              </div>
            </div>
          )}

          {/* ─── LOADING ─── */}
          {screen === "loading" && (
            <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4">
                <span className="font-pixel text-xs text-shelley-amber animate-pulse crt-glow tracking-wider">
                  LOADING
                </span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-shelley-amber animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── GAMEBOY CONTROLS ─── */}
          {screen === "playing" && isMobile && (
            <GameBoyControls
              sendCommand={sendCommand}
              isNarrative={isNarrative}
              isNgPlus={isNgPlus}
            />
          )}

          {/* Skip button during gameplay */}
          {screen === "playing" && (
            <button
              onClick={handleSkip}
              className="absolute bottom-4 right-4 z-[101] pixel-btn-ghost"
            >
              SKIP
            </button>
          )}
        </div>
      )}

      {/* ─── REWARD REVEAL ─── */}
      {showReward && rewardCode && (
        <div
          className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
            rewardDismissing ? "opacity-0" : "opacity-100"
          }`}
          onClick={dismissReward}
        >
          <div
            className="pixel-panel p-8 sm:p-10 max-w-md mx-4 text-center animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Six amber diamonds */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-shelley-amber rotate-45 animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>

            <h2 className="font-pixel text-sm sm:text-base tracking-widest text-shelley-amber crt-glow mb-2">
              THE FORBIDDEN SIX
            </h2>
            <p className="font-pixel text-[8px] text-white/50 tracking-wider mb-6">
              ALL PIECES COLLECTED
            </p>

            <div className="pixel-divider mb-6" />

            <p className="text-xs text-white/40 mb-3">
              Your reward for completing the journey:
            </p>

            {/* Discount code display */}
            <div className="bg-black/50 border border-shelley-amber/30 rounded px-6 py-4 mb-4">
              <p className="font-pixel text-[8px] text-white/30 tracking-wider mb-1">
                DISCOUNT CODE
              </p>
              <p className="font-pixel text-lg sm:text-xl text-shelley-amber crt-glow tracking-[0.3em]">
                {rewardCode}
              </p>
              <p className="font-pixel text-[8px] text-white/30 tracking-wider mt-1">
                25% OFF YOUR FIRST CUSTOM BUILD
              </p>
            </div>

            <p className="text-[10px] text-white/25 mb-5">
              Use this code when you commission a Shelley Guitar build.
            </p>

            <button onClick={dismissReward} className="pixel-btn-ghost text-xs">
              CONTINUE TO SITE
            </button>
          </div>
        </div>
      )}

      {/* Site content — revealed after game completes or is skipped */}
      <div className="flex flex-col gap-12">
        <section className="text-center py-16">
          <h2 className="font-pixel text-xl sm:text-3xl tracking-wider mb-6 crt-glow leading-relaxed">
            CRAFTING <span className="text-shelley-amber">SOUND</span>,{" "}
            <br className="sm:hidden" />
            BUILDING <span className="text-shelley-amber">LEGENDS</span>.
          </h2>
          <p className="text-base text-white/50 max-w-2xl mx-auto">
            Handcrafted guitars built with intention. Explore the workshop.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PixelCard>
            <h4 className="font-pixel text-[9px] text-white/80 mb-3 tracking-wider">THE WORKSHOP</h4>
            <p className="text-white/45 text-sm mb-5">Take a look inside the shop where every Shelley guitar is born.</p>
            <a href="/workshop" className="pixel-btn-ghost">GO &rarr;</a>
          </PixelCard>
          <PixelCard>
            <h4 className="font-pixel text-[9px] text-white/80 mb-3 tracking-wider">THE GALLERY</h4>
            <p className="text-white/45 text-sm mb-5">Browse our completed works and custom orders.</p>
            <a href="/gallery" className="pixel-btn-ghost">VIEW &rarr;</a>
          </PixelCard>
          <PixelCard>
            <h4 className="font-pixel text-[9px] text-white/80 mb-3 tracking-wider">THE LIBRARYNTH</h4>
            <p className="text-white/45 text-sm mb-5">Guitars, comics, music, and philosophy — the creative labyrinth.</p>
            <a href="/librarynth" className="pixel-btn-ghost">ENTER &rarr;</a>
          </PixelCard>
        </div>
      </div>
    </>
  );
}
