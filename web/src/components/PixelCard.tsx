import { clsx } from "clsx";

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "raised" | "inset";
  hover?: boolean;
}

export default function PixelCard({
  children,
  className,
  variant = "default",
  hover = true,
}: PixelCardProps) {
  return (
    <div
      className={clsx(
        variant === "default" && "pixel-panel",
        variant === "raised" && "pixel-panel-raised",
        variant === "inset" && "pixel-panel-inset",
        hover &&
          "transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px]",
        "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
