import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { Card, CardBody, Badge } from "@/components/ui";
import { LessonActions } from "./lesson-actions";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const user = await requireStudent();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: { select: { id: true, slug: true, title: true } },
          lessons: { orderBy: { order: "asc" }, select: { id: true, title: true } },
        },
      },
    },
  });
  if (!lesson) notFound();
  if (lesson.module.course.slug !== slug) notFound();

  const [completed, siblings] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      select: { completedAt: true },
    }),
    prisma.lesson.findMany({
      where: { module: { courseId: lesson.module.course.id } },
      orderBy: [{ moduleId: "asc" }, { order: "asc" }],
      select: { id: true, title: true },
    }),
  ]);

  const idx = siblings.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  let quiz: { question: string; options: string[] }[] = [];
  try {
    const parsed = JSON.parse(lesson.quiz);
    if (Array.isArray(parsed)) quiz = parsed;
  } catch {
    quiz = [];
  }

  return (
    <>
      <Link href={`/student/learn/${slug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
        <ChevronLeft className="h-4 w-4" /> {lesson.module.course.title}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="mb-4">
            <Badge tone="primary">{lesson.module.title}</Badge>
            <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{lesson.title}</h1>
          </div>
          {completed ? (
            <div className="mb-4 rounded-xl bg-success-50 px-4 py-2.5 text-sm font-medium text-success-700 ring-1 ring-inset ring-success-100">
              ✓ Completed on {completed.completedAt.toLocaleDateString()} — you can review anytime.
            </div>
          ) : null}
          <Card>
            <CardBody>
              <div className="prose-cc">{renderMarkdown(lesson.content)}</div>
            </CardBody>
          </Card>

          {lesson.codeExample ? (
            <Card className="mt-6 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-800 bg-ink px-4 py-2.5 text-xs font-semibold text-slate-300">
                <Terminal className="h-3.5 w-3.5 text-success-400" /> Code example
              </div>
              <pre className="overflow-x-auto bg-ink p-4 text-[13px] leading-6 text-slate-100">
                <code>{lesson.codeExample}</code>
              </pre>
            </Card>
          ) : null}

          <LessonActions
            lessonId={lesson.id}
            quiz={quiz}
            alreadyCompleted={!!completed}
            nextHref={next ? `/student/learn/${slug}/${next.id}` : `/student/learn/${slug}`}
          />
        </article>

        {/* Lesson rail */}
        <aside className="lg:col-span-1">
          <Card className="lg:sticky lg:top-24">
            <CardBody>
              <h3 className="mb-3 text-sm font-bold text-ink">Course lessons</h3>
              <ol className="space-y-1">
                {siblings.map((l, i) => (
                  <li key={l.id}>
                    <Link
                      href={`/student/learn/${slug}/${l.id}`}
                      aria-current={l.id === lessonId ? "page" : undefined}
                      className={
                        l.id === lessonId
                          ? "flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700"
                          : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      }
                    >
                      <span className="w-5 text-xs text-slate-400">{i + 1}.</span>
                      <span className="truncate">{l.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </aside>
      </div>

      <div className="mt-8 flex justify-between">
        {prev ? (
          <Link href={`/student/learn/${slug}/${prev.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary-600">
            <ChevronLeft className="h-4 w-4" /> {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/student/learn/${slug}/${next.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">
            Next: {next.title} <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </>
  );
}
