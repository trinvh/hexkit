import { TextField } from "../../components/ui/TextField";
import { ResultLayout } from "../../components/ui/ResultLayout";
import { useLiveAction } from "../../lib/useLiveAction";
import { useSeed } from "../../lib/seed";
import { useToolState } from "../../lib/toolState";
import { runCidr } from "./run";

export function CidrTool() {
  const seed = useSeed();
  const [input, setInput] = useToolState("input", seed.value);
  const { data, error } = useLiveAction(() => runCidr(input), [input]);

  const rows = data
    ? [
        { label: "Version", value: `IPv${data.version}` },
        { label: "Network", value: data.network },
        { label: "Prefix", value: `/${data.prefixLen}` },
        { label: "Netmask", value: data.netmask },
        // Wildcard mask and broadcast only exist for IPv4.
        ...(data.version === 4
          ? [
              { label: "Host Mask", value: data.hostMask },
              { label: "Broadcast", value: data.broadcast },
            ]
          : []),
        { label: "First Host", value: data.firstHost },
        { label: "Last Host", value: data.lastHost },
        { label: "Usable Hosts", value: data.usableHosts },
        { label: "Total", value: data.totalAddresses },
      ]
    : null;

  return (
    <ResultLayout
      errorTitle="Invalid CIDR block"
      emptyHint="Enter a CIDR block or IP address to compute its subnet."
      header={
        <TextField
          ariaLabel="CIDR block"
          value={input}
          onChange={setInput}
          placeholder="192.168.1.0/24 or 2001:db8::/32"
          mono
        />
      }
      rows={rows}
      error={error}
    />
  );
}
