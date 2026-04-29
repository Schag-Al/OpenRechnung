"use client";

import { useState } from "react";

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      className="rounded-xl bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-moss"
    >
      {copied ? "Kopiert" : "Text kopieren"}
    </button>
  );
}
