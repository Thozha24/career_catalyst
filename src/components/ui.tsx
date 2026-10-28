import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "btn-shine bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lift hover:from-primary-500 hover:to-secondary-500 active:from-primary-700 active:to-secondary-700",
  secondary: "bg-secondary-100 text-secondary-700 hover:bg-secondary-200 active:bg-secondary-300",
  outline: "border border-slate-300 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-ink active:bg-slate-200",
  danger: "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-600/80",
  success: "bg-gradient-to-r from-success-600 to-info-600 text-white hover:from-success-700 hover:to-info-700",
  warning: "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-600/80",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition-all duration-150",
    "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
    buttonVariants[variant],
    buttonSizes[size],
    extra
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-soft", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">{icon}</div> : null}
        <div>
          <h3 className="text-sm font-semibold text-ink sm:text-base">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

// ─── Form controls ───────────────────────────────────────────────────────────

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="label-base">
      {children}
      {hint ? <span className="ml-1 font-normal text-slate-400">({hint})</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input-base", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input-base min-h-[90px]", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("input-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat pr-9", className)} {...props}>
      {children}
    </select>
  );
}

// ─── Badge, Progress, misc ───────────────────────────────────────────────────

export type BadgeTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral" | "secondary";

const badgeTones: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary-700 ring-primary-200",
  secondary: "bg-secondary-50 text-secondary-700 ring-secondary-200",
  success: "bg-success-50 text-success-700 ring-success-100",
  warning: "bg-warning-50 text-warning-700 ring-warning-100",
  danger: "bg-danger-50 text-danger-700 ring-danger-100",
  info: "bg-info-50 text-info-700 ring-info-100",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function Progress({ value, max = 100, tone = "primary", className }: { value: number; max?: number; tone?: "primary" | "success" | "warning" | "danger"; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  const tones = {
    primary: "from-primary-500 to-secondary-500",
    success: "from-success-500 to-info-500",
    warning: "from-warning-400 to-warning-600",
    danger: "from-danger-400 to-danger-600",
  } as const;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatCard({ label, value, icon, hint, tone = "primary" }: { label: string; value: ReactNode; icon?: ReactNode; hint?: ReactNode; tone?: "primary" | "success" | "warning" | "info" | "danger" | "secondary" }) {
  const tones = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    info: "bg-info-50 text-info-600",
    danger: "bg-danger-50 text-danger-600",
    secondary: "bg-secondary-50 text-secondary-600",
  } as const;
  return (
    <Card className="card-hover p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        {icon ? <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tones[tone])}>{icon}</div> : null}
      </div>
    </Card>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      {icon ? <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-soft">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      role="status"
      aria-label="Loading"
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SectionHeading({ eyebrow, title, description, center }: { eyebrow?: string; title: ReactNode; description?: string; center?: boolean }) {
  return (
    <div className={cn("mb-10", center && "text-center")}>
      {eyebrow ? (
        <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 ring-1 ring-inset ring-primary-100">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {description ? <p className={cn("mt-3 text-base leading-relaxed text-slate-600", center && "mx-auto max-w-2xl")}>{description}</p> : null}
    </div>
  );
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "danger"; title?: string; children: ReactNode }) {
  const tones = {
    info: "bg-info-50 text-info-700 ring-info-100",
    success: "bg-success-50 text-success-700 ring-success-100",
    warning: "bg-warning-50 text-warning-700 ring-warning-100",
    danger: "bg-danger-50 text-danger-700 ring-danger-100",
  } as const;
  return (
    <div className={cn("rounded-xl px-4 py-3 text-sm ring-1 ring-inset", tones[tone])} role="alert">
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-0.5" : undefined}>{children}</div>
    </div>
  );
}
