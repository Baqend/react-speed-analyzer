import {
  TESTOVERVIEW_CREATE,
  TESTOVERVIEW_SAVE,
  TESTOVERVIEW_UPDATE_URL,
  TESTOVERVIEW_UPDATE_CACHING,
  TESTOVERVIEW_UPDATE_IS_MOBILE,
  TESTOVERVIEW_UPDATE_WHITELIST
} from './types'
import { getTLD } from '../helper/configHelper'

export function createTestOverview(originalUrl) {
  return {
    'BAQEND': {
      type: TESTOVERVIEW_CREATE,
      payload: async (db) => {
        const testOverview = new db.TestOverview()
        const tld = getTLD(originalUrl)
        const uniqueId = await db.modules.post('generateUniqueId', { entityClass: 'TestOverview' })
        testOverview.id = uniqueId + tld.substring(0, tld.length - 1)
        return testOverview.save()
      },
    },
  }
}

export function saveTestOverview(testOverview, options = {}) {
  return {
    'BAQEND': {
      type: TESTOVERVIEW_SAVE,
      options: options,
      payload: [ testOverview, (db, testOverview) => testOverview.save(options)]
    }
  }
}

export function updateURL(url) {
  return {
    type: TESTOVERVIEW_UPDATE_URL,
    payload: url
  }
}

export function updateCaching(caching) {
  return {
    type: TESTOVERVIEW_UPDATE_CACHING,
    payload: caching
  }
}

export function updateIsMobile(isMobile) {
  return {
    type: TESTOVERVIEW_UPDATE_IS_MOBILE,
    payload: isMobile
  }
}

export function updateWhitelist(whitelist) {
  return {
    type: TESTOVERVIEW_UPDATE_WHITELIST,
    payload: whitelist
  }
}
