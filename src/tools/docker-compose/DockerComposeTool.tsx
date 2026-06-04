import { TransformLayout } from "../../components/ui/TransformLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runDockerCompose } from "./run";

const SAMPLE =
  "docker run -d --name web -p 8080:80 -e NODE_ENV=production -v ./data:/var/data --restart unless-stopped nginx:latest";

export function DockerComposeTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error, loading } = useLiveAction(
    () => runDockerCompose(input),
    [input],
  );

  return (
    <TransformLayout
      toolbar={
        <span className="text-xs text-fg-subtle">
          docker run → docker-compose
        </span>
      }
      input={input}
      onInput={setInput}
      output={data ?? ""}
      error={error}
      loading={loading}
      outputLanguage="yaml"
      inputLabel="docker run command"
      outputLabel="docker-compose YAML"
      inputPlaceholder="docker run -p 8080:80 …"
      outputPlaceholder="docker-compose.yml appears here"
      errorTitle="Cannot convert command"
      sample={SAMPLE}
    />
  );
}
