import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { Toggle } from "../../components/ui/Toggle";
import { TextField } from "../../components/ui/TextField";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { JSON_MODES, runJson, type JsonMode } from "./run";

export function JsonTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<JsonMode>("  ");
  const [sort, setSort] = useState(false);
  const [path, setPath] = useState("");
  const { data, error, loading } = useLiveAction(
    () => runJson(input, mode, { sort, path }),
    [input, mode, sort, path],
  );

  return (
    <TransformLayout
      toolbar={
        <div className="flex items-center gap-2">
          <Segmented
            ariaLabel="JSON output mode"
            options={JSON_MODES}
            value={mode}
            onChange={setMode}
          />
          <Toggle active={sort} onClick={() => setSort((s) => !s)}>
            Sort keys
          </Toggle>
        </div>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language="json"
      inputLabel="JSON input"
      outputLabel="JSON output"
      sample={
        '{"store":{"book":[{"title":"Sayings of the Century","author":"Nigel Rees","price":8.95},{"title":"The Lord of the Rings","author":"J. R. R. Tolkien","price":22.99}],"bicycle":{"color":"red","price":19.95}}}'
      }
      inputPlaceholder={'Paste JSON here…\n\ne.g. {"hello":"world"}'}
      outputPlaceholder="Formatted output appears here"
      errorTitle={path.trim() ? "JSONPath error" : "Invalid JSON"}
      outputFooter={
        <TextField
          value={path}
          onChange={setPath}
          ariaLabel="JSONPath filter"
          placeholder="JSONPath, e.g. $.store.book[*].author"
          mono
        />
      }
    />
  );
}
