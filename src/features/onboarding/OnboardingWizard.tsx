"use client";

import {
  Building2,
  Check,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSubmitOnboarding } from "./hooks";
import {
  allErrors,
  emptyForm,
  normalise,
  stepIsValid,
  validateStep,
} from "./validation";
import type { FieldErrors, OnboardingForm } from "./validation";

/**
 * The shop owner's application.
 *
 * The endpoint behind this has existed and worked the whole time; nothing
 * called it. Registration created a row with `business_name: "New Enterprise"`
 * and this page said the wizard "arrives with Phase 3", so every owner's GST,
 * address, bank details and documents stayed null — which is why the admin
 * queue showed "Not Provided" against all of them and approved applicants
 * with nothing attached.
 *
 * Four steps and a review, rather than one long form: the fields group
 * naturally, and a single page of twelve inputs with a file picker at the
 * bottom is the version people abandon.
 */

const STEPS = [
  { title: "Business", icon: Building2 },
  { title: "Address", icon: MapPin },
  { title: "Bank", icon: Landmark },
  { title: "Documents", icon: FileText },
  { title: "Review", icon: Check },
] as const;

const MAX_DOCUMENTS = 5;
/** Mirrors the backend's multer filter. */
const ACCEPT = "image/*,application/pdf,.doc,.docx";

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(emptyForm);
  const [documents, setDocuments] = useState<File[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  // Errors appear once a step has been left, not while somebody is still
  // typing their first character into it.
  const [touched, setTouched] = useState<Record<number, boolean>>({});

  const submit = useSubmitOnboarding();

  const set = (key: keyof OnboardingForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const errors: FieldErrors = touched[step]
    ? validateStep(step, form, documents.length)
    : {};

  const isReview = step === STEPS.length - 1;
  const canAdvance = stepIsValid(step, form, documents.length);

  const next = () => {
    setTouched((t) => ({ ...t, [step]: true }));
    if (canAdvance) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const send = () => {
    const remaining = allErrors(form, documents.length);
    if (Object.keys(remaining).length > 0) {
      // Land them on the first step that is actually wrong rather than saying
      // "something is invalid" on the review page.
      const firstBad = [0, 1, 2, 3].find(
        (s) => !stepIsValid(s, form, documents.length),
      );
      setTouched((t) => ({ ...t, [firstBad ?? 0]: true }));
      setStep(firstBad ?? 0);
      return;
    }
    submit.mutate({ form: normalise(form), documents, logo });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Set up your shop
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        An admin reviews this before your shop goes live.
      </p>

      <StepBar
        current={step}
        onJump={(s) => {
          // Backwards only. Jumping ahead past an incomplete step would let
          // somebody reach Review with nothing filled in.
          if (s < step) setStep(s);
        }}
      />

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-xs">
        {step === 0 && (
          <Section title="About the business">
            <Field label="Business name" error={errors.business_name} required>
              <Input
                value={form.business_name}
                onChange={(e) => set("business_name", e.target.value)}
                placeholder="Green Basket Grocers"
              />
            </Field>
            <Field
              label="GSTIN"
              error={errors.gst_number}
              hint="Optional — leave blank if you are not registered"
            >
              <Input
                value={form.gst_number}
                onChange={(e) => set("gst_number", e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                className="font-mono uppercase"
              />
            </Field>
            <Field
              label="In business since"
              error={errors.business_since}
              hint="Optional. Shown to the reviewer."
            >
              <Input
                type="month"
                // Cannot be a month that has not happened yet.
                max={new Date().toISOString().slice(0, 7)}
                value={form.business_since}
                onChange={(e) => set("business_since", e.target.value)}
                className="max-w-[12rem]"
              />
            </Field>
            <Field label="Logo" hint="Optional. Shown on your shop page.">
              <FilePick
                accept="image/*"
                onPick={(files) => setLogo(files[0] ?? null)}
                label={logo ? logo.name : "Choose an image"}
              />
            </Field>
          </Section>
        )}

        {step === 1 && (
          <Section title="Where you operate from">
            <Field
              label="Address"
              error={errors.business_address_line1}
              required
            >
              <Input
                value={form.business_address_line1}
                onChange={(e) => set("business_address_line1", e.target.value)}
                placeholder="12 Market Street"
              />
            </Field>
            <Field label="Address line 2" hint="Optional">
              <Input
                value={form.business_address_line2}
                onChange={(e) => set("business_address_line2", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="District"
                error={errors.business_address_district}
                required
              >
                <Input
                  value={form.business_address_district}
                  onChange={(e) =>
                    set("business_address_district", e.target.value)
                  }
                />
              </Field>
              <Field
                label="State"
                error={errors.business_address_state}
                required
              >
                <Input
                  value={form.business_address_state}
                  onChange={(e) => set("business_address_state", e.target.value)}
                />
              </Field>
            </div>
            <Field
              label="Pincode"
              error={errors.business_address_pincode}
              required
            >
              <Input
                inputMode="numeric"
                maxLength={6}
                value={form.business_address_pincode}
                onChange={(e) =>
                  set(
                    "business_address_pincode",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="560001"
                className="max-w-[10rem] font-mono"
              />
            </Field>
          </Section>
        )}

        {step === 2 && (
          <Section title="Where your payouts go">
            <Field
              label="Account number"
              error={errors.bank_account_number}
              required
            >
              <Input
                inputMode="numeric"
                value={form.bank_account_number}
                onChange={(e) =>
                  set("bank_account_number", e.target.value.replace(/\D/g, ""))
                }
                className="font-mono"
              />
            </Field>
            <Field label="IFSC" error={errors.ifsc_code} required>
              <Input
                value={form.ifsc_code}
                onChange={(e) => set("ifsc_code", e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                maxLength={11}
                className="max-w-[12rem] font-mono uppercase"
              />
            </Field>
            <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              Check these carefully. A wrong digit here is a payout that
              silently goes nowhere.
            </p>
          </Section>
        )}

        {step === 3 && (
          <Section title="Proof for the reviewer">
            <p className="text-sm text-muted-foreground">
              Optional, but it is what a reviewer has to go on — a shop
              licence, a GST certificate, or ID. Up to {MAX_DOCUMENTS} files.
            </p>
            <FilePick
              accept={ACCEPT}
              multiple
              label="Add documents"
              disabled={documents.length >= MAX_DOCUMENTS}
              onPick={(files) =>
                setDocuments((prev) =>
                  [...prev, ...files].slice(0, MAX_DOCUMENTS),
                )
              }
            />
            {errors.documents && (
              <p className="text-xs text-destructive">{errors.documents}</p>
            )}
            <ul className="space-y-2">
              {documents.map((doc, i) => (
                <li
                  key={`${doc.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{doc.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${doc.name}`}
                    onClick={() =>
                      setDocuments((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="ml-auto text-muted-foreground transition hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {isReview && (
          <Section title="Check this over">
            <dl className="divide-y divide-border text-sm">
              <Row label="Business" value={form.business_name} />
              <Row label="GSTIN" value={form.gst_number || "Not registered"} />
              <Row
                label="In business since"
                value={form.business_since || "Not given"}
              />
              <Row
                label="Address"
                value={[
                  form.business_address_line1,
                  form.business_address_line2,
                  form.business_address_district,
                  form.business_address_state,
                  form.business_address_pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <Row
                label="Account"
                // Only the last four. The full number was just typed in and is
                // about to be sent; echoing it back in full on a shared screen
                // buys nothing.
                value={`••••${form.bank_account_number.slice(-4)} · ${form.ifsc_code}`}
              />
              <Row
                label="Documents"
                value={
                  documents.length
                    ? documents.map((d) => d.name).join(", ")
                    : "None attached"
                }
              />
            </dl>
            <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              Submitting sends this for review. You can update it later, but
              changes go back through approval.
            </p>
          </Section>
        )}

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            disabled={step === 0 || submit.isPending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>

          {isReview ? (
            <Button onClick={send} disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="size-4 animate-spin" />}
              Submit application
            </Button>
          ) : (
            <Button onClick={next}>Continue</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBar({
  current,
  onJump,
}: {
  current: number;
  onJump: (step: number) => void;
}) {
  return (
    <ol className="mt-6 flex items-center gap-1">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={i > current}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                active && "bg-primary/10 text-primary",
                done && "text-foreground hover:bg-muted",
                !active && !done && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary bg-primary/20 text-primary",
                  !active && !done && "border-border",
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="truncate">{s.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">
        {value || "—"}
      </dd>
    </div>
  );
}

/** A file input that looks like a button, since the native one cannot be styled. */
function FilePick({
  accept,
  multiple,
  label,
  disabled,
  onPick,
}: {
  accept: string;
  multiple?: boolean;
  label: string;
  disabled?: boolean;
  onPick: (files: File[]) => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Upload className="size-4" />
      <span className="truncate">{label}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          onPick(Array.from(e.target.files ?? []));
          // Cleared so picking the same file again still fires a change.
          e.target.value = "";
        }}
      />
    </label>
  );
}
