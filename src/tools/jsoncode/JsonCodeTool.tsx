import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { CODE_TARGETS, runJsonCode, type CodeTarget } from "./run";

export function JsonCodeTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [target, setTarget] = useState<CodeTarget>("typescript");
  const { data, error, loading } = useLiveAction(
    () => runJsonCode(input, target),
    [input, target],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Target language"
          options={CODE_TARGETS}
          value={target}
          onChange={setTarget}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language="json"
      inputLabel="JSON input"
      outputLabel="Generated types"
      inputPlaceholder='{"name":"hexkit","version":1}'
      outputPlaceholder="Generated type definitions appear here"
      errorTitle="Error"
    />
  );
}
