import { TextField } from "../../components/ui/TextField";
import { InputActions } from "../../components/ui/InputActions";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runColor } from "./run";

export function ColorTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error } = useLiveAction(() => runColor(input), [input]);

  const rows = data
    ? [
        { label: "HEX", value: data.hex },
        { label: "HEX8", value: data.hex8 },
        { label: "RGB", value: data.rgb },
        { label: "RGBA", value: data.rgba },
        { label: "HSL", value: data.hsl },
        { label: "HSLA", value: data.hsla },
        { label: "HSB", value: data.hsb },
        { label: "HWB", value: data.hwb },
        { label: "CMYK", value: data.cmyk },
      ]
    : null;

  // The native picker only understands #rrggbb; reflect the parsed colour when
  // it is valid, otherwise fall back to black.
  const pickerValue =
    data && /^#[0-9a-fA-F]{6}$/.test(data.hex) ? data.hex : "#000000";

  return (
    <ResultLayout
      errorTitle="Invalid color"
      emptyHint="Enter a color (hex, rgb(), hsl(), hwb(), cmyk(), or a name)."
      header={
        <div className="flex items-center gap-3">
          <label className="relative size-10 shrink-0" title="Pick a color">
            <span
              className="block size-10 rounded-lg border border-border"
              style={{ backgroundColor: data?.hex ?? "transparent" }}
              aria-hidden
            />
            <input
              type="color"
              aria-label="Color picker"
              value={pickerValue}
              onChange={(e) => setInput(e.currentTarget.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <div className="flex-1">
            <TextField
              ariaLabel="Color value"
              value={input}
              onChange={setInput}
              placeholder="#3b82f6, rgb(59 130 246), hsl(217 91% 60%), or teal"
              mono
            />
          </div>
          <InputActions
            onInput={setInput}
            sample="#3b82f6"
            hasInput={input !== ""}
          />
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
