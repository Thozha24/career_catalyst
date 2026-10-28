/** Join conditional class names. Small dependency-free alternative to clsx+tailwind-merge. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
