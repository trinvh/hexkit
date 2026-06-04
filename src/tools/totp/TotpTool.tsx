import { useEffect, useState } from "react";
import { Segmented } from "../../components/ui/Segmented";
import { TextField } from "../../components/ui/TextField";
import { CopyButton } from "../../components/ui/CopyButton";
import { useToolState } from "../../lib/toolState";
import { errorMessage } from "../../lib/ipc";
import {
  ALGORITHM_OPTIONS,
  DIGIT_OPTIONS,
  PERIOD_OPTIONS,
  nowUnixSeconds,
  type Digits,
  type Period,
} from "./run";
import {
  qrGenerate,
  totpGenerate,
  totpUri,
  type TotpAlgorithm,
  type TotpCode,
} from "./api";

export function TotpTool() {
  const [secret, setSecret] = useToolState("secret", "");
  const [issuer, setIssuer] = useToolState("issuer", "");
  const [account, setAccount] = useToolState("account", "");
  const [algorithm, setAlgorithm] = useToolState<TotpAlgorithm>(
    "algorithm",
    "SHA1",
  );
  const [digits, setDigits] = useToolState<Digits>("digits", "6");
  const [period, setPeriod] = useToolState<Period>("period", "30");

  const options = {
    algorithm,
    digits: Number(digits),
    period: Number(period),
  };

  const [code, setCode] = useState<TotpCode | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Recompute the live code once per second from the browser wall clock so the
  // displayed code and countdown stay in sync with real time.
  useEffect(() => {
    if (secret.trim() === "") {
      setCode(null);
      setCodeError(null);
      return;
    }
    let cancelled = false;
    async function tick() {
      try {
        const next = await totpGenerate(secret, options, nowUnixSeconds());
        if (!cancelled) {
          setCode(next);
          setCodeError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCode(null);
          setCodeError(errorMessage(e));
        }
      }
    }
    void tick();
    const id = setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, algorithm, digits, period]);

  const [uri, setUri] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [uriError, setUriError] = useState<string | null>(null);

  // The provisioning URI and its QR only change with the inputs, not the clock.
  useEffect(() => {
    if (secret.trim() === "") {
      setUri(null);
      setSvg(null);
      setUriError(null);
      return;
    }
    let cancelled = false;
    async function build() {
      try {
        const nextUri = await totpUri(
          secret,
          issuer || "Hexkit",
          account || "account",
          options,
        );
        const nextSvg = await qrGenerate(nextUri);
        if (!cancelled) {
          setUri(nextUri);
          setSvg(nextSvg);
          setUriError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setUri(null);
          setSvg(null);
          setUriError(errorMessage(e));
        }
      }
    }
    void build();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, issuer, account, algorithm, digits, period]);

  return (
    <div className="flex min-h-0 flex-col gap-5 overflow-auto p-4">
      <div className="flex flex-col gap-3">
        <label
          htmlFor="totp-secret"
          className="text-xs font-medium uppercase tracking-wider text-fg-subtle"
        >
          Base32 secret
        </label>
        <TextField
          ariaLabel="Base32 secret"
          value={secret}
          onChange={setSecret}
          placeholder="JBSWY3DPEHPK3PXP"
          mono
        />
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="Algorithm"
            options={ALGORITHM_OPTIONS}
            value={algorithm}
            onChange={setAlgorithm}
          />
          <Segmented
            ariaLabel="Digits"
            options={DIGIT_OPTIONS}
            value={digits}
            onChange={setDigits}
          />
          <Segmented
            ariaLabel="Period"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
          />
        </div>
      </div>

      {codeError ? (
        <p className="text-sm text-accent">{codeError}</p>
      ) : code ? (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4">
          <span className="font-mono text-3xl tracking-[0.3em] text-fg">
            {code.code}
          </span>
          <span
            aria-label="Seconds remaining"
            className="ml-auto text-sm tabular-nums text-fg-muted"
          >
            {code.secondsRemaining}s
          </span>
          <CopyButton value={code.code} label="Copy" />
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">
          Enter a Base32 secret to see the current code.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TextField
          ariaLabel="Issuer"
          value={issuer}
          onChange={setIssuer}
          placeholder="Issuer (e.g. Hexkit)"
        />
        <TextField
          ariaLabel="Account"
          value={account}
          onChange={setAccount}
          placeholder="Account (e.g. alice@example.com)"
        />
      </div>

      {uriError ? (
        <p className="text-sm text-accent">{uriError}</p>
      ) : uri ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Provisioning URI
          </h2>
          <div className="flex items-start gap-4">
            {svg && (
              <div
                className="w-40 shrink-0 rounded-xl border border-border bg-white p-3"
                // SVG is generated by our own backend, so it is safe to inline.
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <code className="break-all rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-fg">
                {uri}
              </code>
              <CopyButton value={uri} label="Copy URI" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
