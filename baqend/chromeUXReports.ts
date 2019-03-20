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
const METRICS: string[] = ['firstContentfulPaint', 'firstPaint', 'domContentLoaded', 'onLoad'];

/**
 * Sends query to Google BigQuery
 * @param db
 * @param sqlQuery
 * @returns
 */
async function asyncQuery(db: baqend, sqlQuery: string): Promise<any> {
  // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
  const options = {
    query: sqlQuery,
    useLegacySql: false, // Use standard SQL syntax for queries.
  };

  let job;

  // Runs the query as a job
  try {
    const results = await BIG_QUERY.createQueryJob(options);
    job = results[0];
    db.log.info(`Job ${job.id} started.`);

    await job.promise();
    const metadata = await job.getMetadata();
    // Check the job's status for errors
    const errors = metadata[0].status.errors;
    if (errors && errors.length > 0) {
      throw errors;
    }

    db.log.info(`Job ${job.id} completed.`);
    const jobResults = await job.getQueryResults();
    db.log.info('Job Result', jobResults);
    return jobResults[0];
  } catch (err) {
    db.log.error('ERROR:', err);
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
async function queryHistograms(db: baqend, metric: string, data: ChromeUXReportQueryData): Promise<any> {
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

  db.log.info(`Start Chrome User Experience Report for ${data.origin}`, {month: data.month, year: data.year});

  return await asyncQuery(db, query)
}

/**
 * Calculates the median for the given histogram
 * @param histogram The given histogram
 * @param totalDensity The total density reflects the share of a given form factor
 * @returns
 */
function calculateMedian(histogram: model.ChromeUXReportData[], totalDensity: number): number {
  let result: number = 0;

  let cumulativeDistribution = 0;
  for (const {start, density} of histogram) {
    cumulativeDistribution = cumulativeDistribution + density;
    if (cumulativeDistribution / totalDensity >= 0.5) {
      result = start;
      break;
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
  let dataResult = await getOrigin(db, data);

  // if there is still no data return null
  if ((!dataResult || !dataResult.length)) {
    return null;
  }

  // if there is only one solution and it's valid, return it
  if (dataResult.length === 1 && dataResult[0].is_valid) {
    return dataResult[0].origin;
  }

  let chosedOrigin = dataResult.filter((result: any) => new URL(result.origin).protocol === 'https:' && result.is_valid)[0].origin;

  // choose the origin which matches most to the queried url
  const queriedUrl = new URL(data.url);
  const containsWww = /www\./.test(queriedUrl.hostname);
  dataResult.forEach((result: any) => {
    const sameProtocol = new URL(result.origin).protocol === queriedUrl.protocol;
    const sameOrigin = /www\./.test(new URL(result.origin).hostname) === containsWww;
    if (sameProtocol && sameOrigin && result.is_valid) {
      chosedOrigin = result.origin;
    }
  });

  // else return https and valid result
  return chosedOrigin;
}

/**
 * Looks for an existing entry in BBQ if the query has been already made.
 *
 * @param db
 * @param data
 * @returns {Promise<T>}
 */
async function loadExisting(db: baqend, data: QueriedParams): Promise<model.ChromeUXReport> {
  let {url, month, year} = data;
  const host = new URL(url).host;
  db.log.info('url to look for', url);

  const result = await db.ChromeUXReport.find()
    .matches('url', '^.*' + host)
    .equal('month', month)
    .equal('year', year)
    .equal('device', 'all')
    .singleResult();
  return result;
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
  let totalDensity = 0;
  for (const object of histogram) {
    totalDensity = totalDensity + object.density;
  }

  return totalDensity;
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
  let { url, month, year } = params;

  if (!url || !month || !year) {
    res.status(400);
    res.send({error: 'Please be sure that either domain, month and year is given.'});
  }

  // first check if there is an existing entry with the given url
  const existing = await loadExisting(db, params);
  if (existing) {
    res.status(400);
    res.send({message: 'The queried data for ' + existing.url + ' (' + existing.month + '/' + existing.year + ') already exist.'});
    return;
  }

  // params.month holds the manipulated month for querying data from Google
  params.month = `0${params.month}`.slice(-2);
  // Find origin in Chrome User Experience Report to avoid multiple queries for the same url
  const origin = await getOriginFromReports(db, params);
  const reports: model.ChromeUXReport[] = DEVICES.map((device) => {
    const report = new db.ChromeUXReport({
      url: origin ? origin : url,
      month,
      year,
      device,
      status: origin ? 'RUNNING' : 'FAILED'
    });

    report.insert();
    return report;
  });

  if (!origin) {
    res.status(400);
    res.send({message: 'There is no data for the given domain ' + url + '.'});
    return;
  }

  const queryData: ChromeUXReportQueryData = {url, month: params.month, year, origin};

  // Single queries are faster but a bit more expensive than one query for all metrics
  const fcpHistogramData: any[] = await queryHistograms(db, 'first_contentful_paint', queryData);
  const fpHistogramData: any[] = await queryHistograms(db, 'first_paint', queryData);
  const dclHistogramData: any[] = await queryHistograms(db, 'dom_content_loaded', queryData);
  const olHistogramData: any[] = await queryHistograms(db, 'onload', queryData);
  // return: {start, device [all, desktop, phone, tablet], density}

  const histogramData: [string, any[]][] = [
    ['firstContentfulPaint', fcpHistogramData],
    ['firstPaint', fpHistogramData],
    ['domContentLoaded', dclHistogramData],
    ['onLoad', olHistogramData],
  ];

  const medians: { [key: string]: string } = {};
  medians['firstContentfulPaint'] = 'fcpMedian';
  medians['firstPaint'] = 'fpMedian';
  medians['domContentLoaded'] = 'dclMedian';
  medians['onLoad'] = 'olMedian';

  // goal: { desktop: {start, density}[], phone: ChromeUXReportData[], ... }
  for (const report of reports) {
    if (!fcpHistogramData.length && !fpHistogramData && !dclHistogramData && !olHistogramData) {
      report.status = 'FAILED';
      report.save();
      res.status(400);
      res.send({message: 'The queried domain ' + report.url + ' (' + report.month + '/' + report.year + ') could not be analyzed.'});
      return;
    }

    const device: string = report.device;
    for (const [key, histogram] of histogramData) {
      report[key] = histogram.filter((histogram: ChromeUXReportFromQuery) => {
        if (histogram.device === device) {
          return true;
        }
      }).map((histogram: ChromeUXReportFromQuery) => {
        const chromeUXReportData = new db.ChromeUXReportData();
        chromeUXReportData.start = histogram.start;
        chromeUXReportData.density = histogram.density;
        return chromeUXReportData as model.ChromeUXReportData;
      });
      // calculate totalDensity
      const totalDensity = calculateTotalDensity(report[key]);
      report.totalDensity = totalDensity;
      report[medians[key]] = calculateMedian(report[key], totalDensity);
    }

    if (!report.firstContentfulPaint.length && !report.firstPaint.length && !report.domContentLoaded.length && !report.onLoad.length) {
      report.status = 'FAILED';
      report.save();
      res.status(400);
      res.send({message: 'The queried domain could not be analyzed.'});
      return;
    }

    report.status = 'SUCCESS';
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
