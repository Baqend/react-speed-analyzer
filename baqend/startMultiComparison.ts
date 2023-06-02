import { baqend, model } from 'baqend'
import { bootstrap } from './_compositionRoot'
import { TestParams } from './_TestParams'

export interface StartMultiComparisonParams extends TestParams {
  runs?: number
  createdBy?: string
}

/**
 * Baqend code API call.
 */
export async function call(db: baqend, data: StartMultiComparisonParams): Promise<model.BulkTest> {
  const { multiComparisonWorker, multiComparisonFactory } = bootstrap(db)

  // Get necessary options
  const { createdBy, runs, ...params } = data
  const multiComparison = await multiComparisonFactory.create(params, createdBy, runs)
  multiComparisonWorker.next(multiComparison)

  return multiComparison
}
