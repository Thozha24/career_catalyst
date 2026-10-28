"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server-side logging only; the raw error is never rendered to the user.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50 text-3xl">⚠️</span>
      <h1 className="mt-5 text-xl font-bold text-ink sm:text-2xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        We hit an unexpected snag. Your data is safe — try again, and if the problem persists, come back a little later.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
