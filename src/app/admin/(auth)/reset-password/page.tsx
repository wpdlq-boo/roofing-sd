"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 12; // AA-03

// Reached from the emailed reset link via /auth/confirm, which signs the admin
// in for this step only.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`Your password must be at least ${MIN_LENGTH} characters long.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      if (error.status === 401 || error.code === "session_not_found") {
        router.replace("/admin/forgot-password?expired=1");
        return;
      }
      setError(
        error.code === "same_password"
          ? "Please choose a password you haven't used before."
          : "Your password could not be updated. Please try again.",
      );
      return;
    }
    await supabase.auth.signOut();
    router.replace("/admin/login?reason=reset");
  }

  return (
    <>
      <h1 className="text-center text-headline-md text-primary">Set a new password</h1>
      <p className="mt-1.5 mb-6 text-center text-sm text-on-surface-variant">
        Use at least {MIN_LENGTH} characters.
      </p>
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-label-md text-primary">
            New password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_LENGTH}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 bg-surface-container-low text-base"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm" className="text-label-md text-primary">
            Confirm new password
          </Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 bg-surface-container-low text-base"
          />
        </div>
        <Button type="submit" disabled={busy} className="h-11 bg-primary-container text-label-lg">
          {busy ? "Saving..." : "Save new password"}
        </Button>
      </form>
    </>
  );
}
