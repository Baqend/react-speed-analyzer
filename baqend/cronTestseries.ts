import { baqend, model } from 'baqend'
import { appendItem, cleanObject } from './_helpers'
import { DataType, Serializer } from './_Serializer'
import { call } from './startMultiComparison'

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend, jobStatus: model.JobStatus, jobDefinition: model.JobDefinition) {
  db.log.info('Running testseries job')
  const series = await jobDefinition.testseries.load()
  db.log.info('Found test series, starting new bulk test')
  const entry = new db.TestEntry()
  series.testEntries = appendItem(series.testEntries, entry)

  entry.time = new Date()
  const serializer = new Serializer()

  const speedKitConfig = series.speedKitConfig ? serializer.serialize(series.speedKitConfig, DataType.JAVASCRIPT) : null
  const options = cleanObject({
    url: series.url,
    runs: series.runs,
    createdBy: 'cronTestseries',
    location: series.location,
    mobile: series.mobile,
    speedKitConfig,
  })

  entry.test = await call(db, options)

  return series.save()
}
