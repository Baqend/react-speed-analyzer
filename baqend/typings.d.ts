interface AbortConstructor {
  new(data?: any): Error
  (message?: string): Error
  readonly prototype: Error
}

declare const Abort: AbortConstructor

declare module 'limiter' {
  export class RateLimiter {
    constructor(requestsPerUnit: number, unit: string, fireCallbackImmediately?: boolean)
    tryRemoveTokens(tokens: number): boolean
  }
}

declare module 'webpagetest' {

  export interface TestInfo {
    url: string
    runs: number
    fvonly: number
    web10: number
    ignoreSSL: number
    video: string
    label: string
    priority: number
    block: string
    location: string
    browser: string
    connectivity: string
    bwIn: number
    bwOut: number
    latency: number
    plr: string
    tcpdump: number
    timeline: number
    trace: number
    bodies: number
    netlog: number
    standards: number
    noscript: number
    pngss: number
    iq: number
    keepua: number
    mobile: number
    scripted: number
  }

  export interface TestData {
    statusCode: number
    statusText: string
    id: string
    testInfo: TestInfo
    testId: string
    runs: number
    fvonly: number
    remote: false
    testsExpected: number
    location: string
    behindCount: number
  }

  export interface TestStatus {
    statusCode: number
    statusText: string
    data: TestData
  }

  export default class WebPageTest {
    constructor(endpoint: string, apiKey: string)
    runTest(scriptOrUrl: string, opts: any, callback: (err: Error | undefined, result: any) => void): void
    getTestStatus(testId: string, opts: any, callback: (err: Error | undefined, result: TestStatus) => void): void
    createVideo(testId: string, opts: any, callback: (err: Error | undefined, result: any) => void): void
    getEmbedVideoPlayer(testId: string, opts: any, callback: (err: Error | undefined, result: any) => void): void
    getTestResults(testId: string, opts: any, callback: (err: Error | undefined, result: any) => void): void
    cancelTest(id: string, options: any, callback: (err: Error | undefined) => void): void
    cancelTest(id: string, callback: (err: Error | undefined) => void): void
  }
}
