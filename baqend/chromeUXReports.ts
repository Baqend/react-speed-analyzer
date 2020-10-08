// Imports the Google Cloud client library.
import {BigQuery} from '@google-cloud/bigquery';
import {URL} from 'url';
import credentials from './credentials';
import {baqend, model} from "baqend";
import {Request, Response} from 'express'

interface QueriedParams {
  url: string;
  year: number,
  month: number | string,
}

interface ChromeUXReportQueryData extends QueriedParams {
  origin: string;
}

interface ChromeUXReportFromQuery extends model.ChromeUXReportData {
  device: string;
}

const BIG_QUERY = new BigQuery({
  projectId: "baqend-1217",
  credentials: credentials.bigQueryCredentials
});

const DEVICES = ['all', 'desktop', 'tablet', 'phone'];
const METRICS: string[] = ['firstContentfulPaint', 'firstPaint', 'domContentLoaded', 'onLoad', 'ttfb'];
const MEDIAN_NAME_MAPPING: Map<string, string> = new Map([
  [METRICS[0], 'fcpMedian'],
  [METRICS[1], 'fpMedian'],
  [METRICS[2], 'dclMedian'],
  [METRICS[3], 'olMedian'],
  [METRICS[4], 'ttfbMedian'],
]);

/**
 * Sends query to Google BigQuery
 * @param db
 * @param sqlQuery
 * @returns
 */
async function asyncQuery(db: baqend, sqlQuery: string): Promise<any | null> {
  // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
  const options = {
    query: sqlQuery,
    useLegacySql: false, // Use standard SQL syntax for queries.
  };

  // Runs the query as a job
  try {
    const results = await BIG_QUERY.createQueryJob(options);
    const job = results[0];
    db.log.info(`Job ${job.id} started.`);

    await job.promise();
    const metadata = await job.getMetadata();
    // Check the job's status for errors
    const errors = metadata[0].status.errors;
    if (errors && errors.length > 0) {
      db.log.error('ERROR:', errors);
      return null;
    }

    db.log.info(`Job ${job.id} completed.`);
    const jobResults = await job.getQueryResults();
    db.log.info('Job Result', jobResults);
    return jobResults[0];
  } catch (err) {
    db.log.error('ERROR:', err);
    return null;
  }
}

/**
 * Queries data from BigQuery
 *
 * @param db
 * @param metric
 * @param data
 * @returns
 */
async function queryHistograms(db: baqend, metric: string, data: ChromeUXReportQueryData): Promise<any[] | null> {
  const query =
    "SELECT " +
    "bin.start AS start, " +
    "'all' AS device, " +
    "SUM(bin.density) AS density " +
    "FROM " +
    "`chrome-ux-report.all." + data.year + data.month + "`, " +
    "UNNEST(" + metric + ".histogram.bin) AS bin " +
    "WHERE origin = '" + data.origin + "'" +
    "GROUP BY start " +
    "UNION ALL " +
    "SELECT " +
    "bin.start AS start, " +
    "form_factor.name AS device, " +
    "SUM(bin.density) AS density " +
    "FROM " +
    "`chrome-ux-report.all." + data.year + data.month + "`, " +
    "UNNEST(" + metric + ".histogram.bin) AS bin " +
    "WHERE origin = '" + data.origin + "' " +
    "GROUP BY start, device " +
    "ORDER BY start, device";

  db.log.info(`Start Chrome User Experience Report for ${data.origin}`, {month: data.month, year: data.year, metric});

  return await asyncQuery(db, query)
}

/**
 * Calculates the median for the given histogram
 * @param histogram The given histogram
 * @param totalDensity The total density reflects the share of a given form factor
 * @returns
 */
