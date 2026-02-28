"use client";

import { useState, useEffect, useCallback } from "react";

interface NarrativeLine {
  speaker?: string;
  text?: string;
}

interface Beat {
  id: string;
  trigger_type: string;
  trigger_distance?: number;
  trigger_count?: number;
  trigger_delay?: number;
  trigger_area?: string;
  lines: (string | NarrativeLine)[];
  signal?: string;
  _overridden?: boolean;
}

export default function NarrativeAdmin() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [expandedBeat, setExpandedBeat] = useState<string | null>(null);
  const [editingLines, setEditingLines] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Check for stored secret in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("shelley_admin_secret");
    if (stored) {
      setSecret(stored);
      setAuthenticated(true);
    }
  }, []);

  const fetchBeats = useCallback(async () => {
    try {
      const res = await fetch("/api/narrative");
      const data = await res.json();
      setBeats(data.beats ?? []);
    } catch {
      setMessage({ text: "Failed to fetch beats", type: "error" });
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchBeats();
    }
  }, [authenticated, fetchBeats]);

  const handleAuth = useCallback(() => {
    if (secret.trim()) {
      localStorage.setItem("shelley_admin_secret", secret.trim());
      setAuthenticated(true);
    }
  }, [secret]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("shelley_admin_secret");
    setSecret("");
    setAuthenticated(false);
    setBeats([]);
  }, []);

  const handleExpand = useCallback(
    (beatId: string) => {
      if (expandedBeat === beatId) {
        setExpandedBeat(null);
        return;
      }
      setExpandedBeat(beatId);
      const beat = beats.find((b) => b.id === beatId);
      if (beat) {
        // Format lines as pretty JSON for editing
        setEditingLines(JSON.stringify(beat.lines, null, 2));
      }
    },
    [expandedBeat, beats]
  );

  const handleSave = useCallback(
    async (beatId: string) => {
      setSaving(true);
      setMessage(null);

      try {
        // Validate JSON first
        const parsed = JSON.parse(editingLines);
        if (!Array.isArray(parsed)) {
          setMessage({ text: "Lines must be a JSON array", type: "error" });
          setSaving(false);
          return;
        }

        const res = await fetch("/api/narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: secret.trim(),
            beatId,
            lines: parsed,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage({
            text: data.error ?? "Save failed",
            type: "error",
          });
          if (res.status === 401) {
            // Bad secret — clear it
            localStorage.removeItem("shelley_admin_secret");
            setAuthenticated(false);
          }
        } else {
          setMessage({ text: `Beat "${beatId}" saved`, type: "success" });
          await fetchBeats();
        }
      } catch {
        setMessage({ text: "Invalid JSON", type: "error" });
      }

      setSaving(false);
    },
    [editingLines, secret, fetchBeats]
  );

  const handleRevert = useCallback(
    async (beatId: string) => {
      if (!confirm(`Revert "${beatId}" to default? This removes the override.`))
        return;

      setSaving(true);
      setMessage(null);

      try {
        const res = await fetch("/api/narrative", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: secret.trim(), beatId }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({
            text: data.error ?? "Revert failed",
            type: "error",
          });
        } else {
          setMessage({
            text: `Beat "${beatId}" reverted to default`,
            type: "success",
          });
          setExpandedBeat(null);
          await fetchBeats();
        }
      } catch {
        setMessage({ text: "Revert failed", type: "error" });
      }

      setSaving(false);
    },
    [secret, fetchBeats]
  );

  // ─── Auth screen ────────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="pixel-panel p-8">
            <h1 className="font-pixel text-sm tracking-widest text-shelley-amber crt-glow mb-6 text-center">
              NARRATIVE CMS
            </h1>
            <div className="mb-4">
              <label className="block font-pixel text-[8px] text-white/40 tracking-wider mb-2">
                ADMIN SECRET
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-shelley-amber/50 focus:outline-none transition-colors"
                placeholder="Enter admin secret..."
                autoFocus
              />
            </div>
            <button onClick={handleAuth} className="pixel-btn w-full">
              AUTHENTICATE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Beat trigger description ───────────────────────────────────────────────
  const triggerLabel = (beat: Beat) => {
    switch (beat.trigger_type) {
      case "distance":
        return `@ ${beat.trigger_distance}m`;
      case "piece_collected":
        return `@ ${beat.trigger_count} pieces`;
      case "post_morph_timer":
        return `${beat.trigger_delay}s post-morph`;
      case "area_entered":
        return `enter: ${beat.trigger_area}`;
      default:
        return beat.trigger_type;
    }
  };

  // ─── Main editor ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-pixel text-base sm:text-lg tracking-widest text-shelley-amber crt-glow">
              NARRATIVE CMS
            </h1>
            <p className="text-xs text-white/30 mt-1">
              Edit po_runner dialogue beats. Changes apply on next game load.
            </p>
          </div>
          <button onClick={handleLogout} className="pixel-btn-ghost text-xs">
            LOGOUT
          </button>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded border text-sm ${
              message.type === "success"
                ? "bg-green-900/20 border-green-500/30 text-green-400"
                : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Beat list */}
        <div className="space-y-3">
          {beats.map((beat, index) => (
            <div
              key={beat.id}
              className="pixel-panel overflow-hidden"
            >
              {/* Beat header (clickable) */}
              <button
                onClick={() => handleExpand(beat.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-pixel text-[8px] text-white/20 w-5 shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-pixel text-[9px] text-white/80 tracking-wider truncate">
                    {beat.id.toUpperCase().replace(/_/g, " ")}
                  </span>
                  {beat._overridden && (
                    <span className="font-pixel text-[7px] text-shelley-amber bg-shelley-amber/10 px-2 py-0.5 rounded tracking-wider shrink-0">
                      EDITED
                    </span>
                  )}
                  {beat.signal && (
                    <span className="font-pixel text-[7px] text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded tracking-wider shrink-0">
                      {beat.signal.toUpperCase().replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-pixel text-[7px] text-white/20 tracking-wider">
                    {triggerLabel(beat)}
                  </span>
                  <span className="text-white/20 text-xs">
                    {expandedBeat === beat.id ? "▼" : "▶"}
                  </span>
                </div>
              </button>

              {/* Expanded editor */}
              {expandedBeat === beat.id && (
                <div className="border-t border-white/5 p-4">
                  {/* Preview of current lines */}
                  <div className="mb-4">
                    <label className="block font-pixel text-[7px] text-white/30 tracking-wider mb-2">
                      PREVIEW ({beat.lines.length} LINES)
                    </label>
                    <div className="bg-black/40 rounded p-3 space-y-1.5 max-h-48 overflow-y-auto">
                      {beat.lines.map((line, i) => {
                        const isDict = typeof line === "object" && line !== null;
                        const speaker = isDict
                          ? (line as NarrativeLine).speaker
                          : "Po";
                        const text = isDict
                          ? (line as NarrativeLine).text
                          : String(line);
                        return (
                          <div key={i} className="flex gap-2 text-xs">
                            <span
                              className={`font-pixel text-[7px] tracking-wider shrink-0 ${
                                speaker === "Magus"
                                  ? "text-cyan-400"
                                  : "text-shelley-amber"
                              }`}
                            >
                              {speaker}:
                            </span>
                            <span className="text-white/60">{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* JSON editor */}
                  <div className="mb-4">
                    <label className="block font-pixel text-[7px] text-white/30 tracking-wider mb-2">
                      EDIT LINES (JSON)
                    </label>
                    <textarea
                      value={editingLines}
                      onChange={(e) => setEditingLines(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-3 text-xs text-white/80 font-mono focus:border-shelley-amber/50 focus:outline-none transition-colors leading-relaxed resize-y"
                      rows={Math.min(20, editingLines.split("\n").length + 2)}
                      spellCheck={false}
                    />
                    <p className="text-[10px] text-white/20 mt-1">
                      Each line: <code className="text-white/30">&quot;plain string&quot;</code> (Po speaks) or{" "}
                      <code className="text-white/30">{`{"speaker": "Name", "text": "..."}`}</code>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSave(beat.id)}
                      disabled={saving}
                      className="pixel-btn text-xs"
                    >
                      {saving ? "SAVING..." : "SAVE"}
                    </button>
                    {beat._overridden && (
                      <button
                        onClick={() => handleRevert(beat.id)}
                        disabled={saving}
                        className="pixel-btn-ghost text-xs text-red-400 border-red-400/20 hover:bg-red-400/10"
                      >
                        REVERT TO DEFAULT
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedBeat(null)}
                      className="pixel-btn-ghost text-xs"
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-white/15">
            Overrides are stored in the database and sent to the Godot game on
            load. The game falls back to bundled defaults if the API is
            unreachable.
          </p>
        </div>
      </div>
    </div>
  );
}
