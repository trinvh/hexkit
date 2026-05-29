import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runUrlParse } from "./run";

export function UrlParseTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error } = useLiveAction(() => runUrlParse(input), [input]);

  const rows = data
    ? [
        { label: "Scheme", value: data.scheme },
        { label: "Host", value: data.host },
        { label: "Port", value: data.port },
        { label: "Path", value: data.path },
        { label: "Query", value: data.query },
        { label: "Fragment", value: data.fragment },
        { label: "Username", value: data.username },
        { label: "Password", value: data.password },
        ...data.query_params.map((param) => ({
          label: `?${param.key}`,
          value: param.value,
        })),
      ]
    : null;

  return (
    <ResultLayout
      errorTitle="Invalid URL"
      emptyHint="Enter a URL to break it into parts."
      header={
        <TextField
          ariaLabel="URL to parse"
          value={input}
          onChange={setInput}
          placeholder="https://example.com/path?x=1"
          mono
        />
      }
      rows={rows}
      error={error}
    />
  );
}
