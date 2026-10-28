import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="text-gradient text-7xl font-extrabold sm:text-8xl">404</p>
      <h1 className="mt-4 text-xl font-bold text-ink sm:text-2xl">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for does not exist, moved, or you do not have access to it.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="h-10 px-4 text-sm inline-flex select-none items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 font-semibold text-white shadow-lift transition-all hover:from-primary-500 hover:to-secondary-500">
          Back home
        </Link>
        <Link href="/signin" className="h-10 px-4 text-sm inline-flex select-none items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
          Sign in
        </Link>
      </div>
    </div>
  );
}
