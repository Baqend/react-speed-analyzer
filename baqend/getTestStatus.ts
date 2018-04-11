import { baqend, model } from 'baqend'
import { TestStatus } from 'webpagetest'
import { bootstrap } from './_compositionRoot'

type GetTestStatus = { status: null | TestStatus }

/**
 * @param db The Baqend instance.
 * @param testId The test result ID.
 * @return The current test status.
 */
export async function getTestStatus(db: baqend, testId: string): Promise<GetTestStatus> {
  const result: model.TestResult = await db.TestResult.load(testId)
  if (!result) {
    throw new Abort('Object not found')
  }

  const { pagetest } = bootstrap(db)
  let status = null
  if (result.testId) {
    status = await pagetest.getTestStatus(result.testId)
  } else if (result.webPagetests && result.webPagetests.length) {
    status = await pagetest.getTestStatus(result.webPagetests[0].testId)
  }

  return { status }
}

/**
 * Baqend code API call.
 */
export function call(db: baqend, { baqendId }: any): Promise<GetTestStatus> {
  return getTestStatus(db, baqendId)
}
