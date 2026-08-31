"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserRole } from "@/features/auth/useAuth";
import { ApiError } from "@/lib/api/types";
import type { AddressInput } from "@/lib/api/schemas/address";
import { checkoutApi } from "./api";

const ADDR_KEY = ["addresses"] as const;

/**
 * The customer's saved addresses.
 *
 * `enabled` because this is now read from the header on every storefront page,
 * not just at checkout: `/address/get` is customer-only, so for a signed-out
 * visitor it is a guaranteed 401 and for an admin or shop owner a guaranteed
 * 403 — fired on every page they open.
 */
export function useAddresses() {
  const role = useUserRole();
  return useQuery({
    queryKey: ADDR_KEY,
    queryFn: checkoutApi.getAddresses,
    enabled: role === "customer",
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => checkoutApi.addAddress(input),
    onSuccess: () => {
      toast.success("Address saved");
      qc.invalidateQueries({ queryKey: ADDR_KEY });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not save address",
      ),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressInput }) =>
      checkoutApi.updateAddress(id, input),
    onSuccess: () => {
      toast.success("Address updated");
      qc.invalidateQueries({ queryKey: ADDR_KEY });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not update address",
      ),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkoutApi.deleteAddress(id),
    onSuccess: () => {
      toast.success("Address removed");
      qc.invalidateQueries({ queryKey: ADDR_KEY });
    },
    // The backend refuses to delete the default address and says why. Surfacing
    // its message rather than a generic one is what tells the user to make
    // another address default first.
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not remove address",
      ),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkoutApi.setDefaultAddress(id),
    onSuccess: () => {
      toast.success("Default address updated");
      qc.invalidateQueries({ queryKey: ADDR_KEY });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not set default address",
      ),
  });
}

/**
 * Try a code against the basket.
 *
 * A failed quote is not an error state worth a red screen — a wrong code is
 * the normal case while somebody is typing one — so the message is surfaced
 * and the caller decides.
 */
export function useQuotePromotion() {
  return useMutation({
    mutationFn: (input: Parameters<typeof checkoutApi.quotePromotion>[0]) =>
      checkoutApi.quotePromotion(input),
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not apply that code",
      ),
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      promotionCode,
    }: {
      addressId: string;
      promotionCode?: string | null;
    }) => checkoutApi.placeOrder(addressId, promotionCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not place order",
      ),
  });
}
