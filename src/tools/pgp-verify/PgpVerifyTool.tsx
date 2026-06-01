import { useToolState } from "../../lib/toolState";
import { useLiveAction } from "../../lib/useLiveAction";
import { cn } from "../../lib/cn";
import {
  ErrorBox,
  KeyArea,
  PgpLayout,
  Placeholder,
} from "../pgp-common/PgpLayout";
import {
  ALICE_PUBLIC_KEY,
  SAMPLE_SIGNATURE_FROM_ALICE,
  SAMPLE_SIGNED_DATA,
} from "../pgp-common/samples";
import { runVerify } from "./run";

export function PgpVerifyTool() {
  const [data, setData] = useToolState("data", "");
  const [signature, setSignature] = useToolState("signature", "");
  const [publicKey, setPublicKey] = useToolState("public_key", "");
  const { data: verification, error } = useLiveAction(
    () => runVerify(data, signature, publicKey),
    [data, signature, publicKey],
  );

  return (
    <PgpLayout
      title="PGP verify (detached signature)"
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              setData(SAMPLE_SIGNED_DATA);
              setSignature(SAMPLE_SIGNATURE_FROM_ALICE);
              setPublicKey(ALICE_PUBLIC_KEY);
            }}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setData("");
              setSignature("");
              setPublicKey("");
            }}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Clear
          </button>
        </>
      }
      form={
        <div className="space-y-4">
          <KeyArea
            label="Signed data"
            value={data}
            onChange={setData}
            placeholder="The exact content that was signed…"
            heightClass="h-28"
            ariaLabel="Signed data"
          />
          <KeyArea
            label="Detached signature"
            value={signature}
            onChange={setSignature}
            placeholder="-----BEGIN PGP SIGNATURE-----"
            heightClass="h-32"
            ariaLabel="Signature"
          />
          <KeyArea
            label="Signer public key"
            value={publicKey}
            onChange={setPublicKey}
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
            heightClass="h-52"
            ariaLabel="Public key"
          />
        </div>
      }
      output={
        error ? (
          <ErrorBox message={error} />
        ) : verification ? (
          <div
            className={cn(
              "rounded-xl border px-4 py-4 text-sm",
              verification.valid
                ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                : "border-red-500/40 bg-red-500/12 text-red-700 dark:text-red-400",
            )}
          >
            <div className="font-medium">
              {verification.valid ? "✓ Signature valid" : "✗ Signature invalid"}
            </div>
            {verification.signer_fingerprint && (
              <div className="mt-2 font-mono text-[11px] opacity-80 break-all">
                Signer fingerprint: {verification.signer_fingerprint}
              </div>
            )}
            {!verification.valid && verification.reason && (
              <div className="mt-1 text-xs opacity-80">{verification.reason}</div>
            )}
          </div>
        ) : (
          <Placeholder>
            Paste the signed data, the detached signature, and the signer&apos;s
            public key. Verification updates live as you type.
          </Placeholder>
        )
      }
    />
  );
}
