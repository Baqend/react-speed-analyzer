import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'

export async function call(db: baqend, params: any) {
  const { testWorker, testFactory } = bootstrap(db)

  const testResult = await testFactory.create(params)
  testWorker.next(testResult)

  return testResult
}
