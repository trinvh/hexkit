import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { CODE_TARGETS, runJsonCode, type CodeTarget } from "./run";

export function JsonCodeTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [target, setTarget] = useToolState<CodeTarget>("target", "typescript");
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
      inputLanguage="json"
      outputLanguage={target === "typescript" ? "javascript" : undefined}
      inputLabel="JSON input"
      outputLabel="Generated types"
      inputPlaceholder='{"name":"hexkit","version":1}'
      sample='{"id":1,"name":"hexkit","tags":["json","yaml"],"meta":{"active":true,"score":4.5}}'
      outputPlaceholder="Generated type definitions appear here"
      errorTitle="Error"
    />
  );
}
