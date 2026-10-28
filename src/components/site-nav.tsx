"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/cn";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#learning", label: "Learning" },
    { href: "#groups", label: "Mentorship" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-slate-200/70 bg-white/85 shadow-soft backdrop-blur-lg" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link href="/" aria-label="Career Catalyst home">
          <Logo size="sm" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/signin" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-ink">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-shine inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 px-5 text-sm font-semibold text-white shadow-lift transition-all hover:from-primary-500 hover:to-secondary-500"
          >
            Get Started
          </Link>
        </div>

        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open ? (
        <div className="animate-fade-in border-t border-slate-100 bg-white px-4 pb-6 pt-3 shadow-lift lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {l.label}
              </a>
            ))}
            <hr className="my-2 border-slate-100" />
            <Link href="/signin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-sm font-semibold text-white shadow-lift"
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
