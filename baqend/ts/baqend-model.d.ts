import {binding, ContentSize} from 'baqend'

declare module 'baqend' {

  interface baqend {
    BulkComparison: binding.EntityFactory<model.BulkComparison>;
    BulkTest: binding.EntityFactory<model.BulkTest>;
    Testseries: binding.EntityFactory<model.Testseries>;
    PipedriveTest: binding.EntityFactory<model.PipedriveTest>;
    TestResult: binding.EntityFactory<model.TestResult>;
    Prewarms: binding.EntityFactory<model.Prewarms>;
    CachedConfig: binding.EntityFactory<model.CachedConfig>;
    TestOverview: binding.EntityFactory<model.TestOverview>;
    Hits: binding.ManagedFactory<model.Hits>;
    ContentSize: binding.ManagedFactory<model.ContentSize>;
    TestEntry: binding.ManagedFactory<model.TestEntry>;
    Task: binding.ManagedFactory<model.Task>;
    WebPagetest: binding.ManagedFactory<model.WebPagetest>;
    Run: binding.ManagedFactory<model.Run>;
    ConfigAnalysis: binding.ManagedFactory<model.ConfigAnalysis>;
    Completeness: binding.ManagedFactory<model.Completeness>;
    Mean: binding.ManagedFactory<model.Mean>;
    UrlAnalysis: binding.ManagedFactory<model.UrlAnalysis>;
    Tasks: binding.ManagedFactory<model.Tasks>;
    Means: binding.ManagedFactory<model.Means>;
  }

  namespace model {
    interface UrlAware {
      url: string
    }

    interface ComparisonInfo extends UrlAware {
      runs: number
    }

    interface Domain extends UrlAware {
      bytes: number
      requests: number
      cdn_provider: string
      connections: number
      isAdDomain: boolean
    }

    interface BulkComparison extends binding.Entity {
      comparisonsToStart: Array<ComparisonInfo>;
      createdBy: string;
      multiComparisons: Array<BulkTest>;
      hasFinished: boolean;
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
      params: {};
    }

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
      firstView: Run | null;
      repeatView: Run | null;
      url: string;
      summaryUrl: string;
      publishedSummaryUrl: string;
      videoIdFirstView: string;
      videoIdRepeatedView: string;
      videoFileFirstView: binding.File | null;
      testDataMissing: boolean;
      videoFileRepeatView: binding.File | null;
      hasFinished: boolean;
      retryRequired: boolean;
      isWordPress: boolean;
      isClone: boolean;
      priority: number;
      speedKitConfig: string;
      testInfo: any;
      webPagetests: Array<WebPagetest>;
      retries: number;
      checked: Date;
    }

    interface Prewarms extends binding.Entity {
      testId: string;
    }

    interface CachedConfig extends binding.Entity {
      url: string;
      mobile: boolean;
      config: string;
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
      factors: Mean | null;
      isSpeedKitComparison: boolean;
      isSecured: boolean;
      speedKitVersion: string;
      activityTimeout: number;
      speedKitConfig: string | null;
      tasks: Array<Task>;
      configAnalysis: ConfigAnalysis | null;
    }

    interface Hits extends binding.Managed {
      hit: number;
      miss: number;
      other: number;
      size: number;
      withCaching: number;
    }

    interface ContentSize extends binding.Managed {
      text: number;
      images: number;
    }

    interface TestEntry extends binding.Managed {
      test: BulkTest;
      time: Date;
    }

    interface Task extends binding.Managed {
      taskType: string;
      lastExecution: Date;
    }

    interface WebPagetest extends binding.Managed {
      testId: string;
      testType: string;
      testScript: string;
      testOptions: {};
      hasFinished: boolean;
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
      domains: Domain[];
      bytes: number;
      domElements: number;
      basePageCDN: string;
      visualCompleteness: Completeness;
      hits: Hits;
      contentSize: ContentSize;
    }

    interface ConfigAnalysis extends binding.Managed {
      configMissing: boolean;
      swPath: string;
      swPathMatches: boolean;
      isDisabled: boolean;
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

    interface Tasks extends binding.Managed {
    }

    interface Means extends binding.Managed {
    }

    interface JobStatus {
      cronjob: JobDefinition
      executedAt: Date
      status: string
      error: string
    }

    interface JobDefinition {
      module: string
      cronpattern: string
      startsAt: Date
      expiresAt: Date
      nextExecution: Date
    }

  }
}
