"use client";

import { useRef, useState } from "react";
import type { SimilarityPair, SimilarityView } from "@/lib/types";

type PairGroup = "all" | "absolute" | "likely" | "review";

type LabeledPair = SimilarityPair & { group: Exclude<PairGroup, "all">; key: string };

function percent(score: number) {
  return `${Math.round(score * 1000) / 10}%`;
}

function labelPairs(pairs: SimilarityPair[], group: Exclude<PairGroup, "all">) {
  return pairs.map((pair, index) => ({
    ...pair,
    group,
    key: `${group}-${pair.targetCampaignId}-${pair.candidateCampaignId}-${pair.fileName}-${index}`,
  }));
}

const groupLabels: Record<PairGroup, string> = {
  all: "All",
  absolute: "Absolute",
  likely: "Likely",
  review: "Review",
};

export function SimilarityBoard({
  similarity,
}: {
  similarity: SimilarityView;
}) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [group, setGroup] = useState<PairGroup>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const absolute = labelPairs(similarity.absolutePairs, "absolute");
  const likely = labelPairs(similarity.likelyPairs, "likely");
  const review = labelPairs(similarity.reviewPairs, "review");
  const allPairs = [...absolute, ...likely, ...review];
  const visible = group === "all" ? allPairs : group === "absolute" ? absolute : group === "likely" ? likely : review;
  const selected = visible.find((pair) => pair.key === selectedKey) ?? visible[0] ?? null;
  const campaignCount = allPairs.length + similarity.unpairedTargets.length;
  const briefScore = similarity.briefSimilarityScore;
  const overall = briefScore ?? (campaignCount === 0 ? 0 : allPairs.reduce((sum, pair) => sum + pair.similarityScore, 0) / campaignCount);
  const headline = similarity.matchKind === "complementation" ? "Complementation" : "Brief similarity";

  function showPair(pair: LabeledPair) {
    setSelectedKey(pair.key);
    document.getElementById(`pair-${pair.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  function step(direction: -1 | 1) {
    if (!selected) return;
    const index = visible.findIndex((pair) => pair.key === selected.key);
    const next = visible[index + direction];
    if (next) showPair(next);
  }

  return (
    <div className="space-y-5">
      <section className="glow-edge rounded-3xl bg-card p-5 ring-1 ring-line">
        <p className="text-xs uppercase tracking-[0.16em] text-teal">{headline}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="font-display text-5xl leading-none text-ink">{percent(overall)}</p>
          <p className="max-w-xs text-sm text-ink/70">
            {similarity.matchKind === "complementation"
              ? "The shorter brief matches as a piece of the longer one. Extra campaigns are not counted as misses."
              : "Match between the two briefs, based on the campaigns that pair."}
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(0, Math.min(100, overall * 100))}%` }} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ink/50">Absolute</dt>
            <dd className="font-medium">{absolute.length}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Likely</dt>
            <dd className="font-medium">{likely.length}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Review</dt>
            <dd className="font-medium">{review.length}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Unpaired</dt>
            <dd className="font-medium">{similarity.unpairedTargets.length}</dd>
          </div>
        </dl>
      </section>

      {similarity.warnings.length > 0 ? (
        <ul className="space-y-1 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {similarity.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["all", "absolute", "likely", "review"] as PairGroup[]).map((item) => {
          const count = item === "all" ? allPairs.length : item === "absolute" ? absolute.length : item === "likely" ? likely.length : review.length;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={group === item}
              onClick={() => setGroup(item)}
              className={`rounded-full px-3 py-1 text-sm ${group === item ? "bg-teal text-white" : "bg-card text-ink ring-1 ring-line"}`}
            >
              {groupLabels[item]} {count}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-ink/70">
          No {group === "all" ? "" : `${group} `}pairs in this result.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl text-ink">Campaign pairs</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => step(-1)} className="rounded-full bg-card px-3 py-1 text-sm ring-1 ring-line" aria-label="Previous pair">
                Previous
              </button>
              <button type="button" onClick={() => step(1)} className="rounded-full bg-card px-3 py-1 text-sm ring-1 ring-line" aria-label="Next pair">
                Next
              </button>
            </div>
          </div>
          <div ref={scroller} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {visible.map((pair) => {
              const active = selected?.key === pair.key;
              return (
                <button
                  id={`pair-${pair.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`}
                  key={pair.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => showPair(pair)}
                  className={`w-64 shrink-0 snap-start rounded-2xl border bg-card p-4 text-left ${active ? "border-teal shadow-sm" : "border-line"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-ink/50">{pair.group}</span>
                    <span className="text-lg font-medium text-teal-deep">{percent(pair.similarityScore)}</span>
                  </div>
                  <p className="mt-3 font-medium text-ink">
                    {pair.targetCampaignId} → {pair.candidateCampaignId}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/60">{pair.fileName || "Candidate file unavailable"}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected ? (
        <section className="rounded-3xl border border-teal/30 bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-teal">{selected.group} pair</p>
              <h3 className="mt-1 font-display text-2xl text-ink">
                {selected.targetCampaignId} → {selected.candidateCampaignId}
              </h3>
              <p className="mt-1 text-sm text-ink/70">
                {selected.fileName || "Candidate file unavailable"} · {selected.pairBasis || selected.scoringPath || "content"}
              </p>
            </div>
            <p className="font-display text-4xl text-ink">{percent(selected.similarityScore)}</p>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-paper px-3 py-2">
              <dt className="text-ink/50">Style</dt>
              <dd className="font-medium">{percent(selected.styleDirectionSimilarity)}</dd>
            </div>
            <div className="rounded-2xl bg-paper px-3 py-2">
              <dt className="text-ink/50">Wording</dt>
              <dd className="font-medium">{percent(selected.campaignWordingSimilarity)}</dd>
            </div>
            <div className="rounded-2xl bg-paper px-3 py-2">
              <dt className="text-ink/50">Dealership</dt>
              <dd className="font-medium">{percent(selected.dealershipRelationship)}</dd>
            </div>
          </dl>
          {selected.matchReason ? <p className="mt-4 text-sm leading-6 text-ink">{selected.matchReason}</p> : null}
          {selected.evidencePoints.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-ink/75">
              {selected.evidencePoints.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {similarity.unpairedTargets.length > 0 ? (
        <section>
          <h3 className="font-display text-xl text-ink">Unpaired targets</h3>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {similarity.unpairedTargets.map((campaignId) => (
              <li key={campaignId} className="rounded-full bg-card px-3 py-1 ring-1 ring-line">
                {campaignId}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
