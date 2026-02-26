export interface ExploreResult {
  title: string;
  overview: string;
  dayToDay: string;
  gettingStarted: string[];
  salaryRange: string;
  timeframe: string;
  pros: string[];
  cons: string[];
}

export interface ExploreSearch {
  id: string;
  query: string;
  result: ExploreResult;
  createdAt: string;
}
