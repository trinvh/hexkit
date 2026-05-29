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
      sample='<catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer Guide</title><price>44.95</price></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><price>5.95</price></book></catalog>'
      outputPlaceholder="Result appears here"
      errorTitle="XML error"
    />
  );
}
