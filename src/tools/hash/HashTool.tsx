import { useState } from "react";
import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { runHash } from "./run";

export function HashTool() {
  const [input, setInput] = useState("");
  const { data, error } = useLiveAction(() => runHash(input), [input]);

  const rows = data
    ? [
        { label: "MD5", value: data.md5 },
        { label: "SHA-1", value: data.sha1 },
        { label: "SHA-256", value: data.sha256 },
        { label: "SHA-512", value: data.sha512 },
      ]
    : null;

  return (
    <ResultLayout
      emptyHint="Enter text to compute its hash digests."
      header={
        <TextField
          ariaLabel="Text to hash"
          value={input}
          onChange={setInput}
          placeholder="Enter text to hash…"
        />
      }
      rows={rows}
      error={error}
    />
  );
}
