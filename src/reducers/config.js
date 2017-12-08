
import { CHANGE_URL, CHANGE_LOCATION, SWITCH_CACHING, SWITCH_MOBILE } from '../actions/types';

const initialState = {
    url: null,
    location: 'eu-central-1:Chrome.Native',
    caching: false,
    mobile: false
}

export default function config(state = initialState, action = {}) {
    switch (action.type) {
        case CHANGE_URL:
            return { ...state, url: action.payload }
        default:
            return state
    }
}
