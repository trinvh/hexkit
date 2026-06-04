import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { AES_MODES, runAes, type AesMode } from "./run";

export function AesTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [password, setPassword] = useToolState("password", "");
  const [mode, setMode] = useToolState<AesMode>("mode", "encrypt");
  const { data, error, loading } = useLiveAction(
    () => runAes(input, password, mode),
    [input, password, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <div className="flex items-center gap-3">
          <Segmented
            ariaLabel="AES mode"
            options={AES_MODES}
            value={mode}
            onChange={setMode}
          />
          <div className="w-56">
            <TextField
              value={password}
              onChange={setPassword}
              ariaLabel="AES password"
              placeholder="Password…"
              mono
            />
          </div>
        </div>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="AES input"
      outputLabel="AES output"
      inputPlaceholder={
        mode === "encrypt" ? "Text to encrypt…" : "Base64 ciphertext…"
      }
      outputPlaceholder="Result appears here"
      errorTitle={mode === "encrypt" ? "Cannot encrypt" : "Cannot decrypt"}
    />
  );
}
