"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { signIn, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      if (nextPath) fd.set("next", nextPath);
      return signIn(prev, fd);
    },
    null
  );
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">Sign in to continue your journey.</p>
      </div>

      {state?.error ? (
        <div className="mb-4">
          <Alert tone="danger">{state.error}</Alert>
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input id="password" name="password" type={showPw ? "text" : "password"} autoComplete="current-password" required placeholder="••••••••" className="pr-10" />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : <>Sign In <LogIn className="ml-1 h-4 w-4" /></>}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to Career Catalyst?{" "}
        <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
          Get started
        </Link>
      </p>
    </div>
  );
}
