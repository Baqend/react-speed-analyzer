import { baqend } from 'baqend'
import { BulkComparisonFactory } from './_BulkComparisonFactory'
import { BulkComparisonWorker } from './_BulkComparisonWorker'
import { ComparisonFactory } from './_ComparisonFactory'
import { ComparisonWorker } from './_ComparisonWorker'
import { MultiComparisonFactory } from './_MultiComparisonFactory'
import { MultiComparisonWorker } from './_MultiComparisonWorker'
import { Pagetest } from './_Pagetest'
import { TestBuilder } from './_TestBuilder'
import { TestFactory } from './_TestFactory'
import { TestWorker } from './_TestWorker'
import { UrlAnalyzer } from './_UrlAnalyzer'
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
  const urlAnalyzer = new UrlAnalyzer(db)
  const pagetest = new Pagetest()
  const webPagetestResultHandler = new WebPagetestResultHandler(db, pagetest)
  const testBuilder = new TestBuilder()

  // Create factories
  const testFactory = new TestFactory(db, testBuilder)
  const comparisonFactory = new ComparisonFactory(db, testFactory, testBuilder)
  const multiComparisonFactory = new MultiComparisonFactory(db, testBuilder)
  const bulkComparisonFactory = new BulkComparisonFactory(db, testBuilder)

  // Create workers
  const testWorker = new TestWorker(db, pagetest, webPagetestResultHandler)
  const comparisonWorker = new ComparisonWorker(db, testWorker)
  const multiComparisonWorker = new MultiComparisonWorker(db, comparisonFactory, comparisonWorker)
  const bulkComparisonWorker = new BulkComparisonWorker(db, multiComparisonFactory, multiComparisonWorker)

  return {
    urlAnalyzer,
    pagetest,
    webPagetestResultHandler,
    testBuilder,

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
