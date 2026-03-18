"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryProvider } from "./QueryProvider";
import { GunProvider } from "./GunProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Phase 3 & 4 Background Boot: Helia IPFS and Service Worker
      import("@/lib/helia-node").then(mod => mod.initHeliaNode().catch(console.error));
      import("@/lib/sw-manager").then(mod => mod.initServiceWorker().catch(console.error));
    }
  }, []);

  return (
    <QueryProvider>
      <GunProvider>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </GunProvider>
    </QueryProvider>
  );
}
