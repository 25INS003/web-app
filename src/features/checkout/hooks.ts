"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import type { AddressInput } from "@/lib/api/schemas/address";
import { checkoutApi } from "./api";

const ADDR_KEY = ["addresses"] as const;

export function useAddresses() {
  return useQuery({ queryKey: ADDR_KEY, queryFn: checkoutApi.getAddresses });
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

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => checkoutApi.placeOrder(addressId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not place order",
      ),
  });
}
