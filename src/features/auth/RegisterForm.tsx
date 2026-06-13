"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerInputSchema } from "@/lib/api/schemas/auth";
import type { RegisterInput } from "@/lib/api/schemas/auth";
import { cn } from "@/lib/utils";
import { useRegister } from "./useAuth";

const ROLES = [
  { value: "customer", label: "I'm shopping" },
  { value: "shop_owner", label: "I'm selling" },
] as const;

export function RegisterForm() {
  const signup = useRegister();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      user_type: "customer",
    },
  });
  const role = watch("user_type");

  return (
    <form
      onSubmit={handleSubmit((v) => signup.mutate(v))}
      className="space-y-4"
      noValidate
    >
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setValue("user_type", r.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              role === r.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" autoComplete="given-name" {...register("first_name")} />
          {errors.first_name && (
            <p className="text-xs text-destructive">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" autoComplete="family-name" {...register("last_name")} />
          {errors.last_name && (
            <p className="text-xs text-destructive">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Phone <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={signup.isPending}>
        {signup.isPending && <Loader2 className="animate-spin" />}
        {role === "shop_owner" ? "Create seller account" : "Create account"}
      </Button>
    </form>
  );
}
