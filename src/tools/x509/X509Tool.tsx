import { CodeEditor } from "../../components/ui/CodeEditor";
import { InputActions } from "../../components/ui/InputActions";
import { ResultList } from "../../components/ui/ResultList";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runX509 } from "./run";

// Self-signed sample so the tool has something to chew on out of the box.
// CN=hexkit.app with SANs for the marketing domain, the `hexkit://` URI
// scheme and a contact email — handy for exercising every column of the
// inspector. RSA-2048 / sha256WithRSAEncryption, 825-day validity.
const SAMPLE = `-----BEGIN CERTIFICATE-----
MIIEWDCCA0CgAwIBAgIUHgAFo35Ropk81P37zgKyVsd9DswwDQYJKoZIhvcNAQEL
BQAwejETMBEGA1UEAwwKaGV4a2l0LmFwcDEPMA0GA1UECgwGSGV4a2l0MRgwFgYD
VQQLDA9EZXZlbG9wZXIgVG9vbHMxFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xEzAR
BgNVBAgMCkNhbGlmb3JuaWExCzAJBgNVBAYTAlVTMB4XDTI2MDUzMDA4NDkzNFoX
DTI4MDkwMTA4NDkzNFowejETMBEGA1UEAwwKaGV4a2l0LmFwcDEPMA0GA1UECgwG
SGV4a2l0MRgwFgYDVQQLDA9EZXZlbG9wZXIgVG9vbHMxFjAUBgNVBAcMDVNhbiBG
cmFuY2lzY28xEzARBgNVBAgMCkNhbGlmb3JuaWExCzAJBgNVBAYTAlVTMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo2YZpsX666Fh+AhEkWvy0Dqa8Ce3
r3wCi4uophPA3DbIHk1WV60qvQ4vK3zttKKLdtceHmOyFJivNLX1TD/yXhJL6BzQ
wAUiQUJtb4bCoQ/2PQRDx0Vf9jFa+AqAK+XXBbR1ISrXhAvKH/Gn0DOSQXDXQcjU
T7EK8RUU0Ckbq39tqsxr11Tvzrphqv5IMUPKa5gea4KxVzMnPqGdnnLmD55SUJem
zqy5l3YMqRQ7ucVSuEK1K3d7xIJMp3HS9R9q4DGKJ9WmeJXTd4FeOiFzge5KpXvp
zQbS3JBvJKOWykSq8m4DIFY5cYoFh1XtjbF7w24KoFXtVZJFdfUbNatO6QIDAQAB
o4HVMIHSMB0GA1UdDgQWBBQVah0YiuKoQzzSc19o/RGjcTMU7zAfBgNVHSMEGDAW
gBQVah0YiuKoQzzSc19o/RGjcTMU7zBTBgNVHREETDBKggpoZXhraXQuYXBwgg53
d3cuaGV4a2l0LmFwcIIMKi5oZXhraXQuYXBwhgxoZXhraXQ6Ly9hcHCBEGhlbGxv
QGhleGtpdC5hcHAwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMB
BggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQAEnSX2
ILENic3nzfZysnOTV1tfigLwCnJUpD06zIKzGzfOwBYqHtFBRlYUqpfeBZ30mr3b
0V7XRd7ciEADTWbjbeQaaraBdDEPOkytZlx8URUiaI0pVDEJ4L3CeWo7rltEFrO0
Ut2S4rxZrzTFxK+HflraluvqX7mnrdRn2h70G7G8JX1dcgZ9r6czYT0h1nhFqD2O
6J8k58PW/Qe8dl/jJw135CN33dFk7GBby5Mw9iqq9yG+z71f+9eQ/5x0oAfvONjh
tmRUtchvDysAkP2EtZlzsmIqTEDAKoTyEPvtGEKl4iF9pPl3ztzsJpgSbZj5oRO0
5s+7luuOnn0+87aq
-----END CERTIFICATE-----`;

export function X509Tool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error } = useLiveAction(() => runX509(input), [input]);

  const rows = data
    ? [
        { label: "Subject", value: data.subject },
        { label: "Issuer", value: data.issuer },
        { label: "Serial", value: data.serial },
        { label: "Not before", value: data.not_before },
        { label: "Not after", value: data.not_after },
        { label: "Algorithm", value: data.signature_algorithm },
        { label: "Version", value: data.version },
      ]
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="text-xs uppercase tracking-wider text-fg-subtle">
          X.509 certificate decoder
        </span>
        <InputActions onInput={setInput} sample={SAMPLE} hasInput={input !== ""} />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
        <div className="min-h-0 overflow-hidden">
          <CodeEditor
            value={input}
            onChange={setInput}
            ariaLabel="Certificate (PEM)"
            placeholder="-----BEGIN CERTIFICATE-----"
          />
        </div>
        <div className="min-h-0 overflow-auto p-4">
          {error ? (
            <div className="rounded-lg border border-border-strong bg-surface px-4 py-3 text-sm">
              <span className="font-medium text-accent">Invalid certificate</span>
              <span className="ml-2 text-fg-muted">{error}</span>
            </div>
          ) : rows ? (
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <ResultList rows={rows} />
            </div>
          ) : (
            <p className="text-sm text-fg-subtle">
              Paste a PEM certificate to decode it, or hit Sample for a
              ready-made hexkit.app cert.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
