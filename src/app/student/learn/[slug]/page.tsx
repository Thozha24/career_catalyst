import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CheckCircle2, Circle, ChevronLeft, PlayCircle, Code2 } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, Progress, Badge, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireStudent();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course || !course.isActive) notFound();

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lesson: { module: { courseId: course.id } } },
    select: { lessonId: true },
  });
  const doneSet = new Set(progress.map((p) => p.lessonId));
  const lessons = course.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => doneSet.has(l.id)).length;
  const pct = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((l) => !doneSet.has(l.id)) ?? lessons[0];

  return (
    <>
      <Link href="/student/learn" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ChevronLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <div className={cn("relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white sm:p-8", course.coverGradient)}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" className="!bg-white/20 !text-white !ring-white/30">{course.level}</Badge>
            <Badge tone="neutral" className="!bg-white/20 !text-white !ring-white/30">{course.category}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="min-w-[180px] flex-1">
              <Progress value={pct} className="!bg-white/25" tone={pct === 100 ? "success" : "primary"} />
            </div>
            <span className="text-sm font-semibold">{done}/{lessons.length} lessons · {pct}%</span>
            {nextLesson ? (
              <ButtonLink href={`/student/learn/${course.slug}/${nextLesson.id}`} variant="outline" size="sm" className="!bg-white !text-slate-800 hover:!bg-slate-100">
                <PlayCircle className="h-4 w-4" /> {done > 0 ? "Continue" : "Start course"}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {course.modules.map((mod, mi) => (
          <Card key={mod.id}>
            <CardBody>
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700">
                  {mi + 1}
                </span>
                {mod.title}
              </h2>
              <ul className="divide-y divide-slate-100">
                {mod.lessons.map((lesson) => {
                  const isDone = doneSet.has(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/student/learn/${course.slug}/${lesson.id}`}
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-primary-50/60"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600" aria-label="Completed" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-primary-400" aria-label="Not completed" />
                        )}
                        <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-primary-700">{lesson.title}</span>
                        {lesson.codeExample ? <Code2 className="h-4 w-4 text-slate-300" aria-hidden /> : null}
                        <span className="text-xs text-slate-400">+{lesson.pointsAward} pts</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
        <BookOpen className="h-3.5 w-3.5" /> Lessons and quiz results are stored on the server — your progress follows you across devices.
      </p>
    </>
  );
}
