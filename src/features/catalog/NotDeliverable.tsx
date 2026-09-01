"use client";

import { MapPinOff } from "lucide-react";

/**
 * We do not deliver to this pincode.
 *
 * One panel instead of products, everywhere products would have been. Showing
 * a filtered-to-nothing catalogue alongside "no results" invites the customer
 * to keep looking — through categories, through search — for something that
 * cannot exist, because the constraint is not the query.
 *
 * It names the pincode, because "we do not deliver to your area" is unhelpful
 * to someone who has three addresses saved and cannot tell which one is
 * selected.
 */
export function NotDeliverable({ pincode }: { pincode?: string }) {
  return (
    <div
      role="status"
      className="mx-auto max-w-md rounded-2xl border border-border bg-card px-6 py-10 text-center"
    >
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <MapPinOff className="size-6" />
      </span>
      <h2 className="font-display text-lg font-semibold">
        {pincode ? `We don't deliver to ${pincode} yet` : "We don't deliver here yet"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        No shop covers this area at the moment. Change the delivery address in
        the header to browse somewhere we do reach.
      </p>
    </div>
  );
}
