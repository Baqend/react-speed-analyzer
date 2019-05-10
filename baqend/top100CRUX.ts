import {baqend} from 'baqend'
import {Request, Response} from 'express'
import {fetchCruxReport, ResponseMessage} from "./chromeUXReports";

interface QueriedParams {
  url: string;
  year: number,
  month: number | string,
}

const TOP_100 = [
  'https://www.amazon.de',
  'https://www.otto.de',
  'https://www.zalando.de',
  'https://www.notebooksbilliger.de',
  'https://www.bonprix.de',
  'https://www.mediamarkt.de',
  'https://www.cyberport.de',
  'https://www.conrad.de',
  'https://www.tchibo.de',
  'https://www.alternate.de',
  'https://www.hm.com/de/',
  'https://m2.hm.com',
  'https://www.apple.com/de',
  'https://www.saturn.de',
  'https://www.docmorris.de',
  'https://www.thomann.de',
  'https://www.mindfactory.de',
  'https://www.zooplus.de',
  'https://www.ikea.com/de/de/',
  'https://www.qvc.de',
  'https://www.lidl.de',
  'https://shop.degussa-goldhandel.de',
  'https://www.douglas.de',
  'https://www.home24.de',
  'https://www.medion.com/de/',
  'https://www.klingel.de',
  'https://www.soliver.de',
  'https://www.pearl.de',
  'https://www.voelkner.de',
  'https://www.amazon.com',
  'https://www.thalia.de',
  'https://www.comtech.de',
  'https://www.sportscheck.com',
  'https://www.hellofresh.de',
  'https://www.westfalia.de',
  'https://www.shop-apotheke.com',
  'https://www.hse24.de',
  'https://auragentum.de',
  'https://www.limango.de',
  'https://www.reifendirekt.de',
  'https://www.bader.de',
  'https://www.breuninger.com',
  'https://www.reuter.de',
  'https://www.hagebau.de',
  'https://m.hagebau.de/',
  'https://www.edelmetall-handel.de',
  'https://www.aboutyou.de',
  'https://m.aboutyou.de',
  'https://www.brands4friends.de',
  'https://www.jako-o.com',
  'https://www.medikamente-per-klick.de',
  'https://www.medpex.de',
  'https://www.heine.de',
  'https://www.galeria-kaufhof.de',
  'https://www.kfzteile24.de',
  'https://www.vente-privee.com',
  'https://shop.rewe.de',
  'https://www.medimops.de',
  'https://www.schwab.de',
  'https://www.druckerzubehoer.de',
  'https://www.europa-apotheek.com',
  'https://www.computeruniverse.net',
  'https://store.hp.com',
  'https://www.dell.com',
  'https://www.eis.de',
  'https://www.baby-walz.de',
  'https://www.zalando-lounge.de',
  'https://www.weltbild.de',
  'https://www.asos.de',
  'https://www.hornbach.de',
  'https://www.rebuy.de',
  'https://www.aliexpress.com',
  'https://m.de.aliexpress.com',
  'https://www.apo-rot.de',
  'https://www.reichelt.de',
  'https://www.obi.de',
  'https://www.real.de',
  'https://www.c-and-a.com',
  'https://www.ao.de',
  'https://www.karstadt.de',
  'https://www.casando.de',
  'https://www.misterspex.de',
  'https://m.misterspex.de',
  'https://shop.apotal.de',
  'https://www.elektroshopwagner.de',
  'https://www.gearbest.com',
  'https://www.happy-size.de',
  'https://www.emp.de',
  'https://www.mytheresa.com',
  'https://www.flaconi.de',
  'https://www.witt-weiden.de',
  'https://www.peterhahn.de',
  'https://www.sanicare.de',
  'https://www.posterxxl.de',
  'https://www.atp-autoteile.de',
  'https://www.jacob.de',
  'https://www.pollin.de',
  'https://www.esprit.de',
  'https://www.bett1.de',
  'https://www.adidas.de',
  'https://www.dm.de',
  'https://www.babymarkt.de',
  'https://www.fressnapf.de',
  'https://www.buecher.de'
];

/**
 * Extracts CrUX report results for the given list of urls.
 *
 * @param db
 * @param month
 * @param year
 * @param device
 * @returns List of results as tab-formatted string.
 */
async function getFormattedResults(db: baqend, month: number, year: number, device: string) {
  let formattedResult = '';

  for (const url of TOP_100) {
    const report = await db.ChromeUXReport.find()
      .equal('url', url)
      .equal('month', month)
      .equal('year', year)
      .equal('device', device)
      .singleResult();
    if (report.status === 'SUCCESS') {
      formattedResult += `${report.url}\t`;
      formattedResult += `${report.fcpMedian}\t`;
      formattedResult += `${report.fpMedian}\t`;
      formattedResult += `${report.dclMedian}\t`;
      formattedResult += `${report.olMedian}\n`;
    }
  };

  return formattedResult;
}

/**
 * Checks if CrUX report for the given parameters is processed completely.
 *
 * @param db
 * @param params
 */
async function checkStatus(db: baqend, params: QueriedParams) {
  const reports = await db.ChromeUXReport.find()
    .equal('url', params.url)
    .equal('month', params.month)
    .equal('year', params.year)
    .resultList();
  for(const report of reports) {
    if (report.status && report.status === 'RUNNING') {
      return false;
    }
  }
  return true;
}

/**
 * Starts fetching of CrUX reports for the given list of urls.
 *
 * @param db
 * @param month
 * @param year
 */
async function fetchCruxReports(db: baqend, month: number, year: number): Promise<void> {
  for(const url of TOP_100) {
    const params: QueriedParams = { url, month, year };
    const responseMessage = await fetchCruxReport(db, params);
    if (responseMessage === ResponseMessage.Success) {
      await cruxFinished(db, params);
      db.clear();
    }
  }
}

/**
 * Periodically checks whether a specified CrUX report ist finished.
 *
 * @param db
 * @param params
 */
function cruxFinished(db: baqend, params: QueriedParams): Promise<boolean> {
  return new Promise((resolve) => {
    let retry = 0;
    const interval = setInterval(async () => {
      const done = await checkStatus(db, params);
      if(done){
        clearInterval(interval);
        resolve(done);
      }
      if(retry >= 6) {
        clearInterval(interval);
        resolve(false);
      }
      retry++;
    },10000);
  });
}

/**
 * post interface to start fetching Chrome User Experience Reports for top 100.
 *
 * @param db
 * @param request
 * @param response
 */
export async function post(db: baqend, request: Request, response: Response) {
  const { month, year } = request.body;
  fetchCruxReports(db, month, year);

  response.send( {message: 'Started fetching ChromeUX reports.'});
}

/**
 * get interface to extract Chrome User Experience Report results for top 100.
 * @param db
 * @param request
 * @param response
 */
export async function get(db: baqend, request: Request, response: Response) {
  const month = request.query.month;
  const year = request.query.year;
  const device = request.query.device;

  if(month && year && device){
    const formattedResults = await getFormattedResults(db, Number.parseInt(month), Number.parseInt(year), device);
    response.send(formattedResults);
  } else {
    response.send({message: 'Please provide month, year and device.'});
  }
}
