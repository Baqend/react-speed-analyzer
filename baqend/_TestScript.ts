/**
 * Crates a test script.
 *
 * @return
 */
export function testScript(): TestScript {
  return new TestScript()
}

/**
 * TestScript abstraction class
 */
export class TestScript {
  private lines: string[]

  constructor() {
    this.lines = []
  }

  /**
   * Dump the script as string.
   */
  toString(): string {
    return this.lines.join('\n')
  }

  /**
   * Sets the blockDomains in the script.
   *
   * @return This is a chainable method.
   */
  blockDomains(...domains: string[]): this {
    if (domains.length) {
      return this.push(`blockDomains ${domains.join(' ')}`)
    }

    return this
  }

  /**
   * Sets the setActivityTimeout in the script.
   *
   * @param seconds The timeout value in seconds.
   * @return This is a chainable method.
   */
  setActivityTimeout(seconds: number): this {
    return this.push(`setActivityTimeout ${seconds}`)
  }

  /**
   * Sets the setTimeout in the script.
   *
   * @param seconds The timeout value in seconds.
   * @return This is a chainable method.
   */
  setTimeout(seconds: number): this {
    return this.push(`setTimeout ${seconds}`)
  }

  /**
   * Sets the navigate in the script.
   *
   * @return This is a chainable method.
   */
  navigate(url: string): this {
    return this.push(`navigate ${url}`)
  }

  /**
   * Sets the logData in the script.
   *
   * @return This is a chainable method.
   */
  logData(value: boolean): this {
    return this.push(`logData ${value ? 1 : 0}`)
  }

  /**
   * Sets the setDns in the script.
   *
   * @param hostname  The hostname to change the DNS of.
   * @param ip        The new IP to resolve to.
   * @return This is a chainable method.
   */
  setDns(hostname: string, ip: string): this {
    return this.push(`setDns ${hostname} ${ip}`)
  }

  private push(line: string): this {
    this.lines.push(line)
    return this
  }
}
