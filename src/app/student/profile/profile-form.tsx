"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateStudentProfile, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";

export function StudentProfileForm({
  defaults,
}: {
  defaults: {
    fullName: string;
    avatarUrl: string;
    bio: string;
    college: string;
    course: string;
    graduationYear: string;
    phone: string;
    skills: string;
    interests: string;
    codingLanguages: string;
    projects: string;
    certifications: string;
    profileVisibility: "PRIVATE" | "GROUP" | "PUBLIC";
  };
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateStudentProfile, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required defaultValue={defaults.fullName} />
          {state?.fieldErrors?.fullName ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.fullName}</p> : null}
        </div>
        <div>
          <Label htmlFor="avatarUrl" hint="optional">Photo URL</Label>
          <Input id="avatarUrl" name="avatarUrl" type="url" defaultValue={defaults.avatarUrl} placeholder="https://…" />
          {state?.fieldErrors?.avatarUrl ? <p className="mt-1 text-xs text-danger-600">{state.fieldErrors.avatarUrl}</p> : null}
        </div>
      </div>

      <div>
        <Label htmlFor="bio" hint="optional">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={defaults.bio} placeholder="A short professional introduction…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="college" hint="optional">College / institution</Label>
          <Input id="college" name="college" defaultValue={defaults.college} />
        </div>
        <div>
          <Label htmlFor="course" hint="optional">Course / degree</Label>
          <Input id="course" name="course" defaultValue={defaults.course} />
        </div>
        <div>
          <Label htmlFor="graduationYear" hint="optional">Graduation year</Label>
          <Input id="graduationYear" name="graduationYear" type="number" min={1990} max={2100} defaultValue={defaults.graduationYear} />
        </div>
        <div>
          <Label htmlFor="phone" hint="optional">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="skills" hint="comma separated">Skills</Label>
          <Input id="skills" name="skills" defaultValue={defaults.skills} placeholder="React, UI design, Figma" />
        </div>
        <div>
          <Label htmlFor="codingLanguages" hint="comma separated">Coding languages</Label>
          <Input id="codingLanguages" name="codingLanguages" defaultValue={defaults.codingLanguages} placeholder="JavaScript, Python" />
        </div>
        <div>
          <Label htmlFor="interests" hint="comma separated">Areas of interest</Label>
          <Input id="interests" name="interests" defaultValue={defaults.interests} placeholder="Frontend, AI, product" />
        </div>
        <div>
          <Label htmlFor="profileVisibility">Profile visibility</Label>
          <Select id="profileVisibility" name="profileVisibility" defaultValue={defaults.profileVisibility}>
            <option value="GROUP">Group members & my mentors</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Only me</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="projects" hint="JSON, optional">Projects</Label>
          <Textarea
            id="projects"
            name="projects"
            defaultValue={defaults.projects}
            className="font-mono text-xs"
            placeholder='[{"name":"Portfolio","url":"https://…","description":"…"}]'
          />
          <p className="mt-1 text-xs text-slate-400">Invalid JSON is ignored on save.</p>
        </div>
        <div>
          <Label htmlFor="certifications" hint="JSON, optional">Certifications</Label>
          <Textarea
            id="certifications"
            name="certifications"
            defaultValue={defaults.certifications}
            className="font-mono text-xs"
            placeholder='[{"name":"AWS CC","issuer":"Amazon","year":"2025"}]'
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
