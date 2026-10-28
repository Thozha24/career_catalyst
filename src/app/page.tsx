import Link from "next/link";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Code2, Flame, Sparkles, Trophy,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import {
  FaqAccordion, FinalCta, GroupsAndProgress, HowItWorks, LearningShowcase,
  MentorFeatures, StatsStrip, StudentFeatures, Testimonials,
} from "@/components/landing-sections";
import { Logo } from "@/components/logo";
import { FAQ_ITEMS } from "@/components/faq-data";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <SiteNav />

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-primary-200/40 bg-blob" aria-hidden />
        <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-secondary-200/40 bg-blob" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-info-100/60 bg-blob" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-1.5 text-xs font-semibold text-primary-700 shadow-soft backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-secondary-500" />
              Learning, mentorship & assessments in one place
            </span>
            <h1 className="animate-fade-in-up animate-delay-100 mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Build Skills.{" "}
              <span className="text-gradient">Find Mentors.</span>{" "}
              Accelerate Your Career.
            </h1>
            <p className="animate-fade-in-up animate-delay-200 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Career Catalyst blends structured courses, a hands-on coding arena, timed assessments and
              mentor-led groups — with points, streaks and achievements to keep you moving.
            </p>
            <div className="animate-fade-in-up animate-delay-300 mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn-shine inline-flex h-12 animate-pop items-center items-center rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 px-8 text-base font-bold text-white shadow-lift transition-all hover:-translate-y-0.5 hover:from-primary-500 hover:to-secondary-500"
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/signin"
                className="inline-flex h-12 items-center rounded-xl border border-slate-300 bg-white/90 px-8 text-base font-semibold text-slate-700 shadow-soft backdrop-blur transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                Sign In
              </Link>
            </div>
            <p className="animate-fade-in-up animate-delay-500 mt-5 text-xs font-medium text-slate-400">
              Free to join · No credit card · Join as student or mentor
            </p>
          </div>

          <div className="animate-fade-in-up animate-delay-500 mt-14">
            <StatsStrip />
          </div>

          {/* Floating dashboard mock */}
          <div className="animate-fade-in-up animate-delay-500 mx-auto mt-14 max-w-4xl">
            <div className="card-hover rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lift backdrop-blur sm:p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: BookOpen, label: "Courses in progress", value: "3", sub: "64% complete", tone: "bg-primary-50 text-primary-600" },
                  { icon: Code2, label: "Problems solved", value: "27", sub: "+4 this week", tone: "bg-info-50 text-info-600" },
                  { icon: Trophy, label: "Points earned", value: "1,240", sub: "Rank #3 in group", tone: "bg-warning-50 text-warning-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-100 bg-surface p-4">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
                      <s.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    </span>
                    <p className="mt-3 text-xs font-medium text-slate-500">{s.label}</p>
                    <p className="text-2xl font-bold text-ink">{s.value}</p>
                    <p className="text-xs font-medium text-success-600">{s.sub}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success-500" /> Auto-graded tests</span>
                <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-warning-500" /> Daily streaks</span>
                <span className="flex items-center gap-1.5"><Brain className="h-4 w-4 text-secondary-500" /> Mentor feedback</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <StudentFeatures />
      <MentorFeatures />
      <LearningShowcase />
      <GroupsAndProgress />
      <Testimonials />
      <FaqSectionWrapper />
      <FinalCta />

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
            <div className="max-w-sm text-center md:text-left">
              <Logo size="sm" />
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                The career-learning platform where students build skills with structure — and grow with mentors.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-center sm:grid-cols-3 md:text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink">Platform</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  <li><Link href="#learning" className="hover:text-primary-600">Courses</Link></li>
                  <li><Link href="#features" className="hover:text-primary-600">Coding practice</Link></li>
                  <li><Link href="#groups" className="hover:text-primary-600">Mentorship</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink">Account</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  <li><Link href="/signup" className="hover:text-primary-600">Get started</Link></li>
                  <li><Link href="/signin" className="hover:text-primary-600">Sign in</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink">Legal</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  <li><span className="cursor-default">Privacy</span></li>
                  <li><span className="cursor-default">Terms</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} Career Catalyst. All rights reserved.</p>
            <p>Built for learners & mentors, with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FaqSectionWrapper() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 ring-1 ring-inset ring-primary-100">
          FAQ
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Questions, answered</h2>
        <div className="mt-10 text-left">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </div>
    </section>
  );
}
