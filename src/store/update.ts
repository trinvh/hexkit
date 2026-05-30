import { create } from "zustand";
import type { UpdateCheckResult } from "../lib/updateCheck";

interface UpdateState {
  /** Latest CheckForUpdate result, written by the auto-check at launch and
   * by any manual run from the menu so the sidebar badge stays coherent. */
  result: UpdateCheckResult | null;
  setResult: (result: UpdateCheckResult) => void;
}

export const useUpdate = create<UpdateState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
}));
