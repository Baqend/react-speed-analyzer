import { Status } from './_Status'
import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { generateHash, getDateString } from './_helpers'
import { BulkTestParams, startBulkComparison } from './startBulkComparison'

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
  'https://www.edelmetall-handel.de',
  'https://www.aboutyou.de',
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
  'https://www.apo-rot.de',
  'https://www.reichelt.de',
  'https://www.obi.de',
  'https://www.real.de',
  'https://www.c-and-a.com',
  'https://www.ao.de',
  'https://www.karstadt.de',
  'https://www.casando.de',
  'https://www.misterspex.de',
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
  'https://www.buecher.de',
]

function getFMP(testResult: model.TestResult, def: number = -1) {
  if (!testResult.firstView) {
    return def;
  }

  return testResult.firstView.firstMeaningfulPaint;
}

function getFormattedResults(db: baqend, multiComparisons: model.BulkTest[]) {
  let formattedResult = '';

  multiComparisons.forEach(multiComparison => {
    if (multiComparison.status !== Status.SUCCESS) {
      return;
    }

    const sortedOverviews = multiComparison.testOverviews.sort((testOverview1: model.TestOverview, testOverview2: model.TestOverview) => {
      const comp1 = getFMP(testOverview1.competitorTestResult);
      const sk1 = getFMP(testOverview1.speedKitTestResult);
      const comp2 = getFMP(testOverview2.competitorTestResult);
      const sk2 = getFMP(testOverview2.speedKitTestResult);

      const uplift1 = comp1 / sk1;
      const uplift2 = comp2 / sk2;

      if (uplift1 < -1) {
        return 1;
      }

      if (uplift2 < -1) {
        return -1;
      }

      return uplift2 - uplift1;
    })

    formattedResult += `${multiComparison.url}\t`;

    // FMP Median Competitor
    const fmpMedianCompetitor = sortedOverviews[1].competitorTestResult.firstView!.firstMeaningfulPaint
    // FMP Median SpeedKit
    const fmpMedianSpeedKit = sortedOverviews[1].speedKitTestResult.firstView!.firstMeaningfulPaint
    // SI Median Competitor
    const siMedianCompetitor = sortedOverviews[1].competitorTestResult.firstView!.speedIndex
    // SI Median SpeedKit
    const siMedianSpeedKit = sortedOverviews[1].speedKitTestResult.firstView!.speedIndex

    formattedResult += `${(fmpMedianCompetitor / fmpMedianSpeedKit).toFixed(2).replace('.', ',')}\t`
    formattedResult += `${(siMedianCompetitor / siMedianSpeedKit).toFixed(2).replace('.', ',')}\t`

    // Uplift
    formattedResult += `${fmpMedianCompetitor - fmpMedianSpeedKit}\t`
    formattedResult += `${siMedianCompetitor - siMedianSpeedKit}\t`

    // FMP
    formattedResult += `${fmpMedianCompetitor}\t`
    formattedResult += `${fmpMedianSpeedKit}\t`

    // SI
    formattedResult += `${siMedianCompetitor}\t`
    formattedResult += `${siMedianSpeedKit}\t`

    const fmpUpliftWithMedian = Math.round(fmpMedianCompetitor - fmpMedianSpeedKit)
    const siUpliftWithMedian = Math.round(siMedianCompetitor - siMedianSpeedKit)

    formattedResult += `${fmpUpliftWithMedian}\t`
    formattedResult += `${siUpliftWithMedian}\n`
  })

  return formattedResult;
}

async function getMultiComparisons(db: baqend, bulkComparisonId: string): Promise<model.BulkTest[]> {
  const bulkComparison = await db.BulkComparison.load(bulkComparisonId);
  const multiComparisons = await Promise.all(
    bulkComparison.multiComparisons.map(async (multiComparison) => {
      return multiComparison.load({ refresh: true })
    })
  );

  return multiComparisons;
}
function buildTestParams(useCustomLocation: boolean = false): BulkTestParams[] {
  const params: BulkTestParams[] = [];
  TOP_100.forEach(url => {
    const defaultParams = { url, runs: 5 };
    const customParams = useCustomLocation ? { location: 'eu-central-1-docker:Chrome.custom' } : {};
    params.push(Object.assign(defaultParams, customParams));
  })

  return params;
}

export async function post(db: baqend, request: Request, response: Response) {
  const { useCustomLocation } = request.body;
  const id = `${getDateString()}-${generateHash()}`
  const testParams = buildTestParams(useCustomLocation);
  startBulkComparison(db,  id, 'top100', testParams);

  response.send({ bulkComparisonId: `/db/BulkComparison/${id}` } );
}

export async function get(db: baqend, request: Request, response: Response) {
  const bulkComparisonId = request.query.bulkComparisonId
  const multiComparisons = await getMultiComparisons(db, bulkComparisonId);
  const formattedResults = getFormattedResults(db, multiComparisons);

  response.send(formattedResults);
}
