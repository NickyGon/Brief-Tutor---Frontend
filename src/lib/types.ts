export type ResultKind = "diagnosis" | "similarity" | "brief";

export type StatusBreakdown = {
  critical: number;
  observed: number;
  passed: number;
};

export type SearchHit = {
  id: string;
  kind: ResultKind;
  title: string;
  dealershipName: string | null;
  taskType: string | null;
  briefId: string | null;
  updatedAt: string;
  headline: string;
  statusBreakdown: StatusBreakdown | null;
  pairCounts: {
    absolute: number;
    likely: number;
    review: number;
    unpaired: number;
  } | null;
};

export type SearchResponse = {
  query: string;
  kind: string;
  tookMs: number;
  resultCount: number;
  results: SearchHit[];
};

export type Diagnosis = {
  campaignId: string;
  status: string;
  diagnosis: string;
  issues: string[];
  recommendations: string[];
  groundingEvidence: string[];
};

export type SimilarityPair = {
  targetCampaignId: string;
  candidateCampaignId: string;
  fileName: string;
  similarityScore: number;
  pairStatus: string;
  pairBasis: string;
  scoringPath: string;
  matchReason: string;
  evidencePoints: string[];
  styleDirectionSimilarity: number;
  campaignWordingSimilarity: number;
  dealershipRelationship: number;
};

export type SimilarityView = {
  targetFileName: string;
  warnings: string[];
  absolutePairs: SimilarityPair[];
  likelyPairs: SimilarityPair[];
  reviewPairs: SimilarityPair[];
  unpairedTargets: string[];
  briefSimilarityScore: number | null;
  matchKind: "aligned" | "complementation" | "none" | null;
  candidateFiles: {
    fileName: string;
    dealershipName: string | null;
    taskType: string | null;
    fileSimilarityScore: number;
    briefSimilarityScore?: number | null;
    matchKind?: string | null;
    coverage?: number | null;
  }[];
};

export type CampaignAssets = {
  desktop: string;
  mobile: string;
  facebook: string;
  instagram: string;
  google: string;
  ot1: string;
  ot2: string;
  ot3: string;
  ot4: string;
  ot5: string;
  ot6: string;
};

export type CampaignOffer = {
  headline: string;
  offer: string;
  body: string;
  cta: string;
  disclaimer: string;
};

export type CampaignStyle = {
  direction: string;
  additional: string;
  vehiclePhotography: string;
  logos: string;
};

export type CampaignView = {
  campaignId: string;
  offer: CampaignOffer;
  assets: CampaignAssets;
  style: CampaignStyle;
};

export type CampaignBriefView = {
  spreadsheetPath: string;
  taskType: string | null;
  assetSummary: string | null;
  dealershipName: string | null;
  accountId: string | null;
  content11To20: boolean;
  campaigns: CampaignView[];
};

export type BriefHistory = {
  available: boolean;
  supabaseError: string | null;
  message?: string;
  dealershipName: string | null;
  taskType: string | null;
  accountId: string | null;
  campaigns: CampaignView[];
  diagnoses: Diagnosis[];
  similarity: SimilarityView | null;
};

export type RetrieveBriefResponse = {
  available: boolean;
  message?: string;
  brief?: CampaignBriefView;
};

export type ArtifactDetail = {
  id: string;
  kind: ResultKind;
  title: string;
  dealershipName: string | null;
  taskType: string | null;
  briefId: string | null;
  accountId: string | null;
  campaignToken: string | null;
  updatedAt: string;
  headline: string;
  spreadsheetPath: string | null;
  totalCampaigns: number | null;
  diagnoses: Diagnosis[];
  statusBreakdown: StatusBreakdown | null;
  eval: {
    groundednessScore: number | null;
    fieldCompletenessScore: number | null;
    passed: boolean | null;
  } | null;
  similarity: SimilarityView | null;
};

export type RunEvent = {
  at: string;
  message: string;
};

export type RunProgress = {
  id: string;
  label: string;
  index: number;
  total: number;
  percent: number;
};

export type WorkflowRoute = "diagnosis" | "similarity";

export type RunSnapshot = {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "awaiting_input";
  spreadsheetPath: string;
  route: WorkflowRoute | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  progress: RunProgress | null;
  events: RunEvent[];
  result: ArtifactDetail | null;
  prompt: {
    question: string;
    candidateName: string;
    nextScope: string;
  } | null;
};
