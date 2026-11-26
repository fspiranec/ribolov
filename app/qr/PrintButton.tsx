"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3 font-extrabold text-white">
      <Printer className="h-5 w-5" /> {label}
    </button>
  );
}