function calculateMedian(histogram: model.ChromeUXReportData[], totalDensity: number): number {
  let result = 0;
  let cumulativeDistribution = 0;
  const medianDensity = totalDensity * 0.5;

  for (let i = 0; i < histogram.length - 1; i++) {
    const bucketDensity = histogram[i].density;
    const densityBeforeBucket = cumulativeDistribution;
    const densityAfterBucket = cumulativeDistribution + bucketDensity;
    cumulativeDistribution = densityAfterBucket;

    if (cumulativeDistribution >= medianDensity) {
      const binStart = histogram[i].start;
      const binSize = histogram[i + 1].start - binStart;
      const densityTillMedian = medianDensity - densityBeforeBucket;

      return Math.round(binStart + binSize * (densityTillMedian / bucketDensity));
    }
  }
  return result;
}

/**
 * Queries possible origins from Google's Big Query.
 *
 * @param db
 * @param data
 */
async function getOrigin(db: baqend, data: QueriedParams): Promise<any> {
  const host = new URL(data.url).host;
  db.log.info('query origin for host:', host);
  const query =
    "SELECT DISTINCT origin," +
    "REGEXP_CONTAINS(origin, r'^[https?:\\/\\/]*(w{0}|w{3}[.])?" + host + "') as is_valid " +
    "FROM `chrome-ux-report.all." + data.year + data.month + "` " +
    "WHERE origin LIKE '%" + host + "'";

  db.log.info(`Find origin in Chrome UX Reports for ${data.url}`, {month: data.month, year: data.year});
  return asyncQuery(db, query);
}

/**
 * Gets the origin from BigQuery to ensure available data.
 *
 * @param db
 * @param  data
 * @returns origin or null, if queried url does not exist
 */
async function getOriginFromReports(db: baqend, data: QueriedParams): Promise<string | null> {
  const dataResult = await getOrigin(db, data);

  // if there is still no data return null
  if (!dataResult) {
    return null;
  }

  // if there is only one solution and it's valid, return it
  if (dataResult.length === 1 && dataResult[0].is_valid) {
    return dataResult[0].origin;
  }

  let chooseOrigin = dataResult.filter((result: any) => new URL(result.origin).protocol === 'https:' && result.is_valid)[0].origin;

  // choose the origin which matches most to the queried url
  const queriedUrl = new URL(data.url);
  const containsWww = /www\./.test(queriedUrl.hostname);
  dataResult.forEach((result: any) => {
    const sameProtocol = new URL(result.origin).protocol === queriedUrl.protocol;
    const sameOrigin = /www\./.test(new URL(result.origin).hostname) === containsWww;
    if (sameProtocol && sameOrigin && result.is_valid) {
      chooseOrigin = result.origin;
    }
  });

  // else return https and valid result
  return chooseOrigin;
}

/**
 * Looks for an existing entry in BBQ if the query has been already made.
 *
 * @param db
 * @param data
 * @returns {Promise<T>}
 */
async function loadExisting(db: baqend, data: QueriedParams): Promise<model.ChromeUXReport | null> {
  const {url, month, year} = data;
  const host = new URL(url).host;
  db.log.info('url to look for', url);

  return db.ChromeUXReport.find()
    .matches('url', '^.*' + host)
    .equal('month', month)
    .equal('year', year)
    .equal('device', 'all')
    .singleResult();
}

/**
 * Normalizes the queried report to the given total density.
 *
 * @param db
 * @param report
 * @returns The normalized report
 */
function normalizeReport(db: baqend, report: model.ChromeUXReport): model.ChromeUXReport {
  const totalDensity = report.totalDensity;

  for (const key of METRICS) {
    report[key] = report[key].map((element: model.ChromeUXReportData) => {
      const data = new db.ChromeUXReportData();
      data.start = element.start;
      data.density = totalDensity !== 0 ? element.density / totalDensity : element.density;
      return data as model.ChromeUXReportData;
    });
  }

  return report;
}

/**
 * Calculates the total density of a report with a given device.
 *
 * @param histogram
 */
function calculateTotalDensity(histogram: model.ChromeUXReportData[]): number {
  return histogram.reduce((acc, cur) => acc + cur.density, 0);
}

