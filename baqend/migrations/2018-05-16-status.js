async function migrate() {
  (await DB.BulkComparison.find().isNull('status').equal('hasFinished', true).resultList())
    .forEach(async (entity) => await entity.partialUpdate().set('status', 'SUCCESS').execute())

  (await DB.BulkTest.find().isNull('status').equal('hasFinished', true).resultList())
    .forEach(async (entity) => await entity.partialUpdate().set('status', 'SUCCESS').execute())

  (await DB.TestOverview.find().isNull('status').equal('hasFinished', true).resultList())
    .forEach(async (entity) => await entity.partialUpdate().set('status', 'SUCCESS').execute())

  (await DB.TestResult.find().isNull('status').equal('hasFinished', true).resultList())
    .forEach(async (entity) => await entity.partialUpdate().set('status', 'SUCCESS').execute())
}
