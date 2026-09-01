"use client";

import type { ReactNode } from "react";
import { useServiceability } from "./hooks";
import { NotDeliverable } from "./NotDeliverable";

/**
 * Product sections, shown only where we deliver.
 *
 * A gate rather than a filter on each row: the category row, the suggestions
 * row and the fresh-picks grid each ask the API their own question, and three
 * separately-empty rows under three headings read as a broken page rather than
 * as an answer. One panel says the thing once.
 *
 * Client-side because the answer depends on the selected address, which lives
 * in the browser — the page around this stays a server component.
 */
export function DeliverableSections({ children }: { children: ReactNode }) {
  const { notDeliverable, pincode, isPending } = useServiceability();

  // Nothing is rendered while the answer is in flight, rather than the sections
  // flashing in and being replaced: on a pincode we do not serve that flash is
  // a row of products the customer cannot buy.
  if (isPending) {
    return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  if (notDeliverable) {
    return (
      <div className="mt-10 mb-16">
        <NotDeliverable pincode={pincode} />
      </div>
    );
  }

  return <>{children}</>;
}
