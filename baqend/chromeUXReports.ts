// Imports the Google Cloud client library.
import {BigQuery} from '@google-cloud/bigquery';
import {URL} from 'url';

import credentials from './credentials';
import {baqend, model} from "baqend";
import {Request, Response} from 'express'

const bigquery = new BigQuery({
  projectId: "baqend-1217",
  credentials: credentials.bigQueryCredentials
});

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

const devices = ['desktop', 'tablet', 'phone', 'all'];

const metrics: string[] = ['firstContentfulPaint', 'firstPaint', 'domContentLoaded', 'onLoad'];

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
    const results = await bigquery.createQueryJob(options);
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

async function getOrigin(db: baqend, data: QueriedParams): Promise<any> {
  db.log.info('query origin', data.url);
  const query =
    "SELECT DISTINCT origin " +
    "FROM `chrome-ux-report.all." + data.year + data.month + "` " +
    "WHERE origin LIKE '%" + data.url + "'";

  db.log.info(`Find origin in Chrome UX Reports for ${data.url}`, {month: data.month, year: data.year});
  return asyncQuery(db, query);
}

/**
 * Gets the origin from BigQuery to ensure available data
 * @param db
 * @param  data
 * @returns origin or null, if queried url does not exist
 */
async function getOriginFromReports(db: baqend, data: QueriedParams): Promise<string | null> {
  let url = new URL(data.url);
  let host = url.host;
  let addedWww = false;
  // check for subdomain and if there is www
  const match = host.match(/\./g);
  if (match && match.length === 1 && !/^www/.test(host)) {
    data.url = 'www.' + host;
    addedWww = true;
  }

  let dataResult = await getOrigin(db, data);

  // if there is no data, check again without added www
  if (addedWww && (!dataResult || !dataResult.length)) {
    data.url = host.slice(4);
    data.url = '://' + host;
    db.log.info('Second query with another origin', data.url);
    dataResult = await getOrigin(db, data);
  }

  // if there is still no data return null
  if ((!dataResult || !dataResult.length)) {
    return null;
  }

  // choose https if available
  let chosedOrigin = dataResult[0].origin;

  dataResult.forEach((result: any) => {
    const protocol = new URL(result.origin).protocol;
    if (protocol === 'https:') {
      chosedOrigin = result.origin;
    }
  });

  return chosedOrigin;
}

/**
 * Looks for an existing entry in BBQ if the query has been already made
 * @param db
 * @param data
 * @returns {Promise<T>}
 */
async function loadExisting(db: baqend, data: QueriedParams): Promise<model.ChromeUXReport> {
  let {url, month, year} = data;
  url = url.slice(8); // remove https://
  db.log.info('url to look for', url);

  const result = await db.ChromeUXReport.find()
    .matches('url', '^.*' + url)
    .equal('month', month)
    .equal('year', year)
    .equal('device', 'all')
    .singleResult();
  return result;
}

/**
 * Normalizes the queried report to the given total density
 * @param report
 * @returns The normalized report
 */
function normalizeReport(report: model.ChromeUXReport): model.ChromeUXReport {
  const totalDensity = report.totalDensity;

  for (const key of metrics) {
    if (Array.isArray(report[key])) {
      report[key] = report[key].map((element: model.ChromeUXReportData) => {
        return {
          start: element.start,
          density: element.density / totalDensity
        }
      });
    }
  }

  return report;
}

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
  db.log.info('month', params.month);
  // Find origin in Chrome User Experience Report to avoid multiple queries for the same url
  const origin = await getOriginFromReports(db, params);

  const reports: model.ChromeUXReport[] = devices.map((device) => {
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
        return {start: histogram.start, density: histogram.density} as model.ChromeUXReportData;
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
      const normalizedReport = normalizeReport(report);
      await normalizedReport.save();
    }
  }
  res.status(200);
  res.send({message: 'The queried domain was analyzed successfully.'});
  return;
};
