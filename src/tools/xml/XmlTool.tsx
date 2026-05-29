import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { XML_MODES, runXml, type XmlMode } from "./run";

export function XmlTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const [mode, setMode] = useState<XmlMode>("beautify");
  const { data, error, loading } = useLiveAction(
    () => runXml(input, mode),
    [input, mode],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="XML mode"
          options={XML_MODES}
          value={mode}
          onChange={setMode}
        />
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language="xml"
      inputLabel="XML input"
      outputLabel="XML output"
      inputPlaceholder="<root><item>value</item></root>"
      outputPlaceholder="Result appears here"
      errorTitle="XML error"
    />
  );
}
