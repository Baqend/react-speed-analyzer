export interface TestParams {
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
  priority?: number

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
}
