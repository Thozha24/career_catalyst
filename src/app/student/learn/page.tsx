import Link from "next/link";
import { BookOpen, Clock3, ChevronRight } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Progress, Badge, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await requireStudent();
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      modules: { select: { lessons: { select: { id: true } } } },
    },
  });
  const completed = await prisma.lessonProgress.findMany({
    where: { userId: user.id },
    select: { lessonId: true },
  });
  const doneSet = new Set(completed.map((c) => c.lessonId));

  const categories = [...new Set(courses.map((c) => c.category))];

  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Learning Catalog"
        description="Structured courses with lessons, code examples and quizzes. Progress is saved automatically as you complete lessons."
      />

      {courses.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No courses yet" description="Courses will appear here once your admin publishes them." />
      ) : (
        categories.map((category) => (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-ink">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courses
                .filter((c) => c.category === category)
                .map((course) => {
                  const lessons = course.modules.flatMap((m) => m.lessons);
                  const done = lessons.filter((l) => doneSet.has(l.id)).length;
                  const pct = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;
                  return (
                    <Link key={course.id} href={`/student/learn/${course.slug}`} className="group">
                      <div className="card-hover flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
                        <div className={cn("relative flex h-28 items-end bg-gradient-to-br p-4", course.coverGradient)}>
                          <div className="absolute inset-0 bg-grid opacity-20" />
                          <div>
                            <Badge tone="neutral" className="!bg-white/20 !text-white !ring-white/30 backdrop-blur">
                              {course.level}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <h3 className="font-bold text-ink group-hover:text-primary-700">{course.title}</h3>
                          <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{course.description}</p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                            <BookOpen className="h-3.5 w-3.5" /> {lessons.length} lessons
                            <span className="mx-1">·</span>
                            {done > 0 ? `${pct}% complete` : "Not started"}
                          </div>
                          <div className="mt-2">
                            <Progress value={pct} tone={pct === 100 ? "success" : "primary"} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))
      )}
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock3 className="h-3.5 w-3.5" /> Tip: complete lessons daily to grow your streak and earn points.
      </p>
    </>
  );
}
