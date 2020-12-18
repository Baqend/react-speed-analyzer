import { binding, model } from 'baqend'

declare module 'baqend' {

  export type StatusString = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'CANCELED' | 'INCOMPLETE' |'FAILED'

  interface baqend {
    BulkComparison: binding.EntityFactory<model.BulkComparison>;
    BulkTest: binding.EntityFactory<model.BulkTest>;
    Testseries: binding.EntityFactory<model.Testseries>;
    PipedriveTest: binding.EntityFactory<model.PipedriveTest>;
    TestResult: binding.EntityFactory<model.TestResult>;
    Prewarms: binding.EntityFactory<model.Prewarms>;
    CachedConfig: binding.EntityFactory<model.CachedConfig>;
    TestOverview: binding.EntityFactory<model.TestOverview>;
    ChromeUXReport: binding.EntityFactory<model.ChromeUXReport>;
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
    Puppeteer: binding.ManagedFactory<model.Puppeteer>;
    PuppeteerType: binding.ManagedFactory<model.PuppeteerType>;
    PuppeteerStats: binding.ManagedFactory<model.PuppeteerStats>;
    PuppeteerSpeedKit: binding.ManagedFactory<model.PuppeteerSpeedKit>;
    PuppeteerServiceWorkers: binding.ManagedFactory<model.PuppeteerServiceWorkers>;
    Candidate: binding.ManagedFactory<model.Candidate>;
    FMPData: binding.ManagedFactory<model.FMPData>;
  }

  namespace model {
    interface UrlAware {
      url: string
    }

    interface ComparisonInfo {
      url: string
      app: string;
      puppeteer?: Puppeteer
      isStarted: boolean
      runs: number
      location: string
      mobile: boolean
      preload: boolean
      multiComparisonId: string | null
      cookie: string
    }

    interface Domain extends UrlAware {
      bytes: number
      requests: number
      cdn_provider: string
      connections: number
      isAdDomain: boolean
    }

    interface BulkComparison extends binding.Entity {
      status: StatusString;
      hasFinished: boolean;
      comparisonsToStart: Array<ComparisonInfo>;
      createdBy: string | null;
      multiComparisons: Array<BulkTest>;
    }

    interface BulkTest extends binding.Entity {
      url: string;
      status: StatusString;
      hasFinished: boolean;
      testOverviews: Array<TestOverview>;
      speedKitMeanValues: Mean;
      competitorMeanValues: Mean;
      factors: Mean;
      bestFactors: Mean;
      worstFactors: Mean;
      createdBy: string | null;
      runs: number;
      completedRuns: number;
      location: string;
      mobile: boolean;
      priority: number;
      urlAnalysis: UrlAnalysis;
      params: any;
      puppeteer: Puppeteer | null;
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

    interface TestOptions {
      block?: string,
      label?: string,
      breakDown?: boolean,
      chromeTrace?: boolean,
      keepua?: boolean,
      cmdline: string, // renamed from commandline
      mobileDevice: string, // renamed from device
      noheaders?: boolean, // renamed from disableHTTPHeaders
      noopt?: boolean, // renamed from disableOptimization
      noimages?: boolean, // renamed from disableScreenshot
      domains?: boolean,
      fvonly: boolean, // renamed from firstViewOnly
      ignoreSSL?: boolean,
      iq?: number, // renamed from firstViewOnly
      location: string
      minimalResults?: boolean,
      time?: number, // renamed from minimumDuration
      mobile: boolean
      netLog?: boolean,
      pageSpeed?: boolean,
      priority: number
      requests?: boolean,
      runs?: number
      bodies?: boolean, // renamed from saveResponseBodies
      tcpDump?: boolean,
      timeline?: boolean,
      timeout: number,
      video?: boolean,
      [key: string]: any
    }

    interface TestInfo {
      url: string
      isTestWithSpeedKit: boolean
      isSpeedKitComparison: boolean
      activityTimeout: number
      skipPrewarm: boolean
      preload: boolean
      ignoreConfig: boolean
      testOptions: TestOptions
      cookie: string
      appName: string | null
    }