/**
 * Queries a Chrome User Experience Report
 *
 * @param db
 * @param req
 * @param res
 */
exports.post = async function (db: baqend, req: Request, res: Response) {
  const params: QueriedParams = req.body;
  const { url, month, year } = params;

  if (!url || !month || !year) {
    res.status(400);
    res.send({error: 'Please be sure that either domain, month and year is given.'});
  }

  // first check if there is an existing entry with the given url
  const existing = await loadExisting(db, params);
  if (existing) {
    res.status(400);
    res.send({message: `The queried data for ${existing.url} (${existing.month}/${existing.year}) already exist.`});
    return;
  }

  // params.month holds the manipulated month for querying data from Google
  params.month = `0${params.month}`.slice(-2);
  // Find origin in Chrome User Experience Report to avoid multiple queries for the same url
  const origin = await getOriginFromReports(db, params);

  if (!origin) {
    res.status(400);
    res.send({message: `There is no data for the given domain ${url}.`});
    return;
  }

  const reports: model.ChromeUXReport[] = await Promise.all(DEVICES.map((device) => {
    const report = new db.ChromeUXReport({
      url: origin,
      month,
      year,
      device,
      status: 'RUNNING'
    });

    return report.save();
  }));

  const queryData: ChromeUXReportQueryData = {url, month: params.month, year, origin};

  // Single queries are faster but a bit more expensive than one query for all metrics
  const fcpHistogramData = await queryHistograms(db, 'first_contentful_paint', queryData);
  const fpHistogramData = await queryHistograms(db, 'first_paint', queryData);
  const dclHistogramData = await queryHistograms(db, 'dom_content_loaded', queryData);
  const olHistogramData = await queryHistograms(db, 'onload', queryData);
  const ttfbHistogramData = await queryHistograms(db, 'experimental.time_to_first_byte', queryData);
  // return: {start, device [all, desktop, phone, tablet], density}

  if (!fcpHistogramData || !fpHistogramData || !dclHistogramData || !olHistogramData || !ttfbHistogramData) {
    await Promise.all(reports.map(report => report.partialUpdate().set('status', 'FAILED').execute()));

    res.status(400);
    res.send({
      message: `The queried domain ${url} (${month}/${year}) could not be analyzed.`,
    });
    return;
  }

  const histogramData: Map<string, any[]> = new Map();
  histogramData.set('firstContentfulPaint', fcpHistogramData);
  histogramData.set('firstPaint', fpHistogramData);
  histogramData.set('domContentLoaded', dclHistogramData);
  histogramData.set('onLoad', olHistogramData);
  histogramData.set('ttfb', ttfbHistogramData);

  // goal: { desktop: {start, density}[], phone: ChromeUXReportData[], ... }
  for (const report of reports) {
    histogramData.forEach((histogram, metric) => {
      report[metric] = histogram.filter(histogram => histogram.device === report.device)
        .map((histogram: ChromeUXReportFromQuery) => {
          return new db.ChromeUXReportData({
            start: histogram.start,
            density: histogram.density,
          });
        });

      // calculate totalDensity
      report.totalDensity = calculateTotalDensity(report[metric]);
      const medianName = MEDIAN_NAME_MAPPING.get(metric) as string;
      report[medianName] = calculateMedian(report[metric], report.totalDensity);
    });

    const isFailed =
      !report.firstContentfulPaint.length ||
      !report.firstPaint.length ||
      !report.domContentLoaded.length ||
      !report.onLoad.length ||
      !report.ttfb.length;

    report.status = isFailed ? 'FAILED' : 'SUCCESS';
    await report.save();

    if (report.device !== 'all') {
      const normalizedReport = normalizeReport(db, report);
      await normalizedReport.save();
    }
  }
  res.status(200);
  res.send({message: 'The queried domain was analyzed successfully.'});
  return;
};
