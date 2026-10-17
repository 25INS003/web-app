import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { COMPANY, type CompanyField, LEGAL_LAST_UPDATED } from "./company";

/**
 * A business detail from `COMPANY`, or its placeholder.
 *
 * The placeholder is highlighted, not merely bracketed, so a page that still
 * has one is obviously unfinished to anybody reading it.
 */
export function Fill({ field }: { field: CompanyField }) {
  const { value, label } = COMPANY[field] as {
    value: string | null;
    label: string;
  };
  if (value) return <>{value}</>;
  return (
    <mark className="rounded bg-warning/70 px-1 font-medium text-warning-foreground">
      {label}
    </mark>
  );
}

/** A mailto link to a `COMPANY` address, or its placeholder. */
export function MailLink({ field }: { field: CompanyField }) {
  const value = (COMPANY[field] as { value: string | null }).value;
  if (!value) return <Fill field={field} />;
  return (
    <a className="font-medium text-primary underline" href={`mailto:${value}`}>
      {value}
    </a>
  );
}

/**
 * The frame every legal page shares: title, date, and readable body text.
 *
 * There is no typography plugin in this app, so the body styles are spelled
 * out here once with child selectors rather than repeated on every paragraph.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>
        {intro && (
          <div className="mt-4 text-base leading-relaxed text-foreground/90">
            {intro}
          </div>
        )}
      </header>
      <div
        className={cn(
          "space-y-8 text-[15px] leading-relaxed text-foreground/90",
          "[&_a]:font-medium [&_a]:text-primary [&_a]:underline",
          "[&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground",
        )}
      >
        {children}
      </div>
    </article>
  );
}

/** One numbered section of a legal page. */
export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
