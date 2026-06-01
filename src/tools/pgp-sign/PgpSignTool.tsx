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
  SAMPLE_SIGNED_DATA,
} from "../pgp-common/samples";
import { runSign } from "./run";

export function PgpSignTool() {
  const [data, setData] = useToolState("data", "");
  const [privateKey, setPrivateKey] = useToolState("private_key", "");
  const [passphrase, setPassphrase] = useToolState("passphrase", "");
  const { data: signature, error } = useLiveAction(
    () => runSign(data, privateKey, passphrase),
    [data, privateKey, passphrase],
  );

  return (
    <PgpLayout
      title="PGP sign (detached signature)"
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              setData(SAMPLE_SIGNED_DATA);
              setPrivateKey(ALICE_PRIVATE_KEY);
              setPassphrase("");
            }}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setData("");
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
            label="Data to sign"
            value={data}
            onChange={setData}
            placeholder="The document or message you want to sign…"
            heightClass="h-32"
            ariaLabel="Data to sign"
          />
          <KeyArea
            label="Signing private key"
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
              placeholder="Leave blank for unprotected keys"
            />
          </div>
        </div>
      }
      output={
        error ? (
          <ErrorBox message={error} />
        ) : signature ? (
          <OutputBlock label="Detached signature" value={signature} />
        ) : (
          <Placeholder>
            Paste data and a signing private key. The signature normalizes
            line endings so it stays valid across LF / CRLF.
          </Placeholder>
        )
      }
    />
  );
}
