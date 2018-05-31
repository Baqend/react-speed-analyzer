import { baqend, model } from 'baqend'

const fields: Array<keyof model.Mean> = ['speedIndex', 'firstMeaningfulPaint', 'ttfb', 'domLoaded', 'fullyLoaded', 'lastVisualChange', 'load']
const VERY_GOOD_TEST_LOWER_LIMIT = 2;
const GOOD_TEST_UPPER_LIMIT = 2;
const GOOD_TEST_LOWER_LIMIT = 1.5;
const OK_TEST_UPPER_LIMIT = 1.5;
const OK_TEST_LOWER_LIMIT = 1;
const BAD_TEST_UPPER_LIMIT = 1;
const BAD_TEST_LOWER_LIMIT = 0;

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const testOverviews = await loadTestOverviews(db)
  const means = calculateMeanValues(db, testOverviews)

  const resultDistribution = await calculateResultDistribution(db)

  return await saveMonitoring(db, means, resultDistribution)
}

async function loadTestOverviews(db: baqend): Promise<model.TestOverview[]> {
  const date = new Date();
  date.setHours(0, 0, 0, 0)

  return await db.TestOverview.find()
    .notEqual('hasMultiComparison', true)
    .greaterThanOrEqualTo('createdAt', date)
    .resultList()
}

async function getTestCount(db: baqend, minValue?: number, maxValue?: number): Promise<number> {
  const date = new Date()
  date.setHours(0, 0, 0, 0)

  let queryBuilder = db.TestOverview.find()
    .greaterThanOrEqualTo('createdAt', date)

  if (minValue) {
    queryBuilder = queryBuilder.greaterThan('factors.speedIndex', minValue)
  }

  if (maxValue) {
    queryBuilder = queryBuilder.lessThanOrEqualTo('factors.speedIndex', maxValue)
  }

  return await queryBuilder.count()
}

async function calculateResultDistribution(db: baqend): Promise<model.ResultDistribution> {
  const totalTestsPromise = getTestCount(db)
  const veryGoodTestsPromise = getTestCount(db, VERY_GOOD_TEST_LOWER_LIMIT)
  const goodTestsPromise = getTestCount(db, GOOD_TEST_LOWER_LIMIT, GOOD_TEST_UPPER_LIMIT)
  const okTestsPromise = getTestCount(db, OK_TEST_LOWER_LIMIT, OK_TEST_UPPER_LIMIT)
  const badTestsPromise = getTestCount(db, BAD_TEST_LOWER_LIMIT, BAD_TEST_UPPER_LIMIT)

  const [ total, veryGood, good, ok, bad ] = await Promise.all([
    totalTestsPromise, veryGoodTestsPromise, goodTestsPromise, okTestsPromise, badTestsPromise
  ])

  const failed = total - (veryGood + good + ok + bad)

  return Object.assign(new db.ResultDistribution(), { total, veryGood, good, ok, bad, failed });
}

function calculateMeanValues(db: baqend, data: Array<model.TestOverview>): model.Mean {
  const mean = new db.Mean();
  const aggregates = data.reduce((prev: any, run: any) => {
    const result = prev

    for (const field of fields) {
      if (run.factors && run.factors[field] && run.factors[field] > 0) {
        const prevValue = prev[field] ? prev[field].value : 0
        let divide = prev[field] ? prev[field].divide : 0

        result[field] = {
          value: prevValue + run.factors[field],
          divide: divide += 1,
        }
      }
    }

    return result
  }, {})

  Object.keys(aggregates).forEach((key) => {
    mean[key] = aggregates[key].value / aggregates[key].divide
  })

  return mean
}

async function saveMonitoring(db: baqend, means: model.Mean, resultDistribution: model.ResultDistribution): Promise<model.Monitoring> {
  const now = Date.now()
  const date = new Date(now - now % (24 * 3600 * 1000))

  const existing = await db.Monitoring.find().equal('date', date).singleResult()
  const monitoring = existing || new db.Monitoring();
  monitoring.date = date;
  monitoring.means = means;
  monitoring.resultDistribution = resultDistribution

  return await monitoring.save()
}
