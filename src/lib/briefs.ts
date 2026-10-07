import type { SearchHit } from "@/lib/types";

export function isCampaignBrief(hit: SearchHit) {
  return hit.kind === "brief" && hit.id.replaceAll("\\", "/").startsWith("Campaigns/");
}

export function briefStem(title: string) {
  return title.replace(/\.(xlsx|xlsm)$/i, "");
}

export function matchesBriefStem(hit: SearchHit, stem: string) {
  const needle = stem.toLowerCase();
  return `${hit.id} ${hit.title}`.toLowerCase().includes(needle);
}
