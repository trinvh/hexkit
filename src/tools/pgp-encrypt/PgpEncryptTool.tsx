import { useToolState } from "../../lib/toolState";
import { useLiveAction } from "../../lib/useLiveAction";
import {
  ErrorBox,
  KeyArea,
  OutputBlock,
  PgpLayout,
  Placeholder,
} from "../pgp-common/PgpLayout";
import {
  BOB_PUBLIC_KEY,
  SAMPLE_PLAINTEXT,
} from "../pgp-common/samples";
import { runEncrypt } from "./run";

export function PgpEncryptTool() {
  const [plaintext, setPlaintext] = useToolState("plaintext", "");
  const [publicKey, setPublicKey] = useToolState("public_key", "");
  const { data, error } = useLiveAction(
    () => runEncrypt(plaintext, publicKey),
    [plaintext, publicKey],
  );

  return (
    <PgpLayout
      title="PGP encrypt"
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              setPlaintext(SAMPLE_PLAINTEXT);
              setPublicKey(BOB_PUBLIC_KEY);
            }}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaintext("");
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
            label="Plaintext"
            value={plaintext}
            onChange={setPlaintext}
            placeholder="The message you want to encrypt…"
            heightClass="h-32"
            ariaLabel="Plaintext"
          />
          <KeyArea
            label="Recipient public key (ASCII-armored)"
            value={publicKey}
            onChange={setPublicKey}
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
            heightClass="h-72"
            ariaLabel="Recipient public key"
          />
        </div>
      }
      output={
        error ? (
          <ErrorBox message={error} />
        ) : data ? (
          <OutputBlock label="Encrypted message" value={data} />
        ) : (
          <Placeholder>
            Paste a plaintext message and the recipient&apos;s public key, or
            hit Sample to load a Bob keypair.
          </Placeholder>
        )
      }
    />
  );
}
