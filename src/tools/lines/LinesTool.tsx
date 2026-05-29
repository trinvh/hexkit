import { Segmented } from "../../components/ui/Segmented";
import { Toggle } from "../../components/ui/Toggle";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { SORT_MODES, runLines, type SortMode } from "./run";

export function LinesTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const [sort, setSort] = useToolState<SortMode>("sort", "none");
  const [dedupe, setDedupe] = useToolState("dedupe", false);
  const [trim, setTrim] = useToolState("trim", false);
  const [caseInsensitive, setCaseInsensitive] = useToolState("ci", false);

  const { data, error, loading } = useLiveAction(
    () => runLines(input, { sort, dedupe, trim, caseInsensitive }),
    [input, sort, dedupe, trim, caseInsensitive],
  );

  return (
    <TransformLayout
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Sort order"
            options={SORT_MODES}
            value={sort}
            onChange={setSort}
          />
          <Toggle active={dedupe} onClick={() => setDedupe((v) => !v)}>
            Dedupe
          </Toggle>
          <Toggle active={trim} onClick={() => setTrim((v) => !v)}>
            Trim
          </Toggle>
          <Toggle
            active={caseInsensitive}
            onClick={() => setCaseInsensitive((v) => !v)}
          >
            Ignore case
          </Toggle>
        </div>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      inputLabel="Lines input"
      outputLabel="Lines output"
      inputPlaceholder="One item per line…"
      outputPlaceholder="Processed lines appear here"
      errorTitle="Error"
    />
  );
}
