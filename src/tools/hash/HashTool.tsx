import { TextField } from "../../components/ui/TextField";
import { InputActions } from "../../components/ui/InputActions";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import { runDigests } from "./run";

export function HashTool() {
  const [input, setInput] = useToolState("input", "");
  const [key, setKey] = useToolState("key", "");
  const { data, error } = useLiveAction(
    () => runDigests(input, key),
    [input, key],
  );

  const prefix = key === "" ? "" : "HMAC-";
  const rows = data
    ? [
        { label: `${prefix}MD5`, value: data.md5 },
        { label: `${prefix}SHA-1`, value: data.sha1 },
        { label: `${prefix}SHA-256`, value: data.sha256 },
        { label: `${prefix}SHA-512`, value: data.sha512 },
      ]
    : null;

  return (
    <ResultLayout
      emptyHint="Enter text to compute its hash digests."
      header={
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <TextField
              ariaLabel="Text to hash"
              value={input}
              onChange={setInput}
              placeholder="Enter text to hash…"
            />
          </div>
          <div className="flex-1">
            <TextField
              ariaLabel="HMAC key"
              value={key}
              onChange={setKey}
              placeholder="HMAC key (optional)…"
              mono
            />
          </div>
          <InputActions
            onInput={setInput}
            sample="The quick brown fox jumps over the lazy dog"
            hasInput={input !== ""}
          />
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
