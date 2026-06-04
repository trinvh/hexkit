import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import type { ResultRow } from "../../components/ui/ResultList";
import { useLiveAction } from "../../lib/useLiveAction";
import { useToolState } from "../../lib/toolState";
import type { PwAlgorithm } from "./api";
import {
  PW_ALGORITHMS,
  PW_MODES,
  runHash,
  runVerify,
  type PwMode,
} from "./run";

export function PasswordHashTool() {
  const [algorithm, setAlgorithm] = useToolState<PwAlgorithm>(
    "algorithm",
    "bcrypt",
  );
  const [mode, setMode] = useToolState<PwMode>("mode", "hash");
  const [password, setPassword] = useToolState("password", "");
  const [hash, setHash] = useToolState("hash", "");

  // Map each mode's result into rows inside the compute so the live action has
  // a single concrete type (ResultRow[]) rather than a HashResult | string union.
  const { data: rows, error } = useLiveAction<ResultRow[]>(() => {
    if (mode === "hash") {
      const p = runHash(algorithm, password);
      return p ? p.then((r) => [{ label: "Hash", value: r.hash }]) : null;
    }
    const p = runVerify(algorithm, password, hash);
    return p ? p.then((valid) => [{ label: "Result", value: valid }]) : null;
  }, [mode, algorithm, password, hash]);

  return (
    <ResultLayout
      emptyHint={
        mode === "hash"
          ? "Enter a password to hash it."
          : "Enter a password and a hash to verify."
      }
      errorTitle="Password hashing failed"
      header={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              ariaLabel="Algorithm"
              options={PW_ALGORITHMS}
              value={algorithm}
              onChange={setAlgorithm}
            />
            <Segmented
              ariaLabel="Mode"
              options={PW_MODES}
              value={mode}
              onChange={setMode}
            />
          </div>
          <TextField
            ariaLabel="Password"
            value={password}
            onChange={setPassword}
            placeholder="Password…"
          />
          {mode === "verify" && (
            <TextField
              ariaLabel="Hash to verify"
              value={hash}
              onChange={setHash}
              placeholder="Existing hash…"
              mono
            />
          )}
        </div>
      }
      rows={rows}
      error={error}
    />
  );
}
