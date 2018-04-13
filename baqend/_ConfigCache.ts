import { baqend, model } from 'baqend'

export class ConfigCache {
  constructor(
    private readonly db: baqend,
  ) {
  }

  /**
   * Puts a config into the config cache.
   */
  async put(url: string, mobile: boolean, config: string): Promise<string> {
    const cachedConfig: model.CachedConfig = new this.db.CachedConfig({ url, mobile, config })
    await cachedConfig.save()
    this.db.log.info('Smart config cached', { url, config })

    return config
  }

  /**
   * Gets a config from the config cache.
   */
  async get(url: string, mobile: boolean): Promise<string | null> {
    const anHourAgo = new Date(Date.now() - 1000 * 60 * 60)
    const cachedConfig: model.CachedConfig = await this.db.CachedConfig.find()
      .equal('url', url)
      .equal('mobile', mobile)
      .greaterThanOrEqualTo('updatedAt', anHourAgo)
      .singleResult()

    if (cachedConfig && cachedConfig.config) {
      this.db.log.info('Use cached config', { url, cachedConfig })
      return cachedConfig.config
    }

    return null
  }
}
