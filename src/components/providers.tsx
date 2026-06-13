"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query/QueryProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
