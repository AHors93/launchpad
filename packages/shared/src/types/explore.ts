export interface SavedPath {
  pathId: string;
  userId: string;
  title: string;
  query: string;
  summary: string;
  savedAt: string;
  lastChecked?: string;
  latestInfo?: string;
}

export interface SearchResult {
  title: string;
  summary: string;
  salaryRange?: { min: number; max: number; currency: string };
  timeToQualify?: string;
  qualifications?: string[];
  nextSteps?: string[];
  pros?: string[];
  cons?: string[];
  sources?: string[];
}

export interface PathSuggestion {
  title: string;
  reason: string;
  relatedTo: string;
}
