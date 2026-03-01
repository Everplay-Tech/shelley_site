"use client";

interface PoAsideProps {
  quote: string;
  variant?: "default" | "compact";
  className?: string;
}

export default function PoAside({
  quote,
  variant = "default",
  className = "",
}: PoAsideProps) {
  const spriteSize = variant === "compact" ? "w-6 h-6" : "w-8 h-8";
  const bgSize = variant === "compact" ? "72px 18px" : "96px 24px";
  const textSize = variant === "compact" ? "text-[6px]" : "text-[7px]";

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Po idle sprite */}
      <div
        className={`sprite-anim animate-sprite-idle ${spriteSize} shrink-0`}
        style={{
          backgroundImage: "url(/sprites/po/idle_sheet.png)",
          backgroundSize: bgSize,
        }}
        aria-hidden="true"
        role="presentation"
      />
      {/* Speech bubble */}
      <div className="po-speech-bubble pixel-panel-inset px-3 py-2 max-w-md">
        <span className="font-pixel text-[6px] text-shelley-amber/50 tracking-wider block mb-1">
          PO
        </span>
        <p className={`font-pixel ${textSize} text-white/40 leading-relaxed italic`}>
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
