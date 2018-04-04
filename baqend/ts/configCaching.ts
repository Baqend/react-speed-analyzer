import {baqend, model} from 'baqend'

export async function cacheSpeedKitConfig(db: baqend, url: string, mobile: boolean, config: string): Promise<string> {
  const cachedConfig: model.CachedConfig = new db.CachedConfig({ url, mobile, config })
  await cachedConfig.save()
  db.log.info('Smart Config generated', { url: testInfo.url, config })

  return config
}

export async function getCachedSpeedKitConfig(db: baqend, url: string, mobile: boolean): Promise<string | null>  {
  const date = new Date()
  const cachedConfig: model.CachedConfig = await db.CachedConfig.find()
    .equal('url', url)
    .equal('mobile', mobile)
    .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
    .singleResult()

  if (cachedConfig && cachedConfig.config) {
    db.log.info(`Use cached config`, { url, cachedConfig })
    return cachedConfig.config
  }

  return null
}
