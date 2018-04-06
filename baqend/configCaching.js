function cacheSpeedKitConfig(db, url, mobile, config) {
  const cachedConfig = new db.CachedConfig({ url, mobile, config })

  return cachedConfig.save().then(() => config)
}

function getCachedSpeedKitConfig(db, url, mobile)  {
  const date = new Date()
  return db.CachedConfig.find()
    .equal('url', url)
    .equal('mobile', mobile)
    .greaterThanOrEqualTo('updatedAt', new Date(date.getTime() - 1000 * 60 * 60))
    .singleResult()
    .then(cachedConfig => {
      if (cachedConfig && cachedConfig.config) {
        db.log.info(`Use cached config`, { url, cachedConfig })
        return cachedConfig.config
      }
      return null
    })
}

exports.cacheSpeedKitConfig = cacheSpeedKitConfig
exports.getCachedSpeedKitConfig = getCachedSpeedKitConfig
