import {binding} from "baqend";

interface Device extends binding.Entity {
  deviceOs: string;
}

interface Testseries extends binding.Entity {
  url: string;
  cronpattern: string;
  end: Date;
  start: Date;
  runs: number;
  location: string;
  whitelist: string;
  speedKitConfig: {};
  mobile: boolean;
  testEntries: Array<TestEntry>;
}

interface BulkTest extends binding.Entity {
  url: string;
  hasFinished: boolean;
  testOverviews: Array<TestOverview>;
  speedKitMeanValues: Mean;
  competitorMeanValues: Mean;
  factors: Mean;
  bestFactors: Mean;
  worstFactors: Mean;
  createdBy: string;
  runs: number;
  completedRuns: number;
  location: string;
  mobile: boolean;
  priority: number;
}

interface TestOverview extends binding.Entity {
  psiDomains: number;
  psiRequests: number;
  psiResponseSize: string;
  location: string;
  caching: boolean;
  mobile: boolean;
  url: string;
  competitorTestResult: TestResult;
  speedKitTestResult: TestResult;
  whitelist: string;
  hasFinished: boolean;
  factors: Mean;
  isSpeedKitComparison: boolean;
  speedKitVersion: string;
  activityTimeout: number;
}

interface User extends binding.Entity {
}

interface Role extends binding.Entity {
  name: string;
  users: Set<User>;
}

interface TestResult extends binding.Entity {
  testId: string;
  location: string;
  firstView: Run;
  repeatView: Run;
  url: string;
  summaryUrl: string;
  videoIdFirstView: string;
  videoIdRepeatedView: string;
  testDataMissing: boolean;
  videoFileFirstView: undefined;
  videoFileRepeatView: undefined;
  hasFinished: boolean;
  retryRequired: boolean;
  isWordPress: boolean;
  priority: number;
}

interface Hits extends binding.Managed {
  hit: number;
  miss: number;
  other: number;
  size: number;
}

interface TestEntry extends binding.Managed {
  test: BulkTest;
  time: Date;
}

interface Completeness extends binding.Managed {
  p85: number;
  p90: number;
  p95: number;
  p99: number;
  p100: number;
}

interface Mean extends binding.Managed {
  speedIndex: number;
  firstMeaningfulPaint: number;
  ttfb: number;
  domLoaded: number;
  fullyLoaded: number;
  lastVisualChange: number;
}

interface Run extends binding.Managed {
  loadTime: number;
  ttfb: number;
  domLoaded: number;
  load: number;
  fullyLoaded: number;
  firstPaint: number;
  startRender: number;
  speedIndex: number;
  firstMeaningfulPaint: number;
  lastVisualChange: number;
  requests: number;
  failedRequests: number;
  domains: object[];
  bytes: number;
  domElements: number;
  basePageCDN: string;
  visualCompleteness: Completeness;
  hits: Hits;
}
