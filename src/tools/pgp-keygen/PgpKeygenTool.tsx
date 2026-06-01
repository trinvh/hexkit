import { useState } from "react";
import { useToolState } from "../../lib/toolState";
import { TextField } from "../../components/ui/TextField";
import {
  ErrorBox,
  OutputBlock,
  PgpLayout,
  Placeholder,
} from "../pgp-common/PgpLayout";
import { SAMPLE_USER_ID } from "../pgp-common/samples";
import { pgpKeygen, type Keypair } from "./api";

export function PgpKeygenTool() {
  const [userId, setUserId] = useToolState("user_id", "");
  const [passphrase, setPassphrase] = useToolState("passphrase", "");
  // Keygen is the one PGP op without continuous live evaluation — it would
  // burn a fresh keypair on every keystroke. The user clicks Generate.
  const [pair, setPair] = useState<Keypair | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (userId.trim() === "") return;
    setBusy(true);
    setError(null);
    try {
      const result = await pgpKeygen(userId, passphrase);
      setPair(result);
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
      setError(message);
      setPair(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PgpLayout
      title="Generate PGP key pair (Ed25519 + Curve25519)"
      actions={
        <>
          <button
            type="button"
            onClick={() => setUserId(SAMPLE_USER_ID)}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={generate}
            disabled={busy || userId.trim() === ""}
            className="rounded-md border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Generating…" : "Generate"}
          </button>
        </>
      }
      form={
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
              User ID
            </label>
            <TextField
              value={userId}
              onChange={setUserId}
              ariaLabel="User ID"
              placeholder="Alice <alice@hexkit.app>"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
              Passphrase (optional)
            </label>
            <TextField
              value={passphrase}
              onChange={setPassphrase}
              ariaLabel="Passphrase"
              placeholder="Leave blank for an unprotected key"
            />
          </div>
          <p className="text-xs text-fg-subtle">
            Primary key certifies. Subkeys sign (Ed25519) and encrypt
            (Curve25519). Output is ASCII-armored, GnuPG-compatible.
          </p>
        </div>
      }
      output={
        error ? (
          <ErrorBox message={error} />
        ) : pair ? (
          <div className="space-y-3">
            <OutputBlock label="Public key" value={pair.public_key} />
            <OutputBlock label="Private key" value={pair.private_key} />
            <OutputBlock label="Fingerprint" value={pair.fingerprint} />
          </div>
        ) : (
          <Placeholder>
            Enter a user id and click Generate. Generation is instant — Ed25519
            keypairs take a millisecond.
          </Placeholder>
        )
      }
    />
  );
}
