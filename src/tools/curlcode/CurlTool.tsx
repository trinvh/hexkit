import { useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { CURL_TARGETS, runCurl, type CurlTarget } from "./run";

export function CurlTool() {
  const seed = useSeed();
  const [command, setCommand] = useState(seed.value);
  const [target, setTarget] = useState<CurlTarget>("js");
  const { data, error, loading } = useLiveAction(
    () => runCurl(command, target),
    [command, target],
  );

  return (
    <TransformLayout
      toolbar={
        <Segmented
          ariaLabel="Target language"
          options={CURL_TARGETS}
          value={target}
          onChange={setTarget}
        />
      }
      input={command}
      onInput={setCommand}
      output={data ?? ""}
      error={error}
      loading={loading}
      outputLanguage={target === "js" ? "javascript" : undefined}
      inputLabel="cURL command"
      outputLabel="Generated code"
      inputPlaceholder="curl -X POST https://api.example.com -d '{}'"
      sample={
        'curl -X POST https://api.example.com/users -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d \'{"name":"Alice","role":"admin"}\''
      }
      outputPlaceholder="Generated request code appears here"
      errorTitle="Error"
    />
  );
}
