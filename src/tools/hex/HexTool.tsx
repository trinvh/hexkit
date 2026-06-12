import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import {
  HEX_CASE_OPTIONS,
  HEX_MODES,
  runHex,
  type HexCase,
  type HexMode,
} from "./run";

export function HexTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [mode, setMode] = useToolState<HexMode>(
    "mode",
    seed.mode === "decode" ? "decode" : "encode",
  );
  const [hexCase, setHexCase] = useToolState<HexCase>("case", "upper");
  const [delimiter, setDelimiter] = useToolState("delimiter", "");
  const { data, error, loading } = useLiveAction(
    () => runHex(input, mode, hexCase, delimiter),
    [input, mode, hexCase, delimiter],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Hex mode"
          options={HEX_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Hex input"
      outputLabel="Hex output"
      inputPlaceholder={mode === "encode" ? "Text…" : "Hex bytes…"}
      outputPlaceholder="Result appears here"
      errorTitle="Invalid hex"
      downloadName="hex.txt"
      outputFooter={
        mode === "encode" ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-fg-subtle">Case</span>
              <Segmented
                ariaLabel="Hex case"
                options={HEX_CASE_OPTIONS}
                value={hexCase}
                onChange={setHexCase}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-fg-subtle">Delimiter</span>
              <div className="w-28">
                <TextField
                  value={delimiter}
                  onChange={setDelimiter}
                  ariaLabel="Hex delimiter"
                  placeholder="none"
                  mono
                />
              </div>
            </div>
          </div>
        ) : undefined
      }
    />
  );
}
