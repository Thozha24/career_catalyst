import { Award, Zap, Target, Flame, Github, Link2 } from "lucide-react";
import { requireStudent } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody, Badge, Progress, StatCard, Alert } from "@/components/ui";
import { formatDate, initials, splitList } from "@/lib/format";
import { StudentProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

type Project = { name: string; url: string; description?: string };
type Certification = { name: string; issuer?: string; year?: string };

function parseJsonArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export default async function StudentProfilePage() {
  const user = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      mentor: { select: { fullName: true } },
    },
  });

  if (!profile) {
    return <Alert tone="danger">Profile not found — please contact support.</Alert>;
  }

  const projects = parseJsonArray<Project>(profile.projects, []);
  const certifications = parseJsonArray<Certification>(profile.certifications, []);

  const checks = [!!profile.college, !!profile.course, !!profile.skills, !!profile.interests, !!profile.bio, !!user.avatarUrl];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Your professional student profile — mentors and group peers see this based on your visibility setting."
        action={<Badge tone={profile.profileVisibility === "PUBLIC" ? "success" : profile.profileVisibility === "GROUP" ? "primary" : "neutral"}>Visible: {profile.profileVisibility.toLowerCase()}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Edit profile" subtitle="Changes save instantly for your mentor's view" icon={<Award className="h-4 w-4" />} />
            <CardBody>
              <StudentProfileForm
                defaults={{
                  fullName: user.fullName,
                  avatarUrl: user.avatarUrl ?? "",
                  bio: profile.bio ?? "",
                  college: profile.college ?? "",
                  course: profile.course ?? "",
                  graduationYear: profile.graduationYear?.toString() ?? "",
                  phone: profile.phone ?? "",
                  skills: profile.skills ?? "",
                  interests: profile.interests ?? "",
                  codingLanguages: profile.codingLanguages ?? "",
                  projects: JSON.stringify(projects, null, 2),
                  certifications: JSON.stringify(certifications, null, 2),
                  profileVisibility: profile.profileVisibility,
                }}
              />
            </CardBody>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary-500 via-secondary-500 to-info-500" />
            <CardBody className="pt-0">
              <div className="-mt-9 flex items-end gap-3">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-primary-500 to-secondary-600 text-lg font-bold text-white shadow-lift">
                  {user.avatarUrl ? <span className="text-2xl">🖼️</span> : initials(user.fullName)}
                </div>
                <div className="pb-1">
                  <p className="font-bold text-ink">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{profile.college ?? "Add your college"}</p>
                </div>
              </div>
              {profile.bio ? <p className="mt-3 line-clamp-4 text-sm text-slate-600">{profile.bio}</p> : null}

              <div className="mt-4 space-y-2 text-sm">
                {profile.course ? <p className="text-slate-600">🎓 {profile.course}{profile.graduationYear ? ` · Class of ${profile.graduationYear}` : ""}</p> : null}
                {profile.phone ? <p className="text-slate-600">📞 {profile.phone}</p> : null}
                {profile.mentor ? <p className="text-slate-600">🧭 Mentor: {profile.mentor.fullName}</p> : null}
              </div>

              {splitList(profile.skills).length > 0 ? (
                <div className="mt-4">
                  <p className="label-base">Skills</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {splitList(profile.skills).map((s) => <Badge key={s} tone="primary">{s}</Badge>)}
                  </div>
                </div>
              ) : null}
              {splitList(profile.codingLanguages).length > 0 ? (
                <div className="mt-3">
                  <p className="label-base">Coding languages</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {splitList(profile.codingLanguages).map((s) => <Badge key={s} tone="secondary">{s}</Badge>)}
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Points" value={(profile.totalPoints ?? 0).toLocaleString()} icon={<Zap className="h-5 w-5" />} tone="warning" />
            <StatCard label="Streak" value={`${profile.currentStreak ?? 0}d`} icon={<Flame className="h-5 w-5" />} tone="danger" />
            <StatCard label="Tests done" value={profile.testsCompleted ?? 0} icon={<Target className="h-5 w-5" />} tone="info" />
            <StatCard label="Problems solved" value={profile.codingSolved ?? 0} icon={<Github className="h-5 w-5" />} tone="success" />
          </div>

          <Card>
            <CardHeader title="Profile completion" subtitle={`${completion}%`} />
            <CardBody>
              <Progress value={completion} tone={completion >= 80 ? "success" : "warning"} />
              <p className="mt-2 text-xs text-slate-400">Add bio, skills, photo and education to reach 100%.</p>
            </CardBody>
          </Card>

          {projects.length > 0 || certifications.length > 0 ? (
            <Card>
              <CardHeader title="Portfolio" />
              <CardBody className="space-y-3">
                {projects.map((p, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    {p.description ? <p className="text-xs text-slate-500">{p.description}</p> : null}
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
                        <Link2 className="h-3 w-3" /> View project
                      </a>
                    ) : null}
                  </div>
                ))}
                {certifications.map((c, i) => (
                  <div key={`c-${i}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                    <p className="text-sm font-medium text-slate-700">📜 {c.name}</p>
                    <span className="text-xs text-slate-400">{c.issuer ?? ""}{c.year ? ` · ${c.year}` : ""}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <p className="text-xs text-slate-400">Member since {formatDate(profile.createdAt)}</p>
        </div>
      </div>
    </>
  );
}
