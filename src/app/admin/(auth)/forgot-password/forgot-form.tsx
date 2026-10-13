"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotForm({ expired }: { expired: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });
    setBusy(false);
    if (error?.status === 429) {
      setError("Too many requests. Please wait a few minutes and try again.");
      return;
    }
    // Same message whether or not the address matches, so it reveals nothing.
    setSent(true);
  }

  return (
    <>
      <h1 className="text-center text-headline-md text-primary">Reset your password</h1>
      <p className="mt-1.5 mb-6 text-center text-sm text-on-surface-variant">
        Enter the admin email address and we&apos;ll send you a link to set a new password.
      </p>

      {expired && !sent && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          This link has expired. Please request a new one.
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {sent ? (
        <div role="status" className="flex items-start gap-2 rounded-lg bg-surface-container p-4 text-sm text-on-surface">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden />
          If that address belongs to the admin account, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-label-md text-primary">
              Admin email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-surface-container-low text-base"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-11 bg-primary-container text-label-lg">
            {busy ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/admin/login" className="font-medium text-secondary hover:underline">
          Back to login
        </Link>
      </p>
    </>
  );
}
