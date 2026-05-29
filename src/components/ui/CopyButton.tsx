import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/cn";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      aria-label={label || "Copy"}
      title="Copy"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs",
        "text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
      {label}
    </button>
  );
}
