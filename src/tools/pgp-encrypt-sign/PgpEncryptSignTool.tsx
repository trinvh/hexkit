import { useToolState } from "../../lib/toolState";
import { useLiveAction } from "../../lib/useLiveAction";
import { TextField } from "../../components/ui/TextField";
import {
  ErrorBox,
  KeyArea,
  OutputBlock,
  PgpLayout,
  Placeholder,
} from "../pgp-common/PgpLayout";
import {
  ALICE_PRIVATE_KEY,
  BOB_PUBLIC_KEY,
  SAMPLE_PLAINTEXT,
} from "../pgp-common/samples";
import { runEncryptSign } from "./run";

export function PgpEncryptSignTool() {
  const [plaintext, setPlaintext] = useToolState("plaintext", "");
  const [recipientKey, setRecipientKey] = useToolState("recipient_key", "");
  const [senderKey, setSenderKey] = useToolState("sender_key", "");
  const [passphrase, setPassphrase] = useToolState("passphrase", "");
  const { data, error } = useLiveAction(
    () => runEncryptSign(plaintext, recipientKey, senderKey, passphrase),
    [plaintext, recipientKey, senderKey, passphrase],
  );

  return (
    <PgpLayout
      title="PGP encrypt + sign"
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              setPlaintext(SAMPLE_PLAINTEXT);
              setRecipientKey(BOB_PUBLIC_KEY);
              setSenderKey(ALICE_PRIVATE_KEY);
              setPassphrase("");
            }}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaintext("");
              setRecipientKey("");
              setSenderKey("");
              setPassphrase("");
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
            label="Plaintext"
            value={plaintext}
            onChange={setPlaintext}
            placeholder="The message to encrypt and sign…"
            heightClass="h-24"
            ariaLabel="Plaintext"
          />
          <KeyArea
            label="Recipient public key"
            value={recipientKey}
            onChange={setRecipientKey}
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
            heightClass="h-40"
            ariaLabel="Recipient public key"
          />
          <KeyArea
            label="Sender private key"
            value={senderKey}
            onChange={setSenderKey}
            placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----"
            heightClass="h-40"
            ariaLabel="Sender private key"
          />
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
              Sender key passphrase (optional)
            </label>
            <TextField
              value={passphrase}
              onChange={setPassphrase}
              ariaLabel="Sender passphrase"
              placeholder="Leave blank for unprotected keys"
            />
          </div>
        </div>
      }
      output={
        error ? (
          <ErrorBox message={error} />
        ) : data ? (
          <OutputBlock label="Encrypted + signed message" value={data} />
        ) : (
          <Placeholder>
            Encrypts to the recipient and signs with the sender&apos;s key in
            one pass — the resulting message can be both decrypted and
            verified by the recipient.
          </Placeholder>
        )
      }
    />
  );
}
