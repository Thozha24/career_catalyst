# Design system (the Figma ground truth)

This document doubles as the spec a designer can replicate in Figma and the source of truth used by `src/components/ui.tsx` / `ui-client.tsx`.

## Color system

| Token | Hex | Use |
|---|---|---|
| `primary` | `#6366F1` (indigo) | Primary actions, links, active nav, progress |
| `secondary` | `#8B5CF6` (violet) | Gradients with primary, mentor accents |
| `success` | `#10B981` (emerald) | Accepted/correct/active, "+points" |
| `warning` | `#F59E0B` (amber) | Streaks, due dates, pending review |
| `danger` | `#EF4444` (red) | Destructive, wrong answers, suspended |
| `info` | `#06B6D4` (cyan) | Tests, analytics, neutral highlights |
| `surface` | `#F8FAFC` | Page background |
| `ink` | `#0F172A` | Headings, dark mode base |

Gradients are used selectively (hero + primary buttons only: `from-primary-600 to-secondary-600`). Every status pairs color with an icon or text label — never color alone (accessibility).

## Components (`components/ui.tsx`)

Button (7 variants × 4 sizes with hover/active/disabled/loading + shine sweep), ButtonLink, Card / CardHeader / CardBody, Label, Input, Textarea, Select (styled chevron), Badge (7 tones), Progress (role=progressbar with aria attributes), StatCard, EmptyState, Spinner, Skeleton, SectionHeading, Alert (role=alert), Tabs (client, roving role=tablist), Modal (focus-escape, overlay), ConfirmButton (destructive confirmation), Toast provider (aria-live), CopyButton, ThemeToggle (respects prefers-color-scheme).

## Typography & spacing

Geist/system sans; headings bold tracking-tight; body `text-slate-600` on white; small caps eyebrows `text-xs uppercase tracking-wider`. Spacing on a 4-pt grid; cards `rounded-2xl border-slate-200/80 shadow-soft`.

## Motion

`animate-fade-in-up` (+ `animate-delay-*`), `animate-scale-in` for modals, `animate-pop` for CTAs, `card-hover` lift on cards, progress bars transition 500ms, skeleton shimmer for loading, achievement unlocks pop. All transitions ≤200ms for interactions; the CSS includes `@media (prefers-reduced-motion: reduce)` to disable animation wholesale.

## Screens (built in code; replicate 1:1 in Figma)

Landing (hero + stats + dashboard mock, how-it-works, student/mentor features, learning, groups/progress, testimonials, FAQ, CTA, footer) · auth (choose account type, student/mentor forms, forgot/reset) · student dashboard · learn catalog → course → lesson (code example + quiz) · practice list → workspace (editor, language select, run/submit) · test list → exam runner (timer, question nav, autosave) → results → review · tasks → submit · group join → group page + leaderboard · achievements · profile (visibility control) · settings (change password) · notifications · mentor dashboard · groups/create/detail (invite rotation) · students → analytics (charts: score trend, points, tasks) · test builder/grade panel · task builder/review · performance · announcements · admin dashboard/users/groups/audit-logs.

## Figma workflow

Build components as variants on the same names (Button/*, Card/*, Badge/*…), auto-layout everywhere, hand-off tokens as variables tied to the color table above.
