import { Status } from './_Status'
import { baqend, model } from 'baqend'
import { Request, Response } from 'express'
import { generateHash, getDateString } from './_helpers'
import { BulkTestParams, startBulkComparison } from './startBulkComparison'

const TOP_100 = [
  'https://spryker.com',
  'https://www.prym.com/',
  'https://www.mytheresa.com/',
  'https://www.simplicity.ag/',
  'https://de.someday-fashion.com/',
  'https://de.opus-fashion.com/',
  'https://www.eigensonne.de/',
  'https://www.durst.shop/',
  'http://www.fondofbags.com/',
  'https://tecar-reifen.de/',
  'https://www.hilti.de/',
  'https://www.contorion.de/',
  'https://www.rosebikes.de/',
  'https://www.wine-in-black.de/',
  'https://www.lumas.de/',
  'https://www.tom-tailor.de/',
  'https://www.certeo.de/',
  'https://www.segmueller.de/',
  'https://www.biesterfeld.com/de/',
  'http://sourceability.com/',
  'https://www.lekkerland.de/le/de/index.html',
  'https://www.jumbo.ch/de/',
  'http://www.w-f.ch/wfch/de/eh/index.php',
  'https://www.hardeck.de/',
  'https://www.dress-for-less.de/',
  'http://www.tesa.com/',
  'https://www.koffer24.de/',
  'https://www.jdwilliams.co.uk/',
  'https://www.douglas.de/',
  'https://www.obi.de/',
  'https://www.thomassabo.com/EU/de_DE/home',
  'https://www.orsay.com/de-de/',
  'https://www.ottogroup.com/de/index.php',
  'https://www.odlo.com/de/de/',
  'https://www.calida.com/de-DE/',
  'https://www.fissler.com/de/',
  'https://www.canterbury.com/',
  'https://www.bijou-brigitte.com/',
  'https://www.depot-online.com/home',
  'https://www.simplybe.co.uk/',
  'https://www.moevenpick-wein.de/',
  'https://www.sportscheck.com/',
  'https://www.mustang-jeans.com/de-de',
  'https://www.misterspex.de',
  'https://www.restposten.de/',
  'baur.de',
  'https://www.douglas.de/',
  'https://www.sportscheck.com',
  'https://www.hobbygigant.nl/',
  'https://www.keller-sports.de/',
  'https://www.galaxus.ch/',
  'https://www.heise.de/',
  'https://exporo.de/',
  'https://backend.exporo.de/investment/mezz/an-der-rennbahn',
  'https://de.lush.com/',
  'http://worldview.stanford.edu/',
  'https://international.kk.dk/',
  'https://www.audubon.org/',
  'https://www.nordiskfilm.com/',
  'https://www.ymcamn.org/',
  'http://fck.dk/',
  'https://academy.autodesk.com/',
  'https://www.dagrofa.dk/',
  'https://www.healthspan.co.uk/',
  'https://www.randstad.de/',
  'http://www.aidsactioneurope.org/',
  'http://www.geenergymanagement.com/',
  'http://meny.dk/',
  'http://www.911memorial.org/',
  'http://www.mountvernon.org/',
  'http://www.visitdenmark.com/',
  'https://fc.de/start/',
  'https://www.trachten-angermaier.de/',
  'https://www.betzold.de/',
  'https://www.chbeck.de/',
  'https://de.erwinmueller.com/shop/start-DE-de-EM',
  'https://www.ferrero.de/',
  'https://hemden-meister.de/',
  'https://www.kuhn-masskonfektion.com/',
  'https://www.marc-o-polo.com/de-de',
  'https://www.miles-and-more.com',
  'https://porta.de/porta/',
  'https://qundis.de/',
  'https://www.reidl.de/',
  'https://www.salewa.com/de-de',
  'https://www.sportler.com/de',
  'https://www.thalia.de',
  'https://www.tiramizoo.com/',
  'https://www.vdi-verlag.de/',
  'https://www.willner-fahrrad.de/',
  'http://www.worldofsport.de/',
  'gravis.de',
  'falk-ross.eu',
  'medimops.de',
  'shopmajic.de',
  'fitmart.de',
  'hellweg.de',
  'hirmer.de',
  'design-3000.de',
  'bergzeit.de',
]

function getFormattedResults(multiComparisons: model.BulkTest[]) {
  let formattedResult = '';

  multiComparisons.forEach(multiComparison => {
    if (multiComparison.status !== Status.SUCCESS) {
      return;
    }

    formattedResult += `${multiComparison.url}\t`;
    const fmpAverage = multiComparison.factors.firstMeaningfulPaint.toFixed(2).replace('.', ',');
    const spAverage = multiComparison.factors.speedIndex.toFixed(2).replace('.', ',');
    formattedResult += `${fmpAverage}\t`;
    formattedResult += `${spAverage}\t`;

    const fmpUplift = Math.round(multiComparison.competitorMeanValues.firstMeaningfulPaint - multiComparison.speedKitMeanValues.firstMeaningfulPaint);
    const spUplift = Math.round(multiComparison.competitorMeanValues.speedIndex - multiComparison.speedKitMeanValues.speedIndex);
    formattedResult += `${fmpUplift}\t`;
    formattedResult += `${spUplift}\t`;

    const fmpCompetitor = Math.round(multiComparison.competitorMeanValues.firstMeaningfulPaint);
    const fmpSpeedKit = Math.round(multiComparison.speedKitMeanValues.firstMeaningfulPaint);
    formattedResult += `${fmpCompetitor}\t`;
    formattedResult += `${fmpSpeedKit}\n`;
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
  const formattedResults = getFormattedResults(multiComparisons);

  response.send(formattedResults);
}
