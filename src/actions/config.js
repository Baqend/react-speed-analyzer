import {
  CHANGE_URL,
  CHANGE_LOCATION,
  CHANGE_WHITELIST,
  SWITCH_MOBILE,
  SWITCH_CACHING
} from './types'

export function handleUrlInput(url) {
  return {
    type: CHANGE_URL,
    payload: url,
  }
}

export function handleLocationChange(location) {
  return {
    type: CHANGE_LOCATION,
    payload: location === 'US' ? 'us-east-1:Chrome.Native' : 'eu-central-1:Chrome.Native',
  }
}

export function handleWhitelistChange(whitelist) {
  return {
    type: CHANGE_WHITELIST,
    payload: whitelist,
  }
}

export function handleMobileSwitch(isMobile) {
  return {
    type: SWITCH_MOBILE,
    payload: !isMobile,
  }
}

export function handleCachingSwitch(caching) {
  return {
    type: SWITCH_CACHING,
    payload: !caching,
  }
}
