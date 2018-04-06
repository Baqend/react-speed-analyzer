import { API } from './Pagetest'
import { baqend, model } from 'baqend'
import { TestStatus } from 'webpagetest'

type GetTestStatus = { status: null | TestStatus }

/**
 * @param db The Baqend instance.
 * @param baqendId The test result ID.
 * @return The current test status.
 */
export async function getTestStatus(db: baqend, baqendId: string): Promise<GetTestStatus> {
  const result: model.TestResult = await db.TestResult.load(baqendId)
  if (!result) {
    throw new Abort('Object not found')
  }

  let status = null
  if (result.testId) {
    status = await API.getTestStatus(result.testId)
  } else if (result.webPagetests && result.webPagetests.length) {
    status = await API.getTestStatus(result.webPagetests[0].testId)
  }

  return { status }
}

/**
 * Baqend code API call.
 */
export function call(db: baqend, data: any): Promise<GetTestStatus> {
  const { baqendId } = data

  return getTestStatus(db, baqendId)
}
