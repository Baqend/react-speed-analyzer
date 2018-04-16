import { baqend } from 'baqend'
import { bootstrap } from './_compositionRoot'

export function call(db: baqend, { id }: any) {
  const { testWorker } = bootstrap(db)
  db.log.info('Pingback for test', { id })

  return testWorker.handleWebPagetestResult(id)
}
