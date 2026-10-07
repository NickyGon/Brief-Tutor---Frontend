"use client";

import { useEffect, useRef, useState } from "react";
import { ResultDetail } from "@/components/result-detail";
import { ResultList } from "@/components/result-list";
import { isCampaignBrief } from "@/lib/briefs";
import { workflowToText } from "@/lib/text";
import type {
  ArtifactDetail,
  BriefHistory,
  CampaignBriefView,
  CampaignView,
  RetrieveBriefResponse,
  RunSnapshot,
  SearchHit,
  SearchResponse,
  WorkflowRoute,
} from "@/lib/types";

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function loadArtifact(id: string, signal: AbortSignal) {
  const response = await fetch(`/api/artifacts?id=${encodeURIComponent(id)}`, { signal });
  const data = await readJson<ArtifactDetail & { error?: string }>(response);
  if (!response.ok) throw new Error(data.error ?? "Could not load this result");
  if (data.id !== id) return null;
  return data;
}

export function Workbench() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [visibleQuery, setVisibleQuery] = useState("");
  const [tookMs, setTookMs] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<ArtifactDetail | null>(null);
  const [artifactLoading, setArtifactLoading] = useState(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [runSourceId, setRunSourceId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [panel, setPanel] = useState<WorkflowRoute>("diagnosis");
  const [diagnosis, setDiagnosis] = useState<ArtifactDetail | null>(null);
  const [similarity, setSimilarity] = useState<ArtifactDetail | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignView[]>([]);
  const [retrieved, setRetrieved] = useState<CampaignBriefView | null>(null);
  const [retrieveMessage, setRetrieveMessage] = useState<string | null>(null);
  const [retrieving, setRetrieving] = useState(false);
  const searchSeq = useRef(0);
  const artifactSeq = useRef(0);
  const detailRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const seq = ++searchSeq.current;
    const handle = window.setTimeout(() => {
      const requestedQuery = query;
      setSearching(true);
      setSearchError(null);
      const params = new URLSearchParams({ q: requestedQuery, kind: "brief" });
      fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await readJson<SearchResponse & { error?: string }>(response);
          if (seq !== searchSeq.current) return;
          if (!response.ok) throw new Error(data.error ?? "Search failed");
          if (data.query !== requestedQuery || data.kind !== "brief") return;
          const briefs = data.results.filter(isCampaignBrief);
          setHits(briefs);
          setVisibleQuery(requestedQuery);
          setTookMs(data.tookMs);
          setSearching(false);
          setSelectedId((current) => (current && briefs.some((hit) => hit.id === current) ? current : null));
          setArtifact((current) => (current && briefs.some((hit) => hit.id === current.id) ? current : null));
          setArtifactLoading(false);
          setArtifactError(null);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (seq !== searchSeq.current) return;
          setHits([]);
          setSearchError(error instanceof Error ? error.message : "Search failed");
          setSearching(false);
        });
    }, query.trim() ? 280 : 0);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    const seq = ++artifactSeq.current;
    const requestedId = selectedId;
    loadArtifact(requestedId, controller.signal)
      .then((data) => {
        if (seq !== artifactSeq.current || !data) return;
        setArtifact(data);
        setArtifactLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (seq !== artifactSeq.current) return;
        setArtifact(null);
        setArtifactError(error instanceof Error ? error.message : "Could not load this result");
        setArtifactLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  useEffect(() => {
    if (!artifact) {
      setDiagnosis(null);
      setSimilarity(null);
      setAnalysisLoading(false);
      return;
    }
    const controller = new AbortController();
    const spreadsheetPath = artifact.spreadsheetPath;
    if (!spreadsheetPath) {
      setAnalysisLoading(false);
      return;
    }
    setAnalysisLoading(true);
    setDiagnosis(null);
    setSimilarity(null);
    const params = new URLSearchParams({ spreadsheetPath });
    fetch(`/api/briefs/history?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await readJson<BriefHistory & { error?: string }>(response);
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(data.error ?? data.message ?? "Could not load brief history");
        if (data.supabaseError) {
          setRetrieveMessage(data.supabaseError);
        } else if (data.campaigns.length > 0) {
          setCampaigns(data.campaigns);
          setRetrieveMessage(`${data.campaigns.length} campaign${data.campaigns.length === 1 ? "" : "s"} loaded.`);
        } else if (data.message) {
          setRetrieveMessage(data.message);
        }
        if (data.dealershipName || data.taskType || data.accountId) {
          setRetrieved({
            spreadsheetPath,
            taskType: data.taskType,
            assetSummary: null,
            dealershipName: data.dealershipName,
            accountId: data.accountId,
            content11To20: false,
            campaigns: data.campaigns,
          });
        }
        setDiagnosis(
          data.diagnoses.length > 0
            ? { ...artifact, kind: "diagnosis", diagnoses: data.diagnoses, similarity: null }
            : null,
        );
        setSimilarity(
          data.similarity
            ? { ...artifact, kind: "similarity", diagnoses: [], similarity: data.similarity }
            : null,
        );
        setAnalysisLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (controller.signal.aborted) return;
        setRetrieveMessage(error instanceof Error ? error.message : "Could not load saved campaigns");
        setAnalysisLoading(false);
      });
    return () => controller.abort();
  }, [artifact]);

  const runId = run?.id;
  const runStatus = run?.status;

  useEffect(() => {
    if (!runId || runStatus === "completed" || runStatus === "failed") return;
    const timer = window.setInterval(() => {
      fetch(`/api/runs/${encodeURIComponent(runId)}`)
        .then(async (response) => {
          const data = await readJson<RunSnapshot & { error?: string }>(response);
          if (!response.ok) throw new Error(data.error ?? "Could not read the workflow run");
          setRun((current) => (current?.id === runId ? data : current));
        })
        .catch((error: unknown) => {
          setRunError(error instanceof Error ? error.message : "Could not read the workflow run");
        });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [runId, runStatus]);

  useEffect(() => {
    if (run?.status !== "completed" || !run.result || runSourceId !== selectedId || !run.route) return;
    if (run.route === "diagnosis") setDiagnosis(run.result);
    if (run.route === "similarity") setSimilarity(run.result);
    setPanel(run.route);
  }, [run, runSourceId, selectedId]);

  useEffect(() => {
    const check = () => {
      fetch("/api/health")
        .then((response) => setApiOk(response.ok))
        .catch(() => setApiOk(false));
    };
    check();
    const timer = window.setInterval(check, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const runBelongsHere = runSourceId !== null && runSourceId === selectedId;
  const busy = run?.status === "queued" || run?.status === "running" || run?.status === "awaiting_input";
  const running = runBelongsHere && busy;

  function selectHit(id: string) {
    if (busy) return;
    setSelectedId(id);
    setArtifact(null);
    setArtifactError(null);
    setArtifactLoading(true);
    setCampaigns([]);
    setRetrieved(null);
    setRetrieveMessage(null);
    setDiagnosis(null);
    setSimilarity(null);
    setPanel("diagnosis");
    if (window.innerWidth < 1024) {
      window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  function updateQuery(value: string) {
    if (busy) return;
    setQuery(value);
    setHits([]);
    setSearching(true);
  }

  async function startRun(route: WorkflowRoute) {
    if (busy || campaigns.length === 0 || !artifact?.spreadsheetPath || !selectedId) return;
    setPanel(route);
    setRunError(null);
    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetPath: artifact.spreadsheetPath, route }),
    });
    const data = await readJson<RunSnapshot & { error?: string; activeRunId?: string }>(response);
    if (!response.ok) {
      setRunError(data.error ?? "Could not start the workflow");
      return;
    }
    setRunSourceId(selectedId);
    setRun(data);
  }

  async function continueSearch(accept: boolean) {
    if (!run?.id) return;
    const response = await fetch(`/api/runs/${encodeURIComponent(run.id)}/continue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    });
    const data = await readJson<RunSnapshot & { error?: string }>(response);
    if (!response.ok) {
      setRunError(data.error ?? "Could not continue the search");
      return;
    }
    setRun(data);
  }

  async function retrieveInfo() {
    if (busy || retrieving || !artifact?.spreadsheetPath) return;
    setRetrieving(true);
    setRetrieveMessage(null);
    try {
      const response = await fetch("/api/briefs/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetPath: artifact.spreadsheetPath }),
      });
      const data = await readJson<RetrieveBriefResponse & { error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Could not retrieve this brief");
      if (!data.available || !data.brief) {
        setCampaigns([]);
        setRetrieved(null);
        setRetrieveMessage(data.message ?? "Campaign details are not available yet.");
        return;
      }
      setRetrieved(data.brief);
      setCampaigns(data.brief.campaigns);
      setRetrieveMessage(
        data.brief.campaigns.length > 0
          ? `${data.brief.campaigns.length} campaign${data.brief.campaigns.length === 1 ? "" : "s"} loaded.`
          : "This brief has no campaigns stored yet.",
      );
    } catch (error: unknown) {
      setRetrieveMessage(error instanceof Error ? error.message : "Could not retrieve this brief");
    } finally {
      setRetrieving(false);
    }
  }

  function download() {
    const source = panel === "diagnosis" && diagnosis ? diagnosis : panel === "similarity" && similarity ? similarity : artifact;
    if (busy || !source) return;
    const blob = new Blob([workflowToText(source)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${source.title.replace(/[^\w.-]+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusLine = searching
    ? "Searching campaign briefs…"
    : searchError
      ? searchError
      : visibleQuery.trim()
        ? `${hits.length} briefs for “${visibleQuery}”${tookMs !== null ? ` · ${tookMs} ms` : ""}`
        : `${hits.length} campaign briefs${tookMs !== null ? ` · ${tookMs} ms` : ""}`;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-2xl text-ink">Brief Tutor</p>
            <p className="text-sm text-ink/60">Campaign brief grooming</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {run && (run.status === "queued" || run.status === "running") ? (
              <p className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-950">
                {run.progress?.label ?? (run.route === "similarity" ? "Searching similar briefs" : "Evaluating brief")}
              </p>
            ) : null}
            <p className={`rounded-full px-3 py-1 text-sm ${apiOk ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
              {apiOk === null ? "Checking API…" : apiOk ? "API connected" : "API offline"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]" aria-busy={busy}>
        <section className={`space-y-4 ${busy ? "opacity-60" : ""}`} inert={busy}>
          <form onSubmit={(event) => event.preventDefault()} className="space-y-3">
            <label htmlFor="brief-search" className="text-sm font-medium text-ink">
              Search campaign briefs
            </label>
            <input
              id="brief-search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Dealership, brief ID…"
              className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-base outline-none ring-teal/30 placeholder:text-ink/40 focus:ring-2"
            />
          </form>
          <p aria-live="polite" className="text-sm text-ink/70">
            {statusLine}
          </p>
          <ResultList hits={hits} selectedId={selectedId} searching={searching} onSelect={selectHit} />
        </section>

        <section ref={detailRef} className="min-w-0 space-y-4">
          {artifact && !artifactLoading ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={download}
                disabled={busy}
                className="rounded-full px-3 py-1 text-sm text-teal ring-1 ring-teal/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download text
              </button>
            </div>
          ) : null}
          <ResultDetail
            detail={artifact}
            loading={artifactLoading}
            error={artifactError}
            running={running}
            runStatus={runBelongsHere ? (run?.status ?? null) : null}
            runProgress={runBelongsHere ? (run?.progress ?? null) : null}
            runError={runBelongsHere ? (run?.error ?? runError) : runError}
            runRoute={runBelongsHere ? (run?.route ?? null) : null}
            locked={busy}
            onRun={artifact?.spreadsheetPath ? startRun : null}
            panel={panel}
            onPanel={setPanel}
            diagnosis={diagnosis}
            similarity={similarity}
            analysisLoading={analysisLoading}
            campaigns={campaigns}
            dealershipName={retrieved?.dealershipName ?? artifact?.dealershipName ?? null}
            taskType={retrieved?.taskType ?? artifact?.taskType ?? null}
            accountId={retrieved?.accountId ?? artifact?.accountId ?? null}
            retrieveMessage={retrieveMessage}
            retrieving={retrieving}
            onRetrieve={retrieveInfo}
            prompt={runBelongsHere ? (run?.prompt ?? null) : null}
            onContinue={continueSearch}
          />
        </section>
      </main>
    </div>
  );
}
