"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Link2, Loader2, ListPlus } from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, Input, Label, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui-client";
import { createTaskAction } from "@/app/actions/tasks";

type Resource = { name: string; url: string };

export function TaskBuilder({ groups }: { groups: { id: string; name: string }[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [pointsAward, setPointsAward] = useState("50");
  const [resources, setResources] = useState<Resource[]>([]);
  const [resName, setResName] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addResource() {
    const url = resUrl.trim();
    if (url && resName.trim()) {
      setResources((r) => [...r, { name: resName.trim(), url }]);
      setResName("");
      setResUrl("");
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload = {
        title,
        description,
        instructions: instructions || undefined,
        groupId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        pointsAward: Number(pointsAward) || 0,
        resources,
      };
      const res = await createTaskAction(payload);
      if (!res.ok) {
        setError(res.error ?? "Could not create the task.");
        return;
      }
      push("Task assigned to the whole group 📌");
      router.push(`/mentor/tasks/${res.id}`);
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="title">Task title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a responsive landing page" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What should students build or research?" />
          </div>
          <div>
            <Label htmlFor="instructions" hint="optional">Detailed instructions</Label>
            <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Step-by-step requirements, rubric or acceptance criteria…" className="min-h-[120px]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="groupId">Assign to group</Label>
              <Select id="groupId" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate" hint="optional">Due date</Label>
              <Input id="dueDate" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="pointsAward">Points for completion</Label>
              <Input id="pointsAward" type="number" min={0} max={1000} value={pointsAward} onChange={(e) => setPointsAward(e.target.value)} />
              <p className="mt-1 text-xs text-slate-400">You award up to this amount when you review.</p>
            </div>
          </div>

          {/* Resources */}
          <div>
            <Label>Resources {resources.length ? `(${resources.length})` : ""}</Label>
            {resources.length > 0 ? (
              <ul className="mb-2 space-y-1.5">
                {resources.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate font-medium text-slate-700">{r.name}</span>
                      <span className="truncate text-xs text-slate-400">{r.url}</span>
                    </span>
                    <button type="button" onClick={() => setResources((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove ${r.name}`} className="rounded p-1 text-slate-400 hover:bg-danger-50 hover:text-danger-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={resName} onChange={(e) => setResName(e.target.value)} placeholder="Resource name (docs, repo…)" className="sm:max-w-[220px]" />
              <Input value={resUrl} onChange={(e) => setResUrl(e.target.value)} type="url" placeholder="https://…" className="flex-1" />
              <Button type="button" variant="outline" onClick={addResource} disabled={!resName.trim() || !resUrl.trim()}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="sticky bottom-4">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Badge tone="primary">{groups.find((g) => g.id === groupId)?.name}</Badge>
            <Badge tone="warning">{pointsAward} points</Badge>
            {priority === "HIGH" ? <Badge tone="danger">High priority</Badge> : null}
          </div>
          <Button size="lg" onClick={submit} disabled={pending || !title.trim() || !description.trim() || !groupId}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
            {pending ? "Assigning…" : "Assign task"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
