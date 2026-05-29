import { useState } from "react";
import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { runSql } from "./run";

export function SqlTool() {
  const seed = useSeed();
  const [input, setInput] = useState(seed.value);
  const { data, error, loading } = useLiveAction(() => runSql(input), [input]);

  return (
    <TransformLayout
      toolbar={
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          SQL Formatter
        </span>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      language="sql"
      inputLabel="SQL input"
      outputLabel="SQL output"
      inputPlaceholder="select * from users where id = 1"
      sample="select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = true group by u.id, u.name having count(o.id) > 3 order by orders desc limit 10;"
      outputPlaceholder="Formatted SQL appears here"
      errorTitle="Error"
    />
  );
}
