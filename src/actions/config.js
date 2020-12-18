import {
  RESET_CONFIG,
  CHANGE_URL,
  CHANGE_COOKIE,
  CHANGE_LOCATION,
  CHANGE_TIMEOUT,
  CHANGE_SPEED_KIT_CONFIG,
  SWITCH_MOBILE,
  SWITCH_CACHING,
  UPDATE_CONFIG,
} from './types'

export function resetConfig() {
  return {
    type: RESET_CONFIG
  }
}

export function handleUrlInput(cookie) {
  return {
    type: CHANGE_URL,
    payload: cookie,
  }
}

export function handleCookieInput(url) {
  return {
    type: CHANGE_COOKIE,
    payload: url,
  }
}

export function handleLocationChange(location) {
  return {
    type: CHANGE_LOCATION,
    payload: location === 'US' ? 'us-east-1-docker:Chrome.FIOSNoLatency' : 'eu-central-1-docker:Chrome.FIOSNoLatency',
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

export function handleMobileSwitch(mobile) {
  return {
    type: SWITCH_MOBILE,
    payload: !mobile,
  }
}

export function handleCachingSwitch(caching) {
  return {
    type: SWITCH_CACHING,
    payload: !caching,
  }
}

export const updateConfigByTestOverview = (testOverview) => ({
  type: UPDATE_CONFIG,
  payload: {
    url: testOverview.url,
    location: testOverview.location,
    caching: testOverview.caching,
    mobile: testOverview.mobile,
    activityTimeout: testOverview.activityTimeout,
    speedKitConfig: testOverview.speedKitConfig,
  }
})
