"use client";

import { useEffect, useRef } from "react";
import type { CampaignAssets, CampaignView } from "@/lib/types";

const assetLabels: { key: keyof CampaignAssets; label: string }[] = [
  { key: "desktop", label: "Desktop" },
  { key: "mobile", label: "Mobile" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "google", label: "Google" },
  { key: "ot1", label: "OT1" },
  { key: "ot2", label: "OT2" },
  { key: "ot3", label: "OT3" },
  { key: "ot4", label: "OT4" },
  { key: "ot5", label: "OT5" },
  { key: "ot6", label: "OT6" },
];

function filledAssets(assets: CampaignAssets) {
  return assetLabels.filter((item) => assets[item.key].trim()).map((item) => item.label);
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-ink">{value}</dd>
    </div>
  );
}

export function CampaignCarousel({
  campaigns,
  status,
  onOpen,
}: {
  campaigns: CampaignView[];
  status: string | null;
  onOpen: (campaign: CampaignView) => void;
}) {
  if (campaigns.length === 0) {
    return (
      <section className="space-y-3">
        <h3 className="font-display text-xl text-ink">Campaigns</h3>
        <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-ink/70">
          {status ?? "Use Retrieve info to load this brief’s campaigns."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl text-ink">Campaigns</h3>
        <p className="text-sm text-ink/70">{status ?? `${campaigns.length} loaded`}</p>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {campaigns.map((campaign) => {
          const assets = filledAssets(campaign.assets);
          return (
            <button
              key={campaign.campaignId}
              type="button"
              onClick={() => onOpen(campaign)}
              className="glow-edge w-64 shrink-0 snap-start rounded-2xl border border-line bg-card p-4 text-left"
            >
              <p className="text-xs uppercase tracking-wide text-teal">{campaign.campaignId}</p>
              <p className="mt-2 font-medium text-ink">{campaign.offer.headline || "No headline"}</p>
              <p className="mt-2 line-clamp-3 text-sm text-ink/70">{campaign.offer.offer || "No offer"}</p>
              <p className="mt-3 text-xs text-ink/50">{assets.length > 0 ? assets.join(" · ") : "No assets recorded"}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CampaignDialog({
  campaign,
  onClose,
}: {
  campaign: CampaignView | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!campaign) return;
    const node = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node?.querySelector<HTMLElement>("button")?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [campaign]);

  if (!campaign) return null;
  const assets = filledAssets(campaign.assets);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-dialog-title"
        className="glow-edge max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-card p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-teal">Campaign</p>
            <h3 id="campaign-dialog-title" className="mt-1 font-display text-2xl text-ink">
              {campaign.campaignId}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-ink ring-1 ring-line">
            Close
          </button>
        </div>
        <dl className="mt-5 space-y-4">
          <Field label="Headline" value={campaign.offer.headline} />
          <Field label="Offer" value={campaign.offer.offer} />
          <Field label="Body" value={campaign.offer.body} />
          <Field label="Call to action" value={campaign.offer.cta} />
          <Field label="Disclaimer" value={campaign.offer.disclaimer} />
          <Field label="Style direction" value={campaign.style.direction} />
          <Field label="Additional style" value={campaign.style.additional} />
          <Field label="Vehicle photography" value={campaign.style.vehiclePhotography} />
          <Field label="Logos" value={campaign.style.logos} />
        </dl>
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-ink/50">Assets</p>
          {assets.length === 0 ? (
            <p className="mt-1 text-sm text-ink/70">No assets recorded.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-ink">
              {assetLabels.map((item) =>
                campaign.assets[item.key].trim() ? (
                  <li key={item.key}>
                    <span className="text-ink/50">{item.label}. </span>
                    {campaign.assets[item.key]}
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
