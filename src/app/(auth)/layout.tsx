import Link from "next/link";
import { BadgeCheck, BookOpen, Code2, Sparkles, Trophy } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel (desktop) */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-primary-600/30 bg-blob" aria-hidden />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-secondary-600/25 bg-blob" aria-hidden />
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative">
          <Link href="/" aria-label="Back to home">
            <Logo size="md" dark />
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight">
            Build Skills.
            <br />
            <span className="text-gradient">Find Mentors.</span>
            <br />
            Accelerate Your Career.
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              { icon: BookOpen, text: "Structured courses from HTML to algorithms" },
              { icon: Code2, text: "Coding arena with instant test-case feedback" },
              { icon: Trophy, text: "Points, streaks and achievement badges" },
              { icon: Sparkles, text: "Real mentorship in cohort groups" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-4 w-4 text-secondary-300" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-400">
          <BadgeCheck className="h-4 w-4 text-success-400" />
          Passwords are hashed · Sessions are encrypted · Your data stays yours
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-8">
        <div className="mb-6 lg:hidden">
          <Link href="/" aria-label="Back to home">
            <Logo size="sm" />
          </Link>
        </div>
        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
