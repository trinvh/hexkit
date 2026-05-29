import { cn } from "../../lib/cn";

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  mono?: boolean;
}

export function TextField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  mono = false,
}: TextFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none",
        "placeholder:text-fg-subtle focus:border-border-strong",
        mono && "font-mono",
      )}
    />
  );
}
