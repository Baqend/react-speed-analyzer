import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { MultiComparisonFactory } from './_MultiComparisonFactory'
import { MultiComparisonListener, MultiComparisonWorker } from './_MultiComparisonWorker'
import { Puppeteer } from './_Puppeteer'
import {
  isFinished, isIncomplete, isUnfinished, setCanceled, setIncomplete, setRunning, setSuccess,
  Status,
} from './_Status'
import { parallelize } from './_helpers'

export class BulkComparisonWorker implements MultiComparisonListener {
  constructor(
    private readonly db: baqend,
    private readonly multiComparisonFactory: MultiComparisonFactory,
    private readonly multiComparisonWorker: MultiComparisonWorker,
  ) {
    this.multiComparisonWorker.setListener(this)
  }

  async next(bulkComparison: model.BulkComparison) {
    this.db.log.debug(`BulkComparisonWorker.next("${bulkComparison.key}")`)
    try {
      // Ensure bulk comparison is loaded with depth 1
      await bulkComparison.load({ depth: 1, refresh: true })

      // Is this bulk comparison already finished?
      if (isFinished(bulkComparison)) {
        return
      }

      // Set bulk comparison to running
      if (bulkComparison.status !== Status.RUNNING) {
        await bulkComparison.optimisticSave(() => setRunning(bulkComparison))
      }

      const { multiComparisons, createdBy } = bulkComparison

      // Is there an active multi comparison which is not finished?
      const currentMultiComparison = multiComparisons[multiComparisons.length - 1]
      if (currentMultiComparison && !currentMultiComparison.hasFinished) {
        return
      }

      const nextIndex = this.getNextIndex(bulkComparison)
      if (nextIndex < 0) {
        this.db.log.info(`BulkComparison ${bulkComparison.key} is finished.`, { bulkComparison })
        if (bulkComparison.hasFinished) {
          this.db.log.warn(`BulkComparison ${bulkComparison.key} was already finished.`, { bulkComparison })
          return
        }

        // Save is finished state
        const isIncomplete = await this.isBulkIncomplete(bulkComparison)
        await bulkComparison.optimisticSave(() => {
          isIncomplete ? setIncomplete(bulkComparison) : setSuccess(bulkComparison)
        })

        // TODO: Add new listener here?
        return
      }

      // Start next multi comparison
      const { runs, ...params } = bulkComparison.comparisonsToStart[nextIndex]
      const puppeteer = await this.getPuppeteerInfo(params.url, params.mobile, params.location, params.preload, params.app)

      const multiComparison = await this.multiComparisonFactory.create(puppeteer, params, createdBy, runs)

      await bulkComparison.ready()
      await bulkComparison.optimisticSave((it: model.BulkComparison) => {
        it.multiComparisons.push(multiComparison)
        Object.assign(it.comparisonsToStart[nextIndex], { isStarted: true, multiComparisonId: multiComparison.id })
      })

      this.multiComparisonWorker.next(multiComparison)
    } catch (error) {
      this.db.log.warn(`Error while next iteration`, { id: bulkComparison.id, error: error.stack })
    }
  }

  /**
   * Checks whether one of the corresponding testOverview is incomplete
   */
  async isBulkIncomplete(bulkComparison: model.BulkComparison): Promise<boolean> {
    const multiComparisons = await Promise.all(bulkComparison.multiComparisons.map(multiComparison => multiComparison.load()))
    return multiComparisons.some(multiComparison => isIncomplete(multiComparison))
  }

  /**
   * Gets the Puppeteer information of a given url
   */
  async getPuppeteerInfo(url: string, mobile: boolean, location: string, preload: boolean, app: string): Promise<model.Puppeteer | null> {
    const { puppeteer } = bootstrap(this.db)
    try {
      return await this.callPuppeteerWithRetries(puppeteer, url, mobile, location, preload, app)
    } catch ({ message, stack }) {
      this.db.log.error(`Puppeteer failed for ${url}: ${message}`, { stack })
      return null
    }
  }

  /**
   * Cancels the given bulk comparison.
   */
  async cancel(bulkComparison: model.BulkComparison): Promise<boolean> {
    if (isFinished(bulkComparison)) {
      return false
    }

    // Cancel all unfinished multi comparisons
    const unfinished = bulkComparison.multiComparisons.filter(multiComparison => isUnfinished(multiComparison))
    if (unfinished.length > 0) {
      await bulkComparison.multiComparisons
        .map(multiComparison => this.multiComparisonWorker.cancel(multiComparison))
        .reduce(parallelize)
    }

    await bulkComparison.optimisticSave(() => setCanceled(bulkComparison))
    return true
  }

  async handleMultiComparisonFinished(multiComparison: model.BulkTest): Promise<void> {
    const bulkComparison = await this.db.BulkComparison.find().in('multiComparisons', multiComparison.id).singleResult()
    if (bulkComparison) {
      console.log(`Multi comparison finished: ${multiComparison.id}`)
      this.next(bulkComparison)
    }
  }

  private async callPuppeteerWithRetries(
    puppeteer: Puppeteer,
    url: string,
    mobile: boolean,
    location: string,
    preload: boolean,
    app: string,
    retries = 0
  ): Promise<model.Puppeteer> {
    try {
      return await puppeteer.analyze(url, mobile, location, true, preload, app)
    } catch (err) {
      if (retries < 3) {
        await new Promise(resolve => setTimeout(() => resolve(), 5000))
        return this.callPuppeteerWithRetries(puppeteer, url, mobile, location, preload, app, retries + 1)
      }

      throw err
    }
  }

  private getNextIndex(bulkComparison: model.BulkComparison): number {
    const { comparisonsToStart } = bulkComparison

    return comparisonsToStart.findIndex(comparison => !comparison.isStarted)
  }
}
