import { useState } from "react";
import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { runDigests } from "./run";

export function HashTool() {
  const [input, setInput] = useState("");
  const [key, setKey] = useState("");
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
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
