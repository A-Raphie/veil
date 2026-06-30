"use client";

/** Copy-to-clipboard for addresses/strings, with a brief confirmation. */

import { useState } from "react";
import { Check, Copy as CopyIcon } from "lucide-react";
import { pushToast } from "./toast";

export function Copy({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      pushToast("info", label ? `Copied ${label}` : "Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      pushToast("error", "Couldn't access clipboard");
    }
  };

  return (
    <button
      className="text-slate-500 transition-colors hover:text-white"
      onClick={onCopy}
      title="Copy address"
      aria-label="Copy address"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
    </button>
  );
}
