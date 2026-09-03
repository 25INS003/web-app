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
/**
 * Form defaults, which are looser than the input the resolver demands.
 *
 * `lat`/`lng` are required to submit but absent on an address saved before that
 * was true, so the defaults type has to allow them missing — that is precisely
 * the state the resolver then complains about, which is how an older address
 * acquires a pin.
 */
type AddressDefaults = Omit<AddressInput, "lat" | "lng"> & {
  lat?: number;
  lng?: number;
};

function toInput(a: Address): AddressDefaults {
  return {
    contact_name: a.contact_name ?? "",
    contact_phone: a.contact_phone ?? "",
    address_line: a.address_line,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country ?? "India",
    tag: addressTagSchema.safeParse(a.tag).data ?? "home",
    // Carried through so editing an address does not silently drop its pin.
    lat: a.lat ?? undefined,
    lng: a.lng ?? undefined,
  };
}

export function AddressForm({
  address,
  prefill,
  onDone,
  onCoordsTyped,
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
  /**
   * Called when the customer types a coordinate directly, so the map can move
   * its pin to match. Without it the two would disagree, and the map — being
   * the thing that looks authoritative — would quietly be wrong.
   */
  onCoordsTyped?: (lat: number, lng: number) => void;
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
    // The coordinates are registered fields now, so moving the pin writes them
    // into the form rather than being spliced in at submit. That is what makes
    // them visible, and what lets the customer correct them by typing.
    if (typeof prefill.lat === "number") {
      setValue("lat", prefill.lat, { shouldValidate: true });
    }
    if (typeof prefill.lng === "number") {
      setValue("lng", prefill.lng, { shouldValidate: true });
    }
  }, [prefill, setValue]);

  // Typing a coordinate moves the pin, but only once both are real numbers:
  // recentring on a half-typed "12." would fling the map to the equator between
  // keystrokes.
  const onCoordChange =
    (which: "lat" | "lng") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value === "" ? undefined : Number(e.target.value);
      setValue(which, next as number, { shouldValidate: true });
      const lat = which === "lat" ? next : watch("lat");
      const lng = which === "lng" ? next : watch("lng");
      if (
        typeof lat === "number" &&
        typeof lng === "number" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {
        onCoordsTyped?.(lat, lng);
      }
    };

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
        // No splice: `lat` and `lng` are registered fields, so they come back
        // in `v` like everything else. They used to be lifted from `prefill`
        // here because they had no input of their own — which also meant the
        // customer could not see or correct them.
        const input: AddressInput = v;
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

      {/* The pin, in numbers.
          Shown rather than hidden because they are the only part of an address
          a courier can navigate to directly, and because a customer who can see
          them can tell a right pin from a wrong one. Editable, and typing moves
          the map — the same two-way behaviour the shop address form has.

          Required: an address with no pin cannot be delivered to from the
          shop's order screen, so it is not saveable. The message names the map,
          because that is where this gets fixed. */}
      {(errors.lat || errors.lng) && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Set a pin on the map above so the delivery rider can find you.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {field("lat", "Latitude", {
          type: "number",
          step: "any",
          inputMode: "decimal",
          placeholder: "Tap the map above",
          onChange: onCoordChange("lat"),
        })}
        {field("lng", "Longitude", {
          type: "number",
          step: "any",
          inputMode: "decimal",
          placeholder: "Tap the map above",
          onChange: onCoordChange("lng"),
        })}
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
