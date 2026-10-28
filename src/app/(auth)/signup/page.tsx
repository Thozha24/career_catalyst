import Link from "next/link";
import { ArrowRight, GraduationCap, Briefcase } from "lucide-react";

export const metadata = { title: "Get Started" };

export default function SignupChoicePage() {
  const options = [
    {
      href: "/signup/student",
      icon: GraduationCap,
      title: "Student",
      description: "Learn, practice, take tests and grow with a mentor.",
      gradient: "from-primary-500 to-secondary-600",
      cta: "Join as Student",
    },
    {
      href: "/signup/mentor",
      icon: Briefcase,
      title: "Mentor",
      description: "Guide students, assign tasks and monitor progress.",
      gradient: "from-success-500 to-info-600",
      cta: "Join as Mentor",
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Choose your account type</h1>
        <p className="mt-2 text-sm text-slate-500">You can pick this once at registration — it shapes your whole experience.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <Link
            key={o.title}
            href={o.href}
            className="card-hover group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-soft focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lift ${o.gradient}`}>
              <o.icon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink">{o.title}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">{o.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
              {o.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
