import { CHANGE_URL, CHANGE_LOCATION, SWITCH_MOBILE } from './types';

export function handleUrlInput(url) {
    return {
        type: CHANGE_URL,
        payload: url
    }
}

export function handleLocationChange(location) {
  return {
    type: CHANGE_LOCATION,
    payload: location === 'US' ? 'us-east-1:Chrome.Native' : 'eu-central-1:Chrome.Native'
  }
}

export function handleMobileSwitch(mobile) {
  return {
    type: SWITCH_MOBILE,
    payload: mobile
  }
}
