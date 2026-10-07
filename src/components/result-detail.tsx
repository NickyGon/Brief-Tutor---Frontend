"use client";

import { useState } from "react";
import { CampaignCarousel, CampaignDialog } from "@/components/campaign-carousel";
import { SimilarityBoard } from "@/components/similarity-board";
import type { ArtifactDetail, CampaignView, RunProgress, WorkflowRoute } from "@/lib/types";

function statusClass(status: string) {
  if (status === "critical") return "bg-rose-50 text-rose-900 ring-rose-200";
  if (status === "passed") return "bg-emerald-50 text-emerald-950 ring-emerald-200";
  return "bg-amber-50 text-amber-950 ring-amber-200";
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glow-edge rounded-2xl bg-card px-3 py-2 ring-1 ring-line">
      <dt className="text-xs text-ink/50">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function ResultDetail({
  detail,
  loading,
  error,
  running,
  runStatus,
  runProgress,
  runError,
  runRoute,
  locked,
  onRun,
  panel,
  onPanel,
  diagnosis,
  similarity,
  analysisLoading,
  campaigns,
  dealershipName,
  taskType,
  accountId,
  retrieveMessage,
  retrieving,
  onRetrieve,
  prompt,
  onContinue,
}: {
  detail: ArtifactDetail | null;
  loading: boolean;
  error: string | null;
  running: boolean;
  runStatus: string | null;
  runProgress: RunProgress | null;
  runError: string | null;
  runRoute: WorkflowRoute | null;
  locked: boolean;
  onRun: ((route: WorkflowRoute) => void) | null;
  panel: WorkflowRoute;
  onPanel: (panel: WorkflowRoute) => void;
  diagnosis: ArtifactDetail | null;
  similarity: ArtifactDetail | null;
  analysisLoading: boolean;
  campaigns: CampaignView[];
  dealershipName: string | null;
  taskType: string | null;
  accountId: string | null;
  retrieveMessage: string | null;
  retrieving: boolean;
  onRetrieve: () => void;
  prompt: { question: string; candidateName: string; nextScope: string } | null;
  onContinue: (accept: boolean) => void;
}) {
  const [openCampaign, setOpenCampaign] = useState<CampaignView | null>(null);

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-line" />
        <div className="h-28 animate-pulse rounded-2xl bg-line/80" />
        <div className="h-40 animate-pulse rounded-2xl bg-line/80" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>;
  }

  if (!detail) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-16 text-center">
        <h2 className="font-display text-2xl text-ink">Choose a campaign brief</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/70">
          Briefs from the Campaigns folders open here, with their diagnoses and similarity results.
        </p>
      </div>
    );
  }

  const campaignsReady = campaigns.length > 0;
  const activeAnalysis = panel === "diagnosis" ? diagnosis : similarity;
  const runLabel = panel === "similarity" ? "Search for similar briefs" : "Evaluate Campaign Brief";
  const progressTitle =
    runStatus === "completed"
      ? "Run finished"
      : runStatus === "failed"
        ? "Run failed"
        : runRoute === "similarity"
          ? "Searching similar briefs"
          : "Evaluating brief";

  return (
    <article className="space-y-6">
      {running || runError || runStatus ? (
        <section className="glow-edge rounded-2xl border border-line bg-card p-4" aria-live="polite">
          <h3 className="font-medium text-ink">{progressTitle}</h3>
          <p className="mt-1 text-sm text-ink/70">{runProgress?.label ?? "Starting the workflow"}</p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={runProgress?.percent ?? 4}
            aria-valuetext={runProgress?.label ?? "Starting the workflow"}
          >
            <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${runProgress?.percent ?? 4}%` }} />
          </div>
          {runError ? <p className="mt-3 text-sm text-rose-300">{runError}</p> : null}
        </section>
      ) : null}

      {prompt ? (
        <section className="glow-edge rounded-2xl border border-line bg-card p-4">
          <h3 className="font-medium text-ink">Search for more similar briefs?</h3>
          <p className="mt-1 text-sm text-ink/70">{prompt.question}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => onContinue(true)} className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white">
              Yes, keep searching
            </button>
            <button type="button" onClick={() => onContinue(false)} className="rounded-full bg-card px-4 py-2 text-sm text-ink ring-1 ring-line">
              No, stop here
            </button>
          </div>
        </section>
      ) : null}

      <div className={`space-y-6 ${locked ? "opacity-60" : ""}`} inert={locked}>
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-teal">Brief</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="font-display text-3xl leading-tight text-ink">{detail.title}</h2>
            <button
              type="button"
              onClick={onRetrieve}
              disabled={locked || retrieving || !detail.spreadsheetPath}
              className="shrink-0 rounded-full bg-teal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-teal/50"
            >
              {retrieving ? "Retrieving info…" : "Retrieve info"}
            </button>
          </div>
          {retrieveMessage ? <p className="text-sm text-ink/80">{retrieveMessage}</p> : null}
          <p className="text-sm text-ink/70">{detail.headline}</p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Dealership" value={dealershipName ?? "Not recorded"} />
            <InfoCard label="Task" value={taskType ?? "Not recorded"} />
            <InfoCard label="Brief" value={detail.campaignToken ?? detail.briefId ?? "Local file"} />
            <InfoCard label="Account" value={accountId ?? "Not recorded"} />
          </dl>
        </header>

        <CampaignCarousel
          campaigns={campaigns}
          status={retrieving ? "Retrieving campaigns…" : analysisLoading && campaigns.length === 0 ? "Reading saved campaigns…" : retrieveMessage}
          onOpen={setOpenCampaign}
        />

        <div className="space-y-4">
          <div className="flex border-b border-line" role="tablist" aria-label="Saved analyses">
            {(["diagnosis", "similarity"] as const).map((item) => {
              const selected = panel === item;
              const label = item === "diagnosis" ? "Diagnoses" : "Similarity";
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={campaignsReady && selected}
                  aria-disabled={!campaignsReady}
                  disabled={!campaignsReady}
                  onClick={() => onPanel(item)}
                  className={`-mb-px border-b-2 px-4 py-3 text-sm ${
                    !campaignsReady
                      ? "cursor-not-allowed border-transparent text-ink/35"
                      : selected
                        ? "border-teal text-ink"
                        : "border-transparent text-ink/60 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {!campaignsReady ? (
            <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-6 text-sm leading-6 text-ink/75">
              Retrieve this brief’s campaigns before opening Diagnoses or Similarity. That step gives the workflows the campaign info they need.
            </p>
          ) : null}

          {campaignsReady && onRun && detail.spreadsheetPath ? (
            <button
              type="button"
              onClick={() => onRun(panel)}
              disabled={locked}
              className="rounded-full bg-card px-4 py-2 text-sm font-medium text-teal ring-1 ring-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runLabel}
            </button>
          ) : null}

          {campaignsReady && analysisLoading ? <p className="text-sm text-ink/70">Loading saved analyses…</p> : null}

          {campaignsReady && panel === "diagnosis" && activeAnalysis?.eval ? (
            <p className="glow-edge rounded-2xl bg-card px-4 py-3 text-sm text-ink/80 ring-1 ring-line">
              Groundedness {activeAnalysis.eval.groundednessScore ?? "n/a"} · Field completeness{" "}
              {activeAnalysis.eval.fieldCompletenessScore ?? "n/a"} · Gate {activeAnalysis.eval.passed ? "passed" : "needs review"}
            </p>
          ) : null}

          {campaignsReady && panel === "diagnosis" && diagnosis && diagnosis.diagnoses.length > 0 ? (
            <section className="space-y-3">
              <h3 className="font-display text-xl text-ink">Campaign diagnoses</h3>
              <ul className="space-y-3">
                {diagnosis.diagnoses.map((item) => (
                  <li key={item.campaignId} className="glow-edge rounded-2xl border border-line bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-medium">{item.campaignId}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ring-1 ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/85">{item.diagnosis}</p>
                    {item.issues.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-wide text-ink/50">Issues</p>
                        <ul className="mt-1 space-y-1 text-sm">
                          {item.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {item.recommendations.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-wide text-ink/50">Recommendations</p>
                        <ul className="mt-1 space-y-1 text-sm">
                          {item.recommendations.map((recommendation) => (
                            <li key={recommendation}>{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {item.groundingEvidence.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-wide text-ink/50">Grounding</p>
                        <ul className="mt-1 space-y-1 text-sm text-ink/75">
                          {item.groundingEvidence.map((evidence) => (
                            <li key={evidence}>{evidence}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {campaignsReady && panel === "diagnosis" && !analysisLoading && (!diagnosis || diagnosis.diagnoses.length === 0) ? (
            <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-ink/70">
              No diagnoses saved for this brief yet.
            </p>
          ) : null}

          {campaignsReady && panel === "similarity" && similarity?.similarity ? <SimilarityBoard key={similarity.id} similarity={similarity.similarity} /> : null}
          {campaignsReady && panel === "similarity" && !analysisLoading && !similarity?.similarity ? (
            <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-ink/70">
              No similarity result saved for this brief yet.
            </p>
          ) : null}
        </div>
      </div>

      <CampaignDialog campaign={openCampaign} onClose={() => setOpenCampaign(null)} />
    </article>
  );
}
