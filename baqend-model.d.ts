import {binding, GeoPoint} from "baqend";

declare module "baqend" {

  interface baqend {
    Testseries: binding.EntityFactory<model.Testseries>;
    PipedriveTest: binding.EntityFactory<model.PipedriveTest>;
    TestResult: binding.EntityFactory<model.TestResult>;
    Prewarms: binding.EntityFactory<model.Prewarms>;
    TestOverview: binding.EntityFactory<model.TestOverview>;
    BulkTest: binding.EntityFactory<model.BulkTest>;
    Hits: binding.ManagedFactory<model.Hits>;
    TestEntry: binding.ManagedFactory<model.TestEntry>;
    Run: binding.ManagedFactory<model.Run>;
    Completeness: binding.ManagedFactory<model.Completeness>;
    Mean: binding.ManagedFactory<model.Mean>;
    UrlAnalysis: binding.ManagedFactory<model.UrlAnalysis>;
    Means: binding.ManagedFactory<model.Means>;
  }

  namespace model {
    interface Role extends binding.Entity {
      name: string;
      users: Set<User>;
    }

    interface User extends binding.Entity {
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

    interface PipedriveTest extends binding.Entity {
      offset: number;
      limit: number;
      candidates: Array<{}>;
    }

    interface TestResult extends binding.Entity {
      testId: string;
      location: string;
      firstView: Run;
      repeatView: Run;
      url: string;
      summaryUrl: string;
      publishedSummaryUrl: string;
      videoIdFirstView: string;
      videoIdRepeatedView: string;
      testDataMissing: boolean;
      videoFileFirstView: undefined;
      videoFileRepeatView: undefined;
      hasFinished: boolean;
      retryRequired: boolean;
      isWordPress: boolean;
      priority: number;
      speedKitConfig: string;
    }

    interface Prewarms extends binding.Entity {
      testId: string;
    }

    interface Device extends binding.Entity {
      deviceOs: string;
    }

    interface TestOverview extends binding.Entity {
      psiDomains: number;
      psiRequests: number;
      psiResponseSize: string;
      psiScreenshot: {};
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
      speedKitConfig: string;
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
      urlAnalysis: UrlAnalysis;
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
      domains: [];
      bytes: number;
      domElements: number;
      basePageCDN: string;
      visualCompleteness: Completeness;
      hits: Hits;
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

    interface UrlAnalysis extends binding.Managed {
      url: string;
      displayUrl: string;
      type: string;
      secured: boolean;
      mobile: boolean;
      supported: boolean;
      enabled: boolean;
      speedKitVersion: string;
    }

    interface Means extends binding.Managed {
    }

  }
}