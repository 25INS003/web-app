"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressInputSchema } from "@/lib/api/schemas/address";
import type { AddressInput } from "@/lib/api/schemas/address";
import { cn } from "@/lib/utils";
import { useAddAddress } from "./hooks";

export function AddressForm({ onDone }: { onDone: () => void }) {
  const add = useAddAddress();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues: {
      contact_name: "",
      contact_phone: "",
      address_line: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      tag: "home",
    },
  });
  const tag = watch("tag");

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
      onSubmit={handleSubmit((v) => add.mutate(v, { onSuccess: onDone }))}
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
        <Button type="submit" disabled={add.isPending}>
          {add.isPending && <Loader2 className="animate-spin" />}
          Save address
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
