export enum Priority {
  HIGHEST = 0,
  HIGHER = 1,
  HIGH = 2,
  LESS_HIGH = 3,
  MEDIUM_HIGH = 4,
  MEDIUM_LOW = 5,
  LESS_LOW = 6,
  LOW = 7,
  LOWER = 8,
  LOWEST = 9,
}

export interface TestParams {
  /**
   * The not normalized input url.
   */
  url: string

  /**
   * The name of the Baqend app to connect to.
   */
  app?: string

  /**
   * The activity timeout of the test.
   */
  activityTimeout?: number

  /**
   * Whether browser caching is enabled.
   */
  caching?: boolean

  /**
   * The location where the test will be executed.
   */
  location?: string

  /**
   * Whether to run the test under mobile conditions.
   */
  mobile?: boolean

  /**
   * The test's priority.
   */
  priority?: Priority

  /**
   * If a prewarm run should be skipped for this test.
   */
  skipPrewarm?: boolean

  /**
   * A special Speed Kit config to use for this test.
   */
  speedKitConfig?: string | null

  /**
   * The WebPagetest test timeout.
   */
  timeout?: number

  /**
   * If a test is expected to be a Speed Kit comparison.
   */
  speedKitExpected?: boolean

  /**
   * If resources like CSS and fonts should be preloaded.
   */
  preload?: boolean

  /**
   * If an existing Speed Kit config should be ignored.
   */
  ignoreConfig?: boolean

  /**
   * A string of cookies to be set when running the test.
   */
  cookie?: string
}

export interface MultiTestParams extends TestParams {
  /**
   * The number of runs to execute.
   */
  runs?: number
}
