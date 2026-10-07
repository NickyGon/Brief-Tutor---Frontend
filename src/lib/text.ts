import type { ArtifactDetail, SimilarityPair } from "@/lib/types";

function percent(score: number) {
  return `${Math.round(score * 1000) / 10}%`;
}

function pairLines(title: string, pairs: SimilarityPair[]) {
  const lines = [title];
  if (pairs.length === 0) {
    lines.push("None");
    return lines;
  }
  pairs.forEach((pair, index) => {
    lines.push(
      `${index + 1}. [${pair.pairStatus || "n/a"}] ${percent(pair.similarityScore)} | Target ${pair.targetCampaignId} <-> Candidate ${pair.candidateCampaignId} | File: ${pair.fileName || "n/a"} | basis=${pair.pairBasis || pair.scoringPath || "n/a"}`,
    );
    if (pair.matchReason) lines.push(`   Reason: ${pair.matchReason}`);
    pair.evidencePoints.forEach((point) => lines.push(`   - Evidence: ${point}`));
  });
  return lines;
}

export function workflowToText(detail: ArtifactDetail) {
  const lines = [
    `File: ${detail.title}`,
    `Dealership: ${detail.dealershipName ?? "n/a"}`,
    `Task type: ${detail.taskType ?? "n/a"}`,
    `Campaigns: ${detail.totalCampaigns ?? "n/a"}`,
    "",
  ];

  if (detail.diagnoses.length > 0) {
    lines.push("Diagnoses:");
    detail.diagnoses.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.campaignId} [${item.status}]`);
      lines.push(item.diagnosis);
      item.issues.forEach((issue) => lines.push(`   Issue: ${issue}`));
      item.recommendations.forEach((itemText) => lines.push(`   Recommendation: ${itemText}`));
      item.groundingEvidence.forEach((evidence) => lines.push(`   Evidence: ${evidence}`));
      lines.push("");
    });
  }

  if (detail.similarity) {
    lines.push(...pairLines("Absolute campaign pairs:", detail.similarity.absolutePairs));
    lines.push("");
    lines.push(...pairLines("Likely campaign pairs:", detail.similarity.likelyPairs));
    lines.push("");
    lines.push(...pairLines("Campaign pairs for human review:", detail.similarity.reviewPairs));
    lines.push("");
    lines.push("Unpaired target campaigns:");
    if (detail.similarity.unpairedTargets.length === 0) lines.push("None");
    detail.similarity.unpairedTargets.forEach((campaignId, index) => {
      lines.push(`${index + 1}. ${campaignId}`);
    });
  }

  return lines.join("\n");
}
