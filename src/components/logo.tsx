import Image from "next/image";
import { cn } from "@/lib/cn";
import { Zap } from "lucide-react";

export function Logo({ size = "md", dark = false }: { size?: "sm" | "md" | "lg"; dark?: boolean }) {
  const sizes = { sm: "h-7 w-7 text-sm", md: "h-9 w-9 text-lg", lg: "h-12 w-12 text-2xl" } as const;
  const textSizes = { sm: "text-base", md: "text-lg", lg: "text-xl" } as const;
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={cn("flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-lift", sizes[size])}>
        <Zap className="h-[55%] w-[55%]" fill="currentColor" />
      </span>
      <span className={cn("font-bold tracking-tight", textSizes[size], dark ? "text-white" : "text-ink")}>
        Career<span className="text-gradient">Catalyst</span>
      </span>
    </span>
  );
}

const AVATAR_GRADIENTS = [
  "from-primary-500 to-secondary-500",
  "from-success-500 to-info-500",
  "from-warning-400 to-danger-500",
  "from-secondary-500 to-danger-400",
  "from-info-500 to-primary-500",
  "from-danger-400 to-warning-400",
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const dims = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-24 w-24 text-3xl",
  } as const;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const gradient = AVATAR_GRADIENTS[hashCode(name) % AVATAR_GRADIENTS.length];

  if (src) {
    return (
      <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-soft", dims[size], className)}>
        <Image src={src} alt={name} fill sizes="96px" className="object-cover" unoptimized />
      </span>
    );
  }
  return (
    <span
      aria-label={name}
      role="img"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-2 ring-white shadow-soft", gradient, dims[size], className)}
    >
      {initials || "?"}
    </span>
  );
}
