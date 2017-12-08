import { CHANGE_URL, CHANGE_LOCATION, SWITCH_CACHING, SWITCH_MOBILE } from './types';

export function handleUrlInput(url) {
    return {
        type: CHANGE_URL,
        payload: url
    }
}
