import { baqend, model } from 'baqend'

const fields: Array<keyof model.Mean> = ['speedIndex', 'firstMeaningfulPaint', 'ttfb', 'domLoaded', 'fullyLoaded', 'lastVisualChange']

/**
 * Executed by the Cronjob.
 */
export async function run(db: baqend) {
  const testOverviews = await loadTestOverviews(db)
  const means = calculateMeanValues(db, testOverviews)

  return await saveMonitoring(db, means)
}

async function loadTestOverviews(db: baqend): Promise<model.TestOverview[]> {
  const date = new Date();
  date.setHours(0, 0, 0, 0)

  return await db.TestOverview.find()
    .notEqual('hasMultiComparison', true)
    .greaterThanOrEqualTo('createdAt', date)
    .resultList()
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

async function saveMonitoring(db: baqend, means: model.Mean): Promise<model.Monitoring> {
  const now = Date.now()
  const date = new Date(now - now % (24 * 3600 * 1000))

  const existing = await db.Monitoring.find().equal('date', date).singleResult()
  if (existing) {
    existing.means = means
    return await existing.update()
  }

  const monitoring = new db.Monitoring();
  monitoring.date = date;
  monitoring.means = means;
  return await monitoring.save()
}
