import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runChmod } from "./run";
import type { ClassBits, SpecialBits } from "./api";

/** Render a class's bits as a compact "read, write, execute" summary. */
function classSummary(bits: ClassBits): string {
  const flags = [
    bits.read && "read",
    bits.write && "write",
    bits.execute && "execute",
  ].filter(Boolean);
  return flags.length > 0 ? flags.join(", ") : "none";
}

/** Render the special bits, or "none" when all are unset. */
function specialSummary(special: SpecialBits): string {
  const flags = [
    special.setuid && "setuid",
    special.setgid && "setgid",
    special.sticky && "sticky",
  ].filter(Boolean);
  return flags.length > 0 ? flags.join(", ") : "none";
}

export function ChmodTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error } = useLiveAction(() => runChmod(input), [input]);

  const rows = data
    ? [
        { label: "Octal", value: data.octal },
        { label: "Symbolic", value: data.symbolic },
        { label: "Owner", value: classSummary(data.owner) },
        { label: "Group", value: classSummary(data.group) },
        { label: "Others", value: classSummary(data.others) },
        { label: "Special", value: specialSummary(data.special) },
      ]
    : null;

  return (
    <ResultLayout
      errorTitle="Invalid mode"
      emptyHint="Enter an octal (755, 0644, 0o755) or symbolic (rwxr-xr-x) mode."
      header={
        <TextField
          ariaLabel="Permission mode"
          value={input}
          onChange={setInput}
          placeholder="755 or rwxr-xr-x"
          mono
        />
      }
      rows={rows}
      error={error}
    />
  );
}
