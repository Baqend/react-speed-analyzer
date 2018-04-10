import fetch from 'node-fetch'

const AD_SERVER_URL = 'https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_adservers.txt'
const AD_LOCAL_URL = 'https://makefast.app.baqend.com/v1/file/www/selfMaintainedAdList'

let adHosts: Promise<Set<string>> | null = null

/**
 * @return {Promise<Set<string>>} A set of ad domain strings
 */
async function loadAdSet(): Promise<Set<string>> {
  const resp = await fetch(AD_SERVER_URL)
  const text = await resp.text()
  const lines = text.split('\n')
    .filter(line => line.startsWith('||'))
    .map(line => line.substring(2, line.indexOf('^$')))

  return new Set(lines)
}

/**
 * @return {Promise<Set<string>>} A set of ad domain strings
 */
async function addLocalAdList(adSet: Set<string>): Promise<Set<string>> {
  const resp = await fetch(AD_LOCAL_URL)
  const text = await resp.text()
  const lines = text.split('\n')
  lines.forEach(line => adSet.add(line))

  return adSet
}

/**
 * Returns all domains that are ads.
 *
 * @returns {Promise<Set<string>>} A set of ad domain strings
 */
export async function getAdSet(): Promise<Set<string>> {
  if (adHosts) {
    return adHosts
  }

  const adSet = await loadAdSet()
  const completedSet = addLocalAdList(adSet)
  adHosts = completedSet

  return completedSet
}
