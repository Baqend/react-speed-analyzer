import { EntityManager } from 'baqend';
import { BulkTest, TestOverview } from 'baqend/commonjs/lib/model';
import { Request, Response } from 'express';
import { iterateQuery, extractOrigin, processOrigin } from './_helpers';

interface DomainStatus {
  [status: string]: number;
}

interface SortedDomain {
  domain: string;
  count: number;
  statuses: DomainStatus;
}

const EXCLUDED_DOMAINS = [
  'kicker.de',
  'plesk.com',
  'speed-kit-test.com'
];

/**
 * Fetches all test overview IDs within bulk tests for the specified date range.
 *
 * @param {EntityManager} db - The database entity manager.
 * @param {Date} startDate - The start date of the range.
 * @param {Date} endDate - The end date of the range.
 * @returns {Promise<Set<string>>} - A promise that resolves to a set of test overview IDs.
 */
async function fetchAllTestOverviewIdsFromBulkTests(
  db: EntityManager,
  startDate: Date,
  endDate: Date
): Promise<Set<string>> {
  const builder = db.BulkTest.find()
    .greaterThanOrEqualTo('createdAt', startDate)
    .lessThan('createdAt', endDate)

  const result = await iterateQuery<BulkTest>(db, builder);
  return new Set(result.flatMap((bulkTest: BulkTest) => bulkTest.testOverviews.map((overview: TestOverview) => overview.id!)));
}

/**
 * Fetches all test overview entries within the specified date range.
 *
 * @param {EntityManager} db - The database entity manager.
 * @param {Date} startDate - The start date of the range.
 * @param {Date} endDate - The end date of the range.
 * @returns {Promise<TestOverview[]>} - A promise that resolves to an array of test overviews.
 */
async function fetchAllTestOverviews(
  db: EntityManager,
  startDate: Date,
  endDate: Date
): Promise<TestOverview[]> {
  const builder = db.TestOverview.find()
    .greaterThanOrEqualTo('createdAt', startDate)
    .lessThan('createdAt', endDate)

  return await iterateQuery<TestOverview>(db, builder);
}

/**
 * Calculates the domain status from an array of test overviews.
 *
 * @param {TestOverview[]} testOverviews - An array of test overviews.
 * @returns {SortedDomain[]} - An array of sorted domains with their counts and statuses.
 */
function calculateDomainStatus(testOverviews: TestOverview[]): SortedDomain[] {
  const domainStatusCount: Record<string, { count: number, statuses: Record<string, number> }> = {};

  testOverviews.forEach(entry => {
    const origin = extractOrigin(entry.url);
    const processedOrigin = processOrigin(origin);
    if (processedOrigin && !EXCLUDED_DOMAINS.includes(processedOrigin)) {
      if (!domainStatusCount[origin]) {
        domainStatusCount[origin] = { count: 0, statuses: {} };
      }
      domainStatusCount[origin].count += 1;
      domainStatusCount[origin].statuses[entry.status] = (domainStatusCount[origin].statuses[entry.status] || 0) + 1;
    }
  });

  return Object.entries(domainStatusCount)
    .map(([domain, { count, statuses }]) => ({ domain, count, statuses }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Handles the HTTP GET request to generate a test overview report.
 *
 * @param {EntityManager} db - The database entity manager.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
export async function get(db: EntityManager, req: Request, res: Response): Promise<void> {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;

    // add one hour to the BulkTest query to equalize delays
    const startDateForBulkTests = new Date(endDate.getTime() - ((hours + 1) * 3_600_000));
    const startDateForTestOverviews = new Date(endDate.getTime() - (hours * 3_600_000));

    const excludedIdsSet = await fetchAllTestOverviewIdsFromBulkTests(db, startDateForBulkTests, endDate);
    const allTestOverviews = await fetchAllTestOverviews(db, startDateForTestOverviews, endDate);
    const testOverviews = allTestOverviews.filter(overview => !excludedIdsSet.has(overview.id!));
    const sortedDomains = calculateDomainStatus(testOverviews);

    res.status(200).send({
      endDate: endDate.toISOString(),
      hours,
      sortedDomains
    });
  } catch (error) {
    res.status(500).send({
      message: 'An error occurred while generating the report.',
      error: (error as Error).message
    });
  }
}
