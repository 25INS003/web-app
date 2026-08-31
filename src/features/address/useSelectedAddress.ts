"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAddresses } from "@/features/checkout/hooks";
import type { Address } from "@/lib/api/schemas/address";

const STORAGE_KEY = "nedyway.delivery-address-id";

/**
 * Which address the customer is shopping against.
 *
 * A module-level store rather than component state or a context provider: the
 * header bar and the checkout page are in different parts of the tree and must
 * agree, and a provider would mean wrapping the storefront layout to share one
 * string. `useSyncExternalStore` is the same shape `useIsAuthed` already uses
 * for the session cookie.
 *
 * Persisted, because the choice is about where somebody lives rather than about
 * this tab — being asked again after every reload is the thing that makes an
 * address picker annoying.
 */
let selectedId: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => selectedId;

// Always null on the server: localStorage is not readable there, and returning
// anything else would make the first client render disagree with the HTML.
const getServerSnapshot = () => null;

export function setSelectedAddressId(id: string | null) {
  if (id === selectedId) return;
  selectedId = id;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing, or storage disabled. The choice still holds for this
    // session; it just will not outlive the tab.
  }
  emit();
}

/** Read the persisted choice once, after hydration rather than during render. */
function hydrateOnce() {
  if (hydrated) return;
  hydrated = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== selectedId) {
      selectedId = stored;
      emit();
    }
  } catch {
    /* see above */
  }
}

/** Test seam: drop the in-memory choice so cases start from nothing. */
export function resetSelectedAddress() {
  selectedId = null;
  hydrated = false;
  emit();
}

export type SelectedAddress = {
  addresses: Address[];
  selected: Address | undefined;
  /** What `POST /customer/orders` matches on — the string mirror, not `id`. */
  orderAddressId: string | null;
  select: (id: string) => void;
  isPending: boolean;
};

export function useSelectedAddress(): SelectedAddress {
  const addresses = useAddresses();
  const storedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(hydrateOnce, []);

  const list = addresses.data ?? [];

  // The stored id is honoured only while it still names one of this account's
  // addresses. It survives a sign-out, so the next person to use the browser
  // would otherwise inherit a pointer to an address that is not theirs — it
  // resolves to nothing and falls back, rather than being trusted.
  const chosen = list.find((a) => a.id === storedId);
  const selected = chosen ?? list.find((a) => a.is_default) ?? list[0];

  return {
    addresses: list,
    selected,
    orderAddressId: selected?.address_id ?? selected?.id ?? null,
    select: setSelectedAddressId,
    isPending: addresses.isPending,
  };
}

/** "Home · 12 MG Road, Bengaluru 560001" — one line, for a narrow control. */
export function formatAddressLine(a: Address): string {
  return [a.address_line, a.city, a.pincode].filter(Boolean).join(", ");
}
