"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader, ConfirmDelete, FieldError, StatusPill, adminInputClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { faqCategories, type FaqCategory } from "@/config/site";
import { SESSION_ENDED_URL, hardNavigate, isSessionError, move, refreshPublicSite } from "@/lib/admin-client";
import { createClient } from "@/lib/supabase/client";
import type { Faq } from "@/lib/types";
import { faqSchema, fieldErrors } from "@/lib/validation";

type Draft = { id?: string; question: string; answer: string; category: FaqCategory | ""; is_visible: boolean };
const emptyDraft: Draft = { question: "", answer: "", category: "", is_visible: true };
const SAVE_FAILED = "Your changes could not be saved. Please try again.";

export function FaqManager({ openNew }: { openNew: boolean }) {
  const [supabase] = useState(createClient);
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(openNew ? emptyDraft : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Faq | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("faqs").select("*").order("display_order").order("created_at");
    if (error) {
      if (isSessionError(error)) return hardNavigate(SESSION_ENDED_URL);
      setLoadError(true);
      return;
    }
    setLoadError(false);
    setFaqs(data as Faq[]);
  }, [supabase]);

  useEffect(() => {
    // Load once on mount. Deferred to a microtask so state is never set
    // synchronously inside the effect.
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  function fail(error: { code?: string; message?: string }, fallback = SAVE_FAILED) {
    if (isSessionError(error)) {
      hardNavigate(SESSION_ENDED_URL);
      return;
    }
    toast.error(fallback);
  }

  async function save() {
    if (!draft || !faqs) return;
    const parsed = faqSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setSaving(true);
    const values = parsed.data;
    const existing = draft.id ? faqs.find((f) => f.id === draft.id) : undefined;
    const endOfCategory =
      Math.max(0, ...faqs.filter((f) => f.category === values.category).map((f) => f.display_order)) + 1;
    const display_order = existing && existing.category === values.category ? existing.display_order : endOfCategory;

    const { error } = draft.id
      ? await supabase.from("faqs").update({ ...values, display_order }).eq("id", draft.id)
      : await supabase.from("faqs").insert({ ...values, display_order });
    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        setErrors({ question: "This question is already in the FAQ list." });
        return;
      }
      // Entries stay in the dialog (SRS 3.2.10.5).
      return fail(error);
    }
    toast.success(draft.id ? "FAQ updated." : "FAQ added.");
    setDraft(null);
    await load();
    void refreshPublicSite();
  }

  async function toggleVisible(faq: Faq, is_visible: boolean) {
    const { error } = await supabase.from("faqs").update({ is_visible }).eq("id", faq.id);
    if (error) return fail(error);
    toast.success(is_visible ? "FAQ is now shown on the website." : "FAQ is now hidden from the website.");
    await load();
    void refreshPublicSite();
  }

  async function reorder(category: FaqCategory, index: number, delta: number) {
    if (!faqs) return;
    const group = faqs.filter((f) => f.category === category);
    const next = move(group, index, delta);
    if (next === group) return;
    const { error } = await supabase.rpc("reorder_faqs", { p_ids: next.map((f) => f.id) });
    if (error) return fail(error, "The order could not be saved. Please try again.");
    toast.success("Order updated.");
    await load();
    void refreshPublicSite();
  }

  async function remove(faq: Faq) {
    const { error } = await supabase.from("faqs").delete().eq("id", faq.id);
    if (error) return fail(error, "The FAQ could not be deleted. Please try again.");
    setToDelete(null);
    toast.success("FAQ deleted.");
    await load();
    void refreshPublicSite();
  }

  const openEditor = (d: Draft) => {
    setErrors({});
    setDraft(d);
  };

  return (
    <>
      <AdminPageHeader
        title="Frequently Asked Questions"
        description="Add answers to questions customers often ask by phone or email. Answers are shown as plain text."
        action={
          <Button className="h-11 bg-secondary-container px-4 text-label-lg text-on-secondary-container hover:bg-secondary-fixed" onClick={() => openEditor(emptyDraft)}>
            <Plus className="size-5" aria-hidden /> Add FAQ
          </Button>
        }
      />

      {loadError && (
        <p role="alert" className="rounded-xl bg-error-container p-4 text-on-error-container">
          The FAQs could not be loaded.{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Try again
          </button>
        </p>
      )}

      {faqs === null && !loadError && <p className="text-on-surface-variant">Loading FAQs...</p>}

      {faqs && (
        <div className="space-y-8">
          {faqCategories.map((category) => {
            const group = faqs.filter((f) => f.category === category);
            return (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2 id={`cat-${category}`} className="mb-3 text-headline-sm text-primary">
                  {category} <span className="text-sm font-normal text-on-surface-variant">({group.length})</span>
                </h2>
                {group.length === 0 ? (
                  <p className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant shadow-sm">
                    No questions in this category. It is hidden on the website until you add one.
                  </p>
                ) : (
                  <ul className="divide-y divide-surface-container overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                    {group.map((faq, i) => (
                      <li key={faq.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="flex shrink-0 gap-1 sm:flex-col">
                          <Button variant="ghost" size="icon-lg" disabled={i === 0} onClick={() => reorder(category, i, -1)} aria-label={`Move "${faq.question}" up`}>
                            <ChevronUp />
                          </Button>
                          <Button variant="ghost" size="icon-lg" disabled={i === group.length - 1} onClick={() => reorder(category, i, 1)} aria-label={`Move "${faq.question}" down`}>
                            <ChevronDown />
                          </Button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="text-label-lg text-on-surface">{faq.question}</p>
                            <StatusPill on={faq.is_visible} onLabel="Shown" offLabel="Hidden" />
                          </div>
                          <p className="line-clamp-2 text-sm whitespace-pre-line text-on-surface-variant">{faq.answer}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                            <Switch checked={faq.is_visible} onCheckedChange={(v) => toggleVisible(faq, v)} aria-label={`Show "${faq.question}" on the website`} />
                            Show
                          </label>
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            onClick={() => openEditor({ id: faq.id, question: faq.question, answer: faq.answer, category: faq.category, is_visible: faq.is_visible })}
                            aria-label={`Edit "${faq.question}"`}
                          >
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-lg" className="text-error hover:bg-error-container" onClick={() => setToDelete(faq)} aria-label={`Delete "${faq.question}"`}>
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && !saving && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-headline-sm text-primary">{draft?.id ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
            <DialogDescription>All fields are required.</DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              id="faq-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="faq-category">Category *</Label>
                <select
                  id="faq-category"
                  className={adminInputClass}
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value as FaqCategory })}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby="faq-category-error"
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {faqCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <FieldError id="faq-category-error" message={errors.category} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-question">Question *</Label>
                <input
                  id="faq-question"
                  className={adminInputClass}
                  maxLength={200}
                  value={draft.question}
                  onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                  aria-invalid={Boolean(errors.question)}
                  aria-describedby="faq-question-error"
                />
                <FieldError id="faq-question-error" message={errors.question} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label htmlFor="faq-answer">Answer *</Label>
                  <span className="text-xs text-on-surface-variant">{draft.answer.length} / 2,000</span>
                </div>
                <textarea
                  id="faq-answer"
                  rows={6}
                  className={adminInputClass}
                  maxLength={2000}
                  value={draft.answer}
                  onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                  aria-invalid={Boolean(errors.answer)}
                  aria-describedby="faq-answer-error"
                />
                <FieldError id="faq-answer-error" message={errors.answer} />
              </div>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={draft.is_visible} onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })} />
                Show this FAQ on the website
              </label>
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" className="h-11 px-4" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="faq-form" className="h-11 bg-primary-container px-4" disabled={saving}>
              {saving ? "Saving..." : "Save FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this FAQ?"
        description={toDelete ? `"${toDelete.question}" will be removed from the website. This cannot be undone.` : ""}
        onConfirm={async () => {
          if (toDelete) await remove(toDelete);
        }}
      />
    </>
  );
}
