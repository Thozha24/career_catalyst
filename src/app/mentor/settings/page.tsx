import { Settings, KeyRound } from "lucide-react";
import { requireMentor } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui";
import { ChangePasswordForm } from "@/components/change-password-form";
import { MentorProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function MentorSettingsPage() {
  const user = await requireMentor();

  const [profile, mentorProfile] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { fullName: true } }),
    prisma.mentorProfile.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Keep your mentor profile current and rotate your password periodically."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Mentor profile"
            icon={<Settings className="h-4 w-4" />}
            subtitle="Shown to students you mentor"
          />
          <CardBody>
            <MentorProfileForm
              profile={{
                fullName: profile?.fullName ?? "",
                title: mentorProfile?.title ?? null,
                organization: mentorProfile?.organization ?? null,
                yearsExperience: mentorProfile?.yearsExperience ?? null,
                expertise: mentorProfile?.expertise ?? null,
                skills: mentorProfile?.skills ?? null,
                bio: mentorProfile?.bio ?? null,
                phone: mentorProfile?.phone ?? null,
                avatarUrl: user.avatarUrl,
              }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Password"
            icon={<KeyRound className="h-4 w-4" />}
            subtitle="New hashes use bcrypt cost 12; all other sessions are revoked after a change"
          />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
