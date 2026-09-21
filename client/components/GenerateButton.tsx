import { useState, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  activeLabel?: string;
  hue?: number;
  asChild?: boolean;
}

export function GenerateButton({ label = "Generate", activeLabel = "Generating", hue = 210, className, onClick, onFocus, asChild = false, ...props }: GenerateButtonProps) {
  const [active, setActive] = useState(false);
  const activate = () => setActive(true);
  const Component = asChild ? Slot : "button";

  return (
    <Component
      {...props}
      type={asChild ? undefined : props.type || "button"}
      data-generating={active}
      style={{ "--gen-hue": hue } as React.CSSProperties}
      onFocus={(event) => { activate(); onFocus?.(event); }}
      onClick={(event) => { activate(); onClick?.(event); }}
      className={cn("gen-btn group relative inline-flex h-12 w-[170px] items-center justify-center overflow-hidden rounded-full text-sm text-neutral-300 transition-all duration-150 hover:scale-[1.01] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60", className)}
    >
      <Sparkles className="absolute left-5 size-4 text-white/60 transition-colors group-hover:text-white/90" aria-hidden="true" />
      <span className="gen-txt-wrapper relative z-10">
        <span className="gen-txt-1" aria-hidden={active}>{label.split("").map((letter, index) => <span key={`${letter}-${index}`} className="gen-btn-letter" style={{ "--letter-index": index } as React.CSSProperties}>{letter}</span>)}</span>
        <span className="gen-txt-2" aria-hidden={!active}>{activeLabel.split("").map((letter, index) => <span key={`${letter}-${index}`} className="gen-btn-letter" style={{ "--letter-index": index } as React.CSSProperties}>{letter}</span>)}</span>
      </span>
      <span className="sr-only">{active ? activeLabel : label}</span>
    </Component>
  );
}
