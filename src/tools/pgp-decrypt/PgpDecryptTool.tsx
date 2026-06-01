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
  BOB_PRIVATE_KEY,
  SAMPLE_CIPHERTEXT_FOR_BOB,
} from "../pgp-common/samples";
import { runDecrypt } from "./run";

export function PgpDecryptTool() {
  const [ciphertext, setCiphertext] = useToolState("ciphertext", "");
  const [privateKey, setPrivateKey] = useToolState("private_key", "");
  const [passphrase, setPassphrase] = useToolState("passphrase", "");
  const { data, error } = useLiveAction(
    () => runDecrypt(ciphertext, privateKey, passphrase),
    [ciphertext, privateKey, passphrase],
  );

  return (
    <PgpLayout
      title="PGP decrypt"
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              setCiphertext(SAMPLE_CIPHERTEXT_FOR_BOB);
              setPrivateKey(BOB_PRIVATE_KEY);
              setPassphrase("");
            }}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setCiphertext("");
              setPrivateKey("");
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
            label="Ciphertext (ASCII-armored)"
            value={ciphertext}
            onChange={setCiphertext}
            placeholder="-----BEGIN PGP MESSAGE-----"
            heightClass="h-40"
            ariaLabel="Ciphertext"
          />
          <KeyArea
            label="Private key"
            value={privateKey}
            onChange={setPrivateKey}
            placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----"
            heightClass="h-56"
            ariaLabel="Private key"
          />
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
              Passphrase (if the key is protected)
            </label>
            <TextField
              value={passphrase}
              onChange={setPassphrase}
              ariaLabel="Passphrase"
              placeholder="Leave blank if the key has no passphrase"
            />
          </div>
        </div>
      }
      output={
        error ? (
          <ErrorBox message={error} />
        ) : data ? (
          <OutputBlock label="Plaintext" value={data.plaintext} monospace={false} />
        ) : (
          <Placeholder>
            Paste a PGP-armored ciphertext and the matching private key to
            decrypt. Hit Sample to load a message encrypted to Bob.
          </Placeholder>
        )
      }
    />
  );
}