    interface TestResult extends binding.Entity {
      url: string;
      status: StatusString;
      hasFinished: boolean;
      testId: string;
      location: string;
      firstView: Run | null;
      repeatView: Run | null;
      summaryUrl: string;
      publishedSummaryUrl: string;
      videoIdFirstView: string;
      videoIdRepeatedView: string;
      videoFileFirstView: binding.File | null;
      testDataMissing: boolean;
      videoFileRepeatView: binding.File | null;
      retryRequired: boolean;
      isWordPress: boolean;
      isClone: boolean;
      priority: number;
      speedKitConfig: string;
      testInfo: TestInfo;
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
      url: string;
      status: StatusString;
      hasFinished: boolean;
      psiDomains: number;
      psiRequests: number;
      psiResponseSize: string;
      psiScreenshot: binding.File;
      location: string;
      caching: boolean;
      mobile: boolean;
      displayUrl: string;
      competitorTestResult: TestResult;
      speedKitTestResult: TestResult;
      whitelist: string;
      factors: Mean | null;
      isSpeedKitComparison: boolean;
      isSecured: boolean;
      type: string | null;
      speedKitVersion: string | null;
      activityTimeout: number;
      speedKitConfig: string | null;
      tasks: Array<Task>;
      configAnalysis: ConfigAnalysis | null;
      puppeteer: Puppeteer | null;
      hasMultiComparison: boolean;
      documentRequestFailed: boolean;
      error?: { message: string, status: number };
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
      status: StatusString;
      hasFinished: boolean;
      testId: string;
      testType: string;
      testScript: string;
      testOptions: any;
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
      fmpData: FMPData;
      documentRequestFailed: boolean;
      largestContentfulPaint: number;
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

    interface Mean extends binding.Managed {
      speedIndex: number;
      firstMeaningfulPaint: number;
      ttfb: number;
      domLoaded: number;
      fullyLoaded: number;
      lastVisualChange: number;
      load: number;
      largestContentfulPaint: number;
    }

    interface UrlAnalysis extends binding.Managed {
      url: string;
      displayUrl: string;
      type: string | null;
      secured: boolean;
      mobile: boolean;
      supported: boolean;
      speedKitUrl: string | null;
      speedKitEnabled: boolean;
      speedKitVersion: string | null;
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

    interface JobDefinition extends binding.Entity {
      module: string
      cronpattern: string
      startsAt: Date
      expiresAt: Date
      nextExecution: Date
      testseries: model.Testseries
    }

    interface Puppeteer extends binding.Managed {
      url: string;
      displayUrl: string;
      scheme: string;
      host: string;
      protocol: string;
      domains: string[];
      screenshot: binding.File;
      type: PuppeteerType;
      stats: PuppeteerStats;
      speedKit: PuppeteerSpeedKit | null;
      smartConfig: string;
      serviceWorkers: PuppeteerServiceWorkers[] | null;
    }

    interface PuppeteerServiceWorkers extends binding.Managed {
      scope: string | null;
      source: string | null;
    }

    interface PuppeteerType extends binding.Managed {
      framework: string | null;
      language: string | null;
      server: string | null;
    }

    interface PuppeteerStats extends binding.Managed {
      requests: number;
      size: number;
      errors: number;
      redirects: number;
      successful: number;
      compressed: number;
      images: number;
      scripts: number;
      stylesheets: number;
      fonts: number;
      fromDiskCache: number;
      fromServiceWorker: number;
      domains: number;
    }

    interface PuppeteerSpeedKit extends binding.Managed {
      major: number;
      minor: number;
      patch: number;
      stability: string | null;
      swUrl: string;
      swPath: string;
      appName: string;
      appDomain: string | null;
      config: any;
    }

    interface Monitoring extends binding.Managed {
      date: Date;
      meanValues: model.Mean;
      resultDistribution: ResultDistribution;
    }

    interface ResultDistribution extends binding.Managed {
      total: number;
      veryGood: number;
      good: number;
      ok: number;
      bad: number;
      failed: number;
    }

    interface Candidate extends binding.Managed {
      visualCompleteness: number;
      deltaVC: number;
      startTime: number;
      endTime: number;
      wptFMP: number | null;
    }

    interface FMPData extends binding.Managed {
      suggestedCandidate: Candidate;
      candidates: Array<Candidate> | null;
    }

    interface ChromeUXReport extends binding.Entity {
      [key: string]: any;
      url: string;
      month: number;
      year: number;
      device: string;
      status: string;
      totalDensity: number;
      firstPaint: ChromeUXReportData[];
      fpMedian: number;
      firstContentfulPaint: ChromeUXReportData[];
      fcpMedian: number;
      domContentLoaded: ChromeUXReportData[];
      dclMedian: number;
      onLoad: ChromeUXReportData[];
      olMedian: number;
      ttfb: ChromeUXReportData[];
      ttfbMedian: number;
    }

    interface ChromeUXReportData {
      start: number;
      density: number;
    }
  }
}
