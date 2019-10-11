export interface Config {
  appName: string
  appDomain?: string
  enabledSites?: Rule[]
  whitelist?: Rule[]
  blacklist?: Rule[]
  image?: ImageRule[]
  userAgentDetection?: boolean
  criticalResources?: ResourceRule[]
  stripQueryParams?: StripParamsRule[]
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

export interface ImageRule {
  rules: Rule[]
  options: ImageOptions
}

export interface ResourceRule {
  rules?: Rule[]
  resources: string[]
}

export interface ImageOptions {
  quality?: number
  downscale?: boolean
  screenSizeFactor?: number
  maxWidth?: number
  webp?: boolean
  pjpeg?: boolean
}

export interface StripParamsRule {
  enabledSites?: Rule[]
  rules?: Rule[]
  params: string[]
}

export type Condition = string | RegExp | Array<string | RegExp>
