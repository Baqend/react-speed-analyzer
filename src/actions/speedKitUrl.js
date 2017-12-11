import { GENERATE_SPEED_KIT_CONFIG, } from './types'
import { generateRules } from '../helper/configHelper'

export function generateSpeedKitConfig(originalUrl, whitelistStr, enableUserAgentDetection) {
  const whitelistDomains = whitelistStr
    .split(',')
    .map(item => item.trim())
    .filter(item => !!item)

  const whitelist = generateRules(originalUrl, whitelistDomains)

  return {
    type: GENERATE_SPEED_KIT_CONFIG,
    payload: `{
    appName: "makefast-dev",
    whitelist: [{ host: [ ${whitelist} ] }],
    userAgentDetection: ${enableUserAgentDetection},
    }`
  }
}
