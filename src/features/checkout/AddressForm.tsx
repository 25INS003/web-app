"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressInputSchema, addressTagSchema } from "@/lib/api/schemas/address";
import type { Address, AddressInput } from "@/lib/api/schemas/address";
import { cn } from "@/lib/utils";
import { useAddAddress, useUpdateAddress } from "./hooks";

// Address (what the API returns) -> AddressInput (what the form edits). The
// read shape allows nulls on fields the form requires, so each one falls back
// to "" and lets the resolver ask for it rather than submitting a null. `tag`
// is parsed rather than cast: an out-of-enum value would otherwise leave no
// pill selected and silently submit something the backend rejects.
function toInput(a: Address): AddressInput {
  return {
    contact_name: a.contact_name ?? "",
    contact_phone: a.contact_phone ?? "",
    address_line: a.address_line,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country ?? "India",
    tag: addressTagSchema.safeParse(a.tag).data ?? "home",
  };
}

export function AddressForm({
  address,
  prefill,
  onDone,
}: {
  address?: Address;
  /**
   * Fields to start from — what a device's GPS resolved to. Distinct from
   * `address`: that means "edit this saved one" and drives the button label and
   * the update-vs-create branch, whereas this is a blank form with some boxes
   * already filled, still creating.
   */
  prefill?: Partial<AddressInput>;
  onDone: () => void;
}) {
  const add = useAddAddress();
  const update = useUpdateAddress();
  const editing = Boolean(address);
  const pending = add.isPending || update.isPending;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues: address
      ? toInput(address)
      : {
          contact_name: "",
          contact_phone: "",
          address_line: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          tag: "home",
          // Spread last so a resolved location wins over the blanks, and only
          // over the fields it actually found — a geocoder that knows the city
          // but not the pincode must not blank the pincode box.
          ...Object.fromEntries(
            Object.entries(prefill ?? {}).filter(
              ([, v]) => v !== undefined && v !== "",
            ),
          ),
        },
  });
  const tag = watch("tag");

  // The pin can move after this form is on screen, and `defaultValues` are read
  // once at mount — so without this the map and the fields drift apart, which
  // is worse than not having a map at all.
  //
  // Only the geocoded fields are written. A name and phone already typed are
  // not something the geocoder knows or should overwrite, and `reset()` would
  // take them with it.
  useEffect(() => {
    if (!prefill) return;
    for (const key of ["address_line", "city", "state", "pincode", "country"] as const) {
      const value = prefill[key];
      // Left alone when the geocoder had nothing: a lookup that finds the city
      // but not the pincode must not blank a pincode the customer typed.
      if (typeof value === "string" && value !== "") setValue(key, value);
    }
  }, [prefill, setValue]);

  const field = (name: keyof AddressInput, label: string, props = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...register(name)} {...props} />
      {errors[name] && (
        <p className="text-xs text-destructive">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit((v) => {
        // The coordinates ride along unedited. They have no input of their own,
        // and react-hook-form only returns what it registered — so taking `v`
        // alone would drop the fix and save a GPS address with no position on
        // it, which is the whole point of having taken one.
        const input: AddressInput = {
          ...v,
          ...(prefill?.lat !== undefined && prefill?.lng !== undefined
            ? { lat: prefill.lat, lng: prefill.lng }
            : {}),
        };
        return editing
          ? update.mutate({ id: address!.id, input }, { onSuccess: onDone })
          : add.mutate(input, { onSuccess: onDone });
      })}
      className="space-y-3"
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        {field("contact_name", "Full name")}
        {field("contact_phone", "Phone")}
      </div>
      {field("address_line", "Address")}
      <div className="grid grid-cols-3 gap-3">
        {field("city", "City")}
        {field("state", "State")}
        {field("pincode", "Pincode")}
      </div>
      <div className="flex gap-2">
        {(["home", "work", "other"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue("tag", t)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition",
              tag === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {editing ? "Save changes" : "Save address"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
