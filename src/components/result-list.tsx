import type { SearchHit } from "@/lib/types";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ResultList({
  hits,
  selectedId,
  searching,
  onSelect,
}: {
  hits: SearchHit[];
  selectedId: string | null;
  searching: boolean;
  onSelect: (id: string) => void;
}) {
  if (searching) {
    return (
      <ul className="space-y-3" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="h-24 animate-pulse rounded-2xl bg-line/70" />
        ))}
      </ul>
    );
  }

  if (hits.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-ink/70">
        No campaign briefs match this search yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {hits.map((hit) => {
        const selected = hit.id === selectedId;
        return (
          <li key={hit.id}>
            <button
              type="button"
              onClick={() => onSelect(hit.id)}
              aria-pressed={selected}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                selected ? "glow-edge border-teal bg-card" : "border-line bg-card hover:border-teal/40"
              }`}
            >
              <p className="font-medium text-ink">{hit.title}</p>
              <p className="mt-1 text-sm text-ink/70">{hit.headline}</p>
              <p className="mt-2 text-xs text-ink/50" suppressHydrationWarning>
                {formatWhen(hit.updatedAt)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
