import { baqend } from 'baqend'
import { BulkComparisonFactory } from './_BulkComparisonFactory'
import { BulkComparisonWorker } from './_BulkComparisonWorker'
import { ComparisonFactory } from './_ComparisonFactory'
import { ComparisonWorker } from './_ComparisonWorker'
import { ConfigCache } from './_ConfigCache'
import { ConfigGenerator } from './_ConfigGenerator'
import { MultiComparisonFactory } from './_MultiComparisonFactory'
import { MultiComparisonWorker } from './_MultiComparisonWorker'
import { Pagetest } from './_Pagetest'
import { Puppeteer } from './_Puppeteer'
import { Serializer } from './_Serializer'
import { TestBuilder } from './_TestBuilder'
import { TestFactory } from './_TestFactory'
import { TestScriptBuilder } from './_TestScriptBuilder'
import { TestWorker } from './_TestWorker'
import { WebPagetestResultHandler } from './_WebPagetestResultHandler'

/**
 * This function bootstraps all classes based on the Baqend instance.
 *
 * Call this function to bootstrap the backend application.
 * After calling this class, all factories, workers, etc. are initialized
 * correctly and can be used as needed.
 *
 * @param db The Baqend instance to use.
 * @return The Dependency Injection container containing all instances.
 */
export function bootstrap(db: baqend) {
  // Create services
  const serializer = new Serializer()
  const testScriptBuilder = new TestScriptBuilder()
  const configCache = new ConfigCache(db, serializer)
  const configGenerator = new ConfigGenerator(db.log)
  const pagetest = new Pagetest()
  const webPagetestResultHandler = new WebPagetestResultHandler(db)
  const testBuilder = new TestBuilder()
  const puppeteer = new Puppeteer(db, configGenerator, serializer)

  // Create factories
  const testFactory = new TestFactory(db, testBuilder)
  const comparisonFactory = new ComparisonFactory(db, testFactory, testBuilder, configCache, configGenerator, serializer)
  const multiComparisonFactory = new MultiComparisonFactory(db, testBuilder)
  const bulkComparisonFactory = new BulkComparisonFactory(db, testBuilder)

  // Create workers
  const testWorker = new TestWorker(db, pagetest, webPagetestResultHandler, configGenerator, testScriptBuilder, serializer)
  const comparisonWorker = new ComparisonWorker(db, testWorker, comparisonFactory)
  const multiComparisonWorker = new MultiComparisonWorker(db, comparisonFactory, comparisonWorker)
  const bulkComparisonWorker = new BulkComparisonWorker(db, multiComparisonFactory, multiComparisonWorker)

  return {
    serializer,
    testScriptBuilder,
    configCache,
    configGenerator,
    pagetest,
    webPagetestResultHandler,
    testBuilder,
    puppeteer,

    testFactory,
    bulkComparisonFactory,
    multiComparisonFactory,
    comparisonFactory,

    testWorker,
    comparisonWorker,
    multiComparisonWorker,
    bulkComparisonWorker,
  }
}
