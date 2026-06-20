"use client";

import Link from "next/link";
import { Lock, X } from "lucide-react";
import type { GateResult } from "@promptgenius/core";
import { Button } from "@/components/ui/button";

export function UpgradeDialog({
  gate,
  onClose,
}: {
  gate: GateResult | null;
  onClose: () => void;
}) {
  if (!gate || gate.allowed) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card glow relative w-full max-w-md p-7">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-slate-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand-soft">
          <Lock className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-slate-50">Upgrade to unlock</h3>
        <p className="mt-2 text-sm text-muted">{gate.message}</p>
        <div className="mt-6 flex gap-3">
          <Link href="/pricing" className="flex-1">
            <Button className="w-full">See plans</Button>
          </Link>
          <Button variant="secondary" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
