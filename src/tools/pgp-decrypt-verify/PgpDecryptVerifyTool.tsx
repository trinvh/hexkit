import { useToolState } from "../../lib/toolState";
import { useLiveAction } from "../../lib/useLiveAction";
import { TextField } from "../../components/ui/TextField";
import { cn } from "../../lib/cn";
import {
  ErrorBox,
  KeyArea,
  OutputBlock,
  PgpLayout,
  Placeholder,
} from "../pgp-common/PgpLayout";
import {
  ALICE_PUBLIC_KEY,
  BOB_PRIVATE_KEY,
  SAMPLE_SIGNED_CIPHERTEXT_ALICE_TO_BOB,
} from "../pgp-common/samples";
import { runDecryptVerify } from "./run";

export function PgpDecryptVerifyTool() {
  const [ciphertext, setCiphertext] = useToolState("ciphertext", "");
  const [recipientKey, setRecipientKey] = useToolState("recipient_key", "");
  const [passphrase, setPassphrase] = useToolState("passphrase", "");
  const [senderKey, setSenderKey] = useToolState("sender_key", "");
  const { data, error } = useLiveAction(
    () => runDecryptVerify(ciphertext, recipientKey, passphrase, senderKey),
    [ciphertext, recipientKey, passphrase, senderKey],
  );

  return (
    <PgpLayout
      title="PGP decrypt + verify"
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              setCiphertext(SAMPLE_SIGNED_CIPHERTEXT_ALICE_TO_BOB);
              setRecipientKey(BOB_PRIVATE_KEY);
              setPassphrase("");
              setSenderKey(ALICE_PUBLIC_KEY);
            }}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setCiphertext("");
              setRecipientKey("");
              setPassphrase("");
              setSenderKey("");
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
            label="Ciphertext"
            value={ciphertext}
            onChange={setCiphertext}
            placeholder="-----BEGIN PGP MESSAGE-----"
            heightClass="h-28"
            ariaLabel="Ciphertext"
          />
          <KeyArea
            label="Recipient private key"
            value={recipientKey}
            onChange={setRecipientKey}
            placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----"
            heightClass="h-40"
            ariaLabel="Recipient private key"
          />
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
              Recipient passphrase (optional)
            </label>
            <TextField
              value={passphrase}
              onChange={setPassphrase}
              ariaLabel="Passphrase"
              placeholder="Leave blank for unprotected keys"
            />
          </div>
          <KeyArea
            label="Sender public key (for signature verification)"
            value={senderKey}
            onChange={setSenderKey}
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
            heightClass="h-40"
            ariaLabel="Sender public key"
          />
        </div>
      }
      output={
        error ? (
          <ErrorBox message={error} />
        ) : data ? (
          <div className="space-y-3">
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                data.verification.valid
                  ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                  : "border-red-500/40 bg-red-500/12 text-red-700 dark:text-red-400",
              )}
            >
              <div className="font-medium">
                {data.verification.valid
                  ? "✓ Decrypted and signature valid"
                  : "✗ Decrypted but signature invalid"}
              </div>
              {data.verification.signer_fingerprint && (
                <div className="mt-2 font-mono text-[11px] opacity-80 break-all">
                  Signer fingerprint: {data.verification.signer_fingerprint}
                </div>
              )}
              {!data.verification.valid && data.verification.reason && (
                <div className="mt-1 text-xs opacity-80">{data.verification.reason}</div>
              )}
            </div>
            <OutputBlock label="Plaintext" value={data.plaintext} monospace={false} />
          </div>
        ) : (
          <Placeholder>
            Decrypt an inline-signed PGP message and verify its embedded
            signature in one step. Hit Sample for an Alice → Bob example.
          </Placeholder>
        )
      }
    />
  );
}
