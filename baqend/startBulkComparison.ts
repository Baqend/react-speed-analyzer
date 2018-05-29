import { baqend, model } from 'baqend'
import { BulkComparisonTestParams } from './_BulkComparisonFactory'
import { bootstrap } from './_compositionRoot'
import { generateHash, getDateString } from './_helpers'
import { TestParams } from './_TestParams'

/**
 * The params which are allowed per test.
 */
export interface BulkTestParams extends TestParams {
  runs?: number
}

type StartBulkComparisonParams = BulkTestParams[] | {
  tests: BulkTestParams[]
  createdBy?: string
}

export async function startBulkComparison(db: baqend, id: string, createdBy: string | null, data: BulkTestParams[]): Promise<model.BulkComparison> {
  const { bulkComparisonWorker, bulkComparisonFactory } = bootstrap(db)

  const tests = data.filter(param => param !== null) as BulkComparisonTestParams[]
  const bulkComparison = await bulkComparisonFactory.create(id, createdBy, tests)
  await bulkComparisonWorker.next(bulkComparison)

  return bulkComparison
}

/**
 * Baqend code API call.
 */
export function call(db: baqend, data: StartBulkComparisonParams): any {
  const id = `${getDateString()}-${generateHash()}`
  if (data instanceof Array) {
    startBulkComparison(db, id, null, data)
      .catch((error) => console.error(`Error while starting bulk comparison: ${error.message}`, { stack: error.stack, tests, createdBy }))

    return { id, tests: data, createdBy: null }
  }

  const { tests, createdBy = null } = data
  startBulkComparison(db, id, createdBy, tests)
    .catch((error) => console.error(`Error while starting bulk comparison: ${error.message}`, { stack: error.stack, tests, createdBy }))

  return { id, tests, createdBy }
}
