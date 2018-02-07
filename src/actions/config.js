import {
  RESET_CONFIG,
  CHANGE_URL,
  CHANGE_LOCATION,
  CHANGE_TIMEOUT,
  CHANGE_SPEED_KIT_CONFIG,
  SWITCH_MOBILE,
  SWITCH_CACHING,
} from './types'

export function resetConfig() {
  return {
    type: RESET_CONFIG
  }
}

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

export function handleTimeoutChange(timeout) {
  return {
    type: CHANGE_TIMEOUT,
    payload: timeout,
  }
}

export function handleSpeedKitConfigChange(config) {
  return {
    type: CHANGE_SPEED_KIT_CONFIG,
    payload: config,
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
