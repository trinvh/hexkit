import { runAction } from "../../lib/ipc";

export type TlvEncoding = "hex" | "base64";

export interface TlvNode {
  tag: string;
  tagClass: string;
  constructed: boolean;
  length: number;
  value: string;
  ascii: string | null;
  name: string | null;
  children: TlvNode[];
}

interface RawNode {
  tag: string;
  tag_class: string;
  constructed: boolean;
  length: number;
  value: string;
  ascii: string | null;
  name: string | null;
  children: RawNode[];
}

function normalize(node: RawNode): TlvNode {
  return {
    tag: node.tag,
    tagClass: node.tag_class,
    constructed: node.constructed,
    length: node.length,
    value: node.value,
    ascii: node.ascii,
    name: node.name,
    children: node.children.map(normalize),
  };
}

export async function tlvDecode(
  input: string,
  encoding: TlvEncoding,
): Promise<TlvNode[]> {
  const raw = await runAction<RawNode[]>("tlv.decode", { input, encoding });
  return raw.map(normalize);
}
