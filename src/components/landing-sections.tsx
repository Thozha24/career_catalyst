"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Award, BookOpen, Brain, ChevronDown, Code2, Flame, GraduationCap, LineChart, ListChecks,
  MessagesSquare, Rocket, ShieldCheck, Sparkles, Target, Trophy, Users,
} from "lucide-react";
import { Card, SectionHeading } from "./ui";

// ─── Stats strip ─────────────────────────────────────────────────────────────

export function StatsStrip() {
  const stats = [
    { value: "50+", label: "Interactive lessons" },
    { value: "25+", label: "Coding problems" },
    { value: "4", label: "Languages supported" },
    { value: "∞", label: "Skills to unlock" },
  ];
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3.5 text-center shadow-soft backdrop-blur">
          <p className="text-gradient text-2xl font-extrabold sm:text-3xl">{s.value}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

export function HowItWorks() {
  const steps = [
    { icon: GraduationCap, title: "Create your account", text: "Sign up as a student or a mentor in under a minute. Your journey is tailored from day one.", color: "bg-primary-50 text-primary-600" },
    { icon: Users, title: "Join a mentor group", text: "Use an invite code from your mentor to join a cohort, or create your own group as a mentor.", color: "bg-secondary-50 text-secondary-600" },
    { icon: Code2, title: "Learn & practice", text: "Work through structured courses, solve coding challenges and take mentor-assigned tests.", color: "bg-info-50 text-info-600" },
    { icon: Rocket, title: "Grow & get noticed", text: "Earn points, unlock achievements, climb leaderboards and build a profile recruiters trust.", color: "bg-success-50 text-success-600" },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="How it works" title="From sign-up to career-ready in four steps" description="A guided path that blends self-paced learning with real human mentorship." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} className="card-hover relative p-6">
              <span className="absolute right-5 top-4 text-4xl font-black text-slate-100">{i + 1}</span>
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5.5 w-5.5 h-[22px] w-[22px]" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Feature grids ───────────────────────────────────────────────────────────

export function StudentFeatures() {
  const features = [
    { icon: BookOpen, title: "Structured courses", text: "HTML to algorithms — bite-sized lessons with quizzes and code examples." },
    { icon: Code2, title: "Coding practice", text: "Solve problems in Python, Java, C++ and JavaScript with instant test-case feedback." },
    { icon: ListChecks, title: "Tests & assessments", text: "Timed, auto-graded tests with instant results and detailed question review." },
    { icon: Trophy, title: "Points & achievements", text: "Every lesson, problem and test earns points. Unlock badges as you level up." },
    { icon: LineChart, title: "Progress tracking", text: "Streaks, completion bars and score trends keep your growth visible." },
    { icon: Users, title: "Mentor groups", text: "Join your cohort, get tasks, submit work and receive real feedback." },
  ];
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="For students" title="Everything you need to level up" description="Practice, prove and showcase your skills — with mentors in your corner." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="card-hover p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-lift">
                <f.icon className="h-[22px] w-[22px]" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MentorFeatures() {
  const features = [
    { icon: Users, title: "Create & manage groups", text: "Spin up cohorts with invite codes, announcements and group stats." },
    { icon: Target, title: "Assign tests & tasks", text: "Build timed assessments with five question types and auto-grading." },
    { icon: LineChart, title: "Monitor performance", text: "Score trends, completion rates and per-student analytics dashboards." },
    { icon: MessagesSquare, title: "Give feedback", text: "Review submissions, comment, award points and request resubmissions." },
  ];
  return (
    <section className="bg-ink py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-300 ring-1 ring-inset ring-white/10">
            For mentors
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Guide the next generation of builders</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
            A command center for managing cohorts, assessments and student growth.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:bg-white/10">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-info-500 text-white">
                <f.icon className="h-[22px] w-[22px]" />
              </span>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Learning & coding showcase ──────────────────────────────────────────────

export function LearningShowcase() {
  const tracks = [
    "HTML", "CSS", "JavaScript", "Python", "Java", "C", "C++", "SQL",
    "Data Structures", "Algorithms", "Git & GitHub", "Web Development",
  ];
  return (
    <section id="learning" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Learning & coding"
              title="Learn by doing, not just watching"
              description="Every course blends concise theory, live code examples and quizzes. Then prove yourself in the coding arena with real test cases."
            />
            <div className="flex flex-wrap gap-2">
              {tracks.map((t) => (
                <span key={t} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-soft">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-shine inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 px-5 text-sm font-semibold text-white shadow-lift hover:from-primary-500 hover:to-secondary-500">
                Start Learning
              </Link>
              <Link href="/signup" className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50">
                Practice Coding
              </Link>
            </div>
          </div>
          <Card className="overflow-hidden p-0 shadow-lift">
            <div className="flex items-center gap-1.5 border-b border-slate-800 bg-ink px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-danger-400" />
              <span className="h-3 w-3 rounded-full bg-warning-400" />
              <span className="h-3 w-3 rounded-full bg-success-400" />
              <span className="ml-3 font-mono text-xs text-slate-400">solution.py — Career Catalyst</span>
            </div>
            <pre className="overflow-x-auto bg-ink p-5 font-mono text-[13px] leading-6 text-slate-200"><code>{`def fizzbuzz(n: int) -> list[str]:
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0: out.append("FizzBuzz")
        elif i % 3 == 0: out.append("Fizz")
        elif i % 5 == 0: out.append("Buzz")
        else: out.append(str(i))
    return out`}</code></pre>
            <div className="flex items-center justify-between border-t border-slate-100 bg-success-50 px-5 py-3.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-success-700">
                <ShieldCheck className="h-4 w-4" /> All 12 test cases passed
              </span>
              <span className="rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-bold text-success-700">+20 points</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ─── Groups, achievements & progress band ────────────────────────────────────

export function GroupsAndProgress() {
  const cards = [
    {
      id: "groups",
      icon: Users,
      title: "Mentorship groups",
      text: "Cohorts with invite codes, shared leaderboards, announcements and group tasks — learning is better together.",
      points: ["Invite-code joining", "Group announcements", "Group-only leaderboards", "Group statistics"],
      gradient: "from-primary-500 to-secondary-600",
    },
    {
      id: "achievements",
      icon: Trophy,
      title: "Points & achievements",
      text: "Points for lessons, problems, tests and tasks. Streak bonuses for showing up. Badges that make your profile shine.",
      points: ["Weekly & monthly points", "Learning streaks", "Unlockable badges", "Group leaderboards"],
      gradient: "from-warning-400 to-danger-500",
    },
    {
      id: "progress",
      icon: LineChart,
      title: "Progress tracking",
      text: "See exactly where you stand — course completion, score trends and pending work, for students and mentors alike.",
      points: ["Score trend charts", "Course completion", "Task pipelines", "Mentor analytics"],
      gradient: "from-success-500 to-info-500",
    },
  ];
  return (
    <section id="groups" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="Stay motivated" title="Gamified, guided and measurable" />
        <div className="grid gap-5 lg:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.id} className="card-hover p-6">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lift ${c.gradient}`}>
                <c.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.text}</p>
              <ul className="mt-4 space-y-2">
                {c.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                    <Sparkles className="h-4 w-4 shrink-0 text-secondary-500" /> {p}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────

export function Testimonials() {
  const quotes = [
    { name: "Priya S.", role: "CS junior · Student", text: "The timed tests and instant scoring pushed me to actually practice. My streak is at 43 days and counting!", gradient: "from-primary-500 to-secondary-500" },
    { name: "Daniel O.", role: "Frontend mentor", text: "I run two cohorts here. Creating tests, assigning tasks and reviewing submissions takes minutes, not evenings.", gradient: "from-success-500 to-info-500" },
    { name: "Aisha K.", role: "Bootcamp grad · Student", text: "The points and badges sound fun — but the profile with verified test scores is what got me interview calls.", gradient: "from-warning-400 to-danger-500" },
  ];
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="Loved by learners" title="Don't take our word for it" />
        <div className="grid gap-5 lg:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.name} className="card-hover p-6">
              <div className="flex gap-1 text-warning-500" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Award key={i} className="h-4 w-4" fill="currentColor" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">“{q.text}”</p>
              <div className="mt-5 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${q.gradient}`}>
                  {q.name[0]}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{q.name}</p>
                  <p className="text-xs text-slate-500">{q.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ (client accordion) ──────────────────────────────────────────────────

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.q} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <button
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span className="text-sm font-semibold text-ink">{item.q}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i ? <p className="animate-fade-in px-5 pb-4 text-sm leading-relaxed text-slate-600">{item.a}</p> : null}
        </div>
      ))}
    </div>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

export function FinalCta() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-secondary-600 to-info-600 px-6 py-16 text-center text-white shadow-lift sm:px-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 bg-blob" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-info-300/20 bg-blob" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset ring-white/20">
            <Flame className="h-3.5 w-3.5" /> Free to join · 2-minute setup
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your career won't wait. Start accelerating today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-100">
            Join as a learner or a mentor — either way, you're one profile away from your next breakthrough.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className="btn-shine inline-flex h-12 items-center rounded-xl bg-white px-8 text-base font-bold text-primary-700 shadow-lift transition-transform hover:scale-[1.03]">
              Get Started <Brain className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/signin" className="inline-flex h-12 items-center rounded-xl border-2 border-white/40 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
