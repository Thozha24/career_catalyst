import { UserCheck, MessageSquareQuote, Star, Building2, Briefcase } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, EmptyState, ButtonLink, StatCard } from "@/components/ui";
import { formatRelative, initials, splitList } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentMentorPage() {
  const user = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      mentor: {
        include: { mentorProfile: true },
      },
    },
  });

  const memberships = await prisma.groupMember.findMany({
    where: { studentId: user.id, isActive: true },
    include: { group: { select: { id: true, name: true, description: true } } },
  });

  const feedback = await prisma.feedback.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { fullName: true } } },
  });

  const mentor = profile?.mentor;
  const avgRating = feedback.filter((f) => f.rating).length
    ? (feedback.filter((f) => f.rating).reduce((s, f) => s + (f.rating ?? 0), 0) / feedback.filter((f) => f.rating).length).toFixed(1)
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Mentorship"
        title="My Mentor"
        description="Your mentor's profile and the feedback they've given you."
      />

      {!mentor ? (
        <EmptyState
          icon={<UserCheck className="h-6 w-6" />}
          title="No mentor yet"
          description="Join a mentor group to get matched — your group's mentor becomes your primary mentor automatically."
          action={<ButtonLink href="/student/group">Join a Group</ButtonLink>}
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary-600 via-secondary-600 to-info-600" />
            <CardBody className="pt-0">
              <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-secondary-500 to-primary-600 text-xl font-bold text-white shadow-lift">
                    {initials(mentor.fullName)}
                  </div>
                  <div className="pb-1">
                    <h2 className="text-xl font-bold text-ink">{mentor.fullName}</h2>
                    <p className="text-sm text-slate-500">{mentor.mentorProfile?.title ?? "Mentor"}</p>
                  </div>
                </div>
                <Badge tone="primary" className="mb-1">Your mentor</Badge>
              </div>

              {mentor.mentorProfile?.bio ? (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{mentor.mentorProfile.bio}</p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {mentor.mentorProfile?.organization ? (
                  <p className="flex items-center gap-2 text-sm text-slate-600"><Building2 className="h-4 w-4 text-slate-400" /> {mentor.mentorProfile.organization}</p>
                ) : null}
                {mentor.mentorProfile?.yearsExperience != null ? (
                  <p className="flex items-center gap-2 text-sm text-slate-600"><Briefcase className="h-4 w-4 text-slate-400" /> {mentor.mentorProfile.yearsExperience} years experience</p>
                ) : null}
              </div>

              {splitList(mentor.mentorProfile?.expertise).length > 0 ? (
                <div className="mt-4">
                  <p className="label-base">Expertise</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {splitList(mentor.mentorProfile?.expertise).map((x) => (
                      <Badge key={x} tone="secondary">{x}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader
                  title="Feedback received"
                  subtitle="Personal notes from your mentor"
                  icon={<MessageSquareQuote className="h-4 w-4" />}
                />
                <CardBody className="space-y-3">
                  {feedback.length === 0 ? (
                    <p className="text-sm text-slate-500">No feedback yet — it appears here after your mentor reviews your work.</p>
                  ) : (
                    feedback.map((f) => (
                      <div key={f.id} className="rounded-xl border border-slate-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{f.author.fullName}</p>
                          <span className="text-xs text-slate-400">{formatRelative(f.createdAt)}</span>
                        </div>
                        {f.rating ? (
                          <p className="mt-1 flex items-center gap-0.5 text-warning-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < (f.rating ?? 0) ? "fill-warning-400" : "text-slate-200"}`} />
                            ))}
                          </p>
                        ) : null}
                        <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-600">{f.comment}</p>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="space-y-6">
              <StatCard label="Feedback notes" value={feedback.length} icon={<MessageSquareQuote className="h-5 w-5" />} tone="info" />
              {avgRating ? <StatCard label="Average rating" value={`${avgRating}/5`} icon={<Star className="h-5 w-5" />} tone="warning" /> : null}
              <Card>
                <CardHeader title="Your groups" icon={<UserCheck className="h-4 w-4" />} />
                <CardBody className="space-y-2">
                  {memberships.length === 0 ? (
                    <p className="text-sm text-slate-500">Not in any group yet.</p>
                  ) : (
                    memberships.map(({ group }) => (
                      <div key={group.id} className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{group.name}</p>
                        {group.description ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{group.description}</p> : null}
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
