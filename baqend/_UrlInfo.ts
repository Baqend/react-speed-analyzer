/**
 * Info about Speed Kit.
 */
export interface SpeedKitInfo {
  speedKitEnabled: boolean
  speedKitVersion: string | null
  speedKitUrl: string | null
}

/**
 * Info retrieved from pages.
 */
export interface BasicUrlInfo {
  url: string
  displayUrl: string
  type: string | null
  secured: boolean
  mobile: boolean
}

/**
 * An object containing information about the URLs contents.
 */
export interface UrlInfo extends SpeedKitInfo, BasicUrlInfo {
}

/**
 * A nullable URL information object.
 */
export type OptUrlInfo = UrlInfo | null
