import { ArrowUpCircle, CheckCircle2, MessageSquare } from "lucide-react";
import {
  APP_VERSION,
  FEEDBACK_URL,
  RELEASES_URL,
  openExternal,
} from "../../lib/version";
import { useUpdate } from "../../store/update";

export function SidebarFooter() {
  const result = useUpdate((s) => s.result);
  const updateAvailable = result?.kind === "update-available";
  const upToDate = result?.kind === "up-to-date";

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-xs text-fg-subtle">
      {updateAvailable ? (
        <button
          type="button"
          onClick={() =>
            void openExternal(result.releaseUrl ?? RELEASES_URL)
          }
          title={`Hexkit ${result.latest} is available — you're on ${result.current}`}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-accent transition-colors hover:bg-accent/10"
        >
          <ArrowUpCircle className="size-3.5" />
          <span>Update available</span>
        </button>
      ) : (
        <span
          className="inline-flex items-center gap-1.5 font-mono"
          title={
            upToDate
              ? `Hexkit ${APP_VERSION} — up to date`
              : `Hexkit ${APP_VERSION}`
          }
        >
          v{APP_VERSION}
          {upToDate && (
            <CheckCircle2
              className="size-3 text-[oklch(75%_0.15_150)]"
              aria-label="Up to date"
            />
          )}
        </span>
      )}
      <button
        type="button"
        onClick={() => void openExternal(FEEDBACK_URL)}
        title="Open the issue tracker on GitHub"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <MessageSquare className="size-3.5" />
        <span>Feedback</span>
      </button>
    </div>
  );
}
