import { EntityManager } from 'baqend';
import { BulkTest, TestOverview } from 'baqend/commonjs/lib/model';
import { Request, Response } from 'express';

interface DomainStatus {
  [status: string]: number;
}

interface SortedDomain {
  domain: string;
  count: number;
  statuses: DomainStatus;
}

const EXCLUDED_DOMAINS = [
  "kicker.de",
  "plesk.com",
  "speed-kit-test.com"
];

/**
 * Extracts the origin from a given URL.
 * 
 * @param {string} url - The URL to extract the origin from.
 * @returns {string} - The extracted origin.
 */
function extractOrigin(url: string): string {
  try {
    const { origin } = new URL(url);
    return origin;
  } catch {
    return url;
  }
}

/**
 * Strips the protocol and 'www.' from a given origin.
 * 
 * @param {string} origin - The origin to process.
 * @returns {string} - The processed origin.
 */
function processOrigin(origin: string): string {
  return origin.replace(/(^\w+:|^)\/\//, '').replace(/^www\./, '');
}

/**
 * Fetches all test overview IDs within bulk tests for the specified date range.
 * 
 * @param {EntityManager} db - The database entity manager.
 * @param {Date} startDate - The start date of the range.
 * @param {Date} endDate - The end date of the range.
 * @returns {Promise<string[]>} - A promise that resolves to an array of test overview IDs.
 */
async function fetchAllTestOverviewIdsFromBulkTests(
  db: EntityManager,
  startDate: Date,
  endDate: Date
): Promise<string[]> {
  const testOverviewIds: string[] = [];
  const limit = 500;
  let lastCreatedAt = startDate;

  while (true) {
    const batch: BulkTest[] = await db.BulkTest.find()
      .greaterThanOrEqualTo('createdAt', lastCreatedAt)
      .lessThan('createdAt', endDate)
      .limit(limit)
      .ascending('createdAt')
      .resultList();

    if (batch.length === 0) break;

    for (const bulkTest of batch) {
      testOverviewIds.push(...bulkTest.testOverviews.map((overview: TestOverview) => overview.id).filter((id): id is string => id !== null));
    }

    const lastCreatedAtDate = batch[batch.length - 1].createdAt;
    if (lastCreatedAtDate) {
      lastCreatedAt = new Date(new Date(lastCreatedAtDate).getTime() + 1);
    } else {
      break;
    }
  }

  return [...new Set(testOverviewIds)];
}

/**
 * Fetches test overview entries within the specified date range, excluding the specified IDs.
 * 
 * @param {EntityManager} db - The database entity manager.
 * @param {Date} startDate - The start date of the range.
 * @param {Date} endDate - The end date of the range.
 * @param {string[]} excludedIds - An array of IDs to exclude.
 * @returns {Promise<TestOverview[]>} - A promise that resolves to an array of test overviews.
 */
async function fetchTestOverviews(
  db: EntityManager,
  startDate: Date,
  endDate: Date,
  excludedIds: string[]
): Promise<TestOverview[]> {
  const testOverviews: TestOverview[] = [];
  const limit = 500;
  let lastCreatedAt = startDate;

  while (true) {
    const batch = await db.TestOverview.find()
      .greaterThanOrEqualTo('createdAt', lastCreatedAt)
      .lessThan('createdAt', endDate)
      .notIn('id', excludedIds)
      .limit(limit)
      .ascending('createdAt')
      .resultList();

    if (batch.length === 0) break;
    testOverviews.push(...batch);

    const lastCreatedAtDate = batch[batch.length - 1].createdAt;
    if (lastCreatedAtDate) {
      lastCreatedAt = new Date(new Date(lastCreatedAtDate).getTime() + 1);
    } else {
      break;
    }
  }

  return testOverviews;
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
 * Handles the HTTP POST request to generate a test overview report.
 * 
 * @param {EntityManager} db - The database entity manager.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
export async function post(db: EntityManager, req: Request, res: Response): Promise<void> {
  try {
    let { body } = req;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    
    const endDate = body?.endDate ? new Date(body.endDate) : new Date();
    const hours = body?.hours ?? 48;
    const startDate = new Date(endDate.getTime() - (hours * 3_600_000));

    const testOverviewIds = await fetchAllTestOverviewIdsFromBulkTests(db, startDate, endDate);
    const testOverviews = await fetchTestOverviews(db, startDate, endDate, testOverviewIds);
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
