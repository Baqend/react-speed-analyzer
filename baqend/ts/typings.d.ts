declare class Abort extends Error {}

declare module 'limiter' {
  export class RateLimiter {
    constructor(requestsPerUnit: number, unit: string, fireCallbackImmediately?: boolean)
    tryRemoveTokens(tokens: number): boolean
  }
}

declare module 'webpagetest' {
  export default class WebPageTest {
    constructor(endpoint: string, apiKey: string)
    runTest(scriptOrUrl: string, opts: any, callback: (err: Error | undefined, result: any) => void)
    getTestStatus(testId: string, opts: any, callback: (err: Error | undefined, result: { statusCode: number }) => void)
    createVideo(testId: string, opts: any, callback: (err: Error | undefined, result: any) => void)
    getEmbedVideoPlayer(testId: string, opts: any, callback: (err: Error | undefined, result: any) => void)
    getTestResults(testId: string, opts: any, callback: (err: Error | undefined, result: any) => void)
  }
}
