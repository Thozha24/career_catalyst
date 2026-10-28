"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateMentorProfile, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui-client";

type MentorProfile = {
  fullName: string;
  title: string | null;
  organization: string | null;
  yearsExperience: number | null;
  expertise: string | null;
  skills: string | null;
  bio: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

export function MentorProfileForm({ profile }: { profile: MentorProfile }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateMentorProfile, null);
  const { push } = useToast();

  if (state?.success) push(state.success);

  return (
    <form action={formAction} className="space-y-4" data-testid="mentor-profile-form">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="m-fullName">Full name</Label>
          <Input id="m-fullName" name="fullName" defaultValue={profile.fullName} required />
        </div>
        <div>
          <Label htmlFor="m-title">Professional title</Label>
          <Input id="m-title" name="title" defaultValue={profile.title ?? ""} placeholder="Senior Software Engineer" />
        </div>
        <div>
          <Label htmlFor="m-org">Organization / company</Label>
          <Input id="m-org" name="organization" defaultValue={profile.organization ?? ""} placeholder="TechCorp" />
        </div>
        <div>
          <Label htmlFor="m-years">Years of experience</Label>
          <Input id="m-years" name="yearsExperience" type="number" min={0} max={60} defaultValue={profile.yearsExperience ?? ""} />
        </div>
        <div>
          <Label htmlFor="m-exp">Areas of expertise</Label>
          <Input id="m-exp" name="expertise" defaultValue={profile.expertise ?? ""} placeholder="React, system design" />
        </div>
        <div>
          <Label htmlFor="m-skills">Skills</Label>
          <Input id="m-skills" name="skills" defaultValue={profile.skills ?? ""} placeholder="JavaScript, Node.js, AWS" />
        </div>
        <div>
          <Label htmlFor="m-phone">Phone</Label>
          <Input id="m-phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="m-avatar">Profile photo URL</Label>
          <Input id="m-avatar" name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="m-bio">Short professional bio</Label>
          <Textarea id="m-bio" name="bio" defaultValue={profile.bio ?? ""} placeholder="I mentor because…" />
        </div>
      </div>

      <Button type="submit" disabled={pending} aria-busy={pending}>
        <Save className="mr-1.5 h-4 w-4" />
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
