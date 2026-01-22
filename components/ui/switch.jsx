"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}) {
  return (
    (<SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}>
      <SwitchPrimitives.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background pointer-events-none block h-5 w-5 origin-right rounded-full shadow-xs ring-0 transition-all data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )} />
    </SwitchPrimitives.Root>)
  );
}

export { Switch }
