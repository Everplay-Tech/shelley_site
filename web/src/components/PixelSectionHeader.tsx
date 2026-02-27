interface PixelSectionHeaderProps {
  children: React.ReactNode;
  color?: "amber" | "blue" | "purple" | "green";
}

const glowMap = {
  amber: "crt-glow",
  blue: "crt-glow-blue",
  purple: "crt-glow-purple",
  green: "crt-glow",
};

const colorMap = {
  amber: "text-shelley-amber/60",
  blue: "text-shelley-spirit-blue/60",
  purple: "text-shelley-djinn-purple/60",
  green: "text-shelley-spirit-green/60",
};

export default function PixelSectionHeader({
  children,
  color = "amber",
}: PixelSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 my-10">
      <div className="pixel-divider flex-1" />
      <h2
        className={`font-pixel text-[8px] sm:text-[9px] tracking-[0.3em] uppercase ${colorMap[color]} ${glowMap[color]}`}
      >
        {children}
      </h2>
      <div className="pixel-divider flex-1" />
    </div>
  );
}
