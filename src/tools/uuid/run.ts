import type { SegmentedOption } from "../../components/ui/Segmented";
import { idInspect, type Inspection } from "./api";

export const ID_KINDS: ReadonlyArray<SegmentedOption<string>> = [
  { value: "uuid_v4", label: "UUID v4" },
  { value: "uuid_v7", label: "UUID v7" },
  { value: "ulid", label: "ULID" },
];

export function runInspect(value: string): Promise<Inspection> | null {
  if (value.trim() === "") return null;
  return idInspect(value);
}
