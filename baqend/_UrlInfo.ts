/**
 * The type of a URL.
 */
export enum UrlType {
  BAQEND = 'baqend',
  SULU = 'sulu',
  WIX = 'wix',
  WEEBLY = 'weebly',
  JIMDO = 'jimdo',
  JOOMLA = 'joomla',
  WORDPRESS = 'wordpress',
  DRUPAL = 'drupal',
  TYPO3 = 'typo3',
  SQUARESPACE = 'squarespace',
}

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
  type: UrlType | null
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
