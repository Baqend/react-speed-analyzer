export interface Config {
  appName: string
  appDomain?: string
  enabledSites?: Rule[]
  whitelist?: Rule[]
  blacklist?: Rule[]
  userAgentDetection?: boolean
}

export interface Rule {
  url?: Condition
  host?: Condition
  pathname?: Condition
  cookie?: Condition
  contentType?: string
  mobile?: true
  desktop?: true
  tablet?: true
  tv?: true
}

export type Condition = string | RegExp | Array<string | RegExp>
