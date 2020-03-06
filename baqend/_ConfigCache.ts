import { baqend, model } from 'baqend'
import { Config } from './_Config'
import { DataType, Serializer } from './_Serializer'

export class ConfigCache {
  constructor(
    private readonly db: baqend,
    private readonly serializer: Serializer,
  ) {
  }

  /**
   * Puts a config into the config cache.
   */
  async put(url: string, mobile: boolean, content: Config): Promise<void> {
    const config = this.serializer.serialize(content, DataType.JSON)
    const cachedConfig: model.CachedConfig = new this.db.CachedConfig({ url, mobile, config })

    await cachedConfig.save()
    this.db.log.info('Smart config cached', { url, config })
  }

  /**
   * Gets a config from the config cache.
   */
  async get(url: string, mobile: boolean): Promise<Config | null> {
    const anHourAgo = new Date(Date.now() - 1000 * 60 * 60)
    const cachedConfig: model.CachedConfig | null = await this.db.CachedConfig.find()
      .equal('url', url)
      .equal('mobile', mobile)
      .greaterThanOrEqualTo('updatedAt', anHourAgo)
      .singleResult()

    if (cachedConfig && cachedConfig.config) {
      this.db.log.info('Use cached config', { url, cachedConfig })
      return this.serializer.deserialize(cachedConfig.config, DataType.JSON)
    }

    return null
  }
}
