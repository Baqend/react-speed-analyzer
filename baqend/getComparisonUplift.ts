import { baqend } from 'baqend'
import { Request, Response } from 'express'

interface MetricDiff {
  competitor: number,
  speedKit: number,
  diff: number
}

interface ComparisonUplift {
  fmp: MetricDiff,
  speedIndex: MetricDiff
}

async function getComparisonUplift(db: baqend, comparisonId: string): Promise<ComparisonUplift> {
  const comparison = await db.TestOverview.load(comparisonId, { depth: 1 });
  if (!comparison) {
    throw new Abort('No comparison could be found for the specified id.')
  }

  const competitorTestResults = comparison.competitorTestResult.firstView;
  const speedKitTestResults = comparison.speedKitTestResult.firstView;
  if (competitorTestResults === null || speedKitTestResults === null) {
    throw new Abort('The result of the comparison is not valid.')
  }

  const fmpDiff = competitorTestResults.firstMeaningfulPaint - speedKitTestResults.firstMeaningfulPaint;
  const speedIndexDiff = competitorTestResults.speedIndex - speedKitTestResults.speedIndex;

  return {
    fmp: {
      competitor: competitorTestResults.firstMeaningfulPaint,
      speedKit: speedKitTestResults.firstMeaningfulPaint,
      diff: fmpDiff
    },
    speedIndex: {
      competitor: competitorTestResults.firstMeaningfulPaint,
      speedKit: speedKitTestResults.firstMeaningfulPaint,
      diff: speedIndexDiff
    },
  }
}

/**
 * GET: Get latest successful comparison of a given domain.
 */
export async function get(db: baqend, request: Request, response: Response) {
  const { query: { comparisonId } } = request

  if (!comparisonId) {
    throw new Abort('You have to provide a "comparisonId" query parameter.')
  }

  response.send(await getComparisonUplift(db, comparisonId))
}
