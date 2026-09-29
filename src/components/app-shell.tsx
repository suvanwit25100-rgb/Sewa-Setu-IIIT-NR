"use client";

import { usePathname } from "next/navigation";

// The login/landing page ("/") renders its own full-bleed, official-look-alike
// layout (accessibility bar, nav, hero) — every other route uses the app's
// normal constrained content column.
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/") return <>{children}</>;
  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5">{children}</main>;
}
