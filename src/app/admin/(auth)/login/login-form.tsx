"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleAlert, Eye, EyeOff, Info, Lock, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { markActivity } from "@/components/admin/idle-logout";

const notices: Record<string, string> = {
  session: "Your session has ended. Please log in again.",
  timeout: "Your session has ended. Please log in again.",
  reset: "Your password has been updated. Please log in with your new password.",
  "logged-out": "You have been logged out.",
};

export function LoginForm({ reason }: { reason?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      // Supabase Auth rate-limits repeated failures (AA-08).
      if (error.status === 429) {
        setError("Too many login attempts. Please wait 15 minutes and try again.");
      } else {
        // Never say which of the two was wrong (AA-04).
        setError("Incorrect email or password.");
      }
      return;
    }
    markActivity();
    router.replace("/admin");
    router.refresh();
  }

  const notice = reason ? notices[reason] : undefined;

  return (
    <>
      <h1 className="text-center text-headline-md text-primary">Admin Login</h1>
      <p className="mt-1.5 mb-6 text-center text-sm text-on-surface-variant">
        Log in to manage portfolio projects, services, and FAQs.
      </p>

      {notice && !error && (
        <div role="status" className="mb-4 flex items-start gap-2 rounded-lg bg-surface-container p-3 text-sm text-on-surface">
          <Info className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-label-md text-primary">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-outline" aria-hidden />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-surface-container-low pl-11 text-base"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-label-md text-primary">
              Password
            </Label>
            <Link href="/admin/forgot-password" className="text-sm font-medium text-secondary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-outline" aria-hidden />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-surface-container-low pr-12 pl-11 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="touch-target absolute top-1/2 right-0 flex -translate-y-1/2 items-center justify-center text-outline hover:text-on-surface"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="mt-1 h-12 bg-secondary-container text-label-lg text-on-secondary-container hover:bg-secondary-fixed"
        >
          <LogIn className="size-5" aria-hidden />
          {busy ? "Logging in..." : "Log In"}
        </Button>
      </form>
    </>
  );
}
