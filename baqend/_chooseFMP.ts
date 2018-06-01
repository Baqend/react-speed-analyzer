import { model } from 'baqend'

const WINNER_THRESHOLD = 90
const LOSER_THRESHOLD = 80
const VC_THRESHOLD = 50

function chooseLoserFMP(fmpData: model.FMPData, goalVC: number): number {
  if (fmpData.candidates) {
    const closest = fmpData.candidates.reduce((prev, curr) => {
      return (Math.abs(curr.visualCompleteness -  goalVC) <
        Math.abs(prev.visualCompleteness - goalVC) ? curr : prev);
    });

    return closest.wptFMP || closest.endTime
  } else {
    const { endTime, wptFMP } = fmpData.suggestedCandidate
    return wptFMP || endTime
  }
}

function isSpeedKitWinner(speedKitVC: number, competitorVC: number): boolean {
  if (speedKitVC > VC_THRESHOLD && competitorVC > VC_THRESHOLD) {
    return speedKitVC < competitorVC
  }

  return speedKitVC > competitorVC
}

export async function chooseFMP(competitor: model.TestResult, speedKit: model.TestResult): Promise<Array<model.TestResult>> {
  if (competitor.firstView && competitor.firstView.fmpData) {
    const { endTime, wptFMP } = competitor.firstView.fmpData.suggestedCandidate
    competitor.firstView.firstMeaningfulPaint = wptFMP || endTime
  }

  if (speedKit.firstView && speedKit.firstView.fmpData) {
    const { endTime, wptFMP } = speedKit.firstView.fmpData.suggestedCandidate
    speedKit.firstView.firstMeaningfulPaint = wptFMP || endTime
  }

  if (competitor.firstView && competitor.firstView.fmpData && speedKit.firstView && speedKit.firstView.fmpData) {
    const competitorFMPData = competitor.firstView.fmpData;
    const speedKitFMPData = speedKit.firstView.fmpData;

    const competitorCandidate = competitorFMPData.suggestedCandidate
    const speedKitCandidate = speedKitFMPData.suggestedCandidate

    const competitorVC = competitorCandidate.visualCompleteness
    const speedKitVC = speedKitCandidate.visualCompleteness

    // speed kit is the winner
    if (isSpeedKitWinner(speedKitVC, competitorVC)) {
      if (speedKitVC <= WINNER_THRESHOLD) {
        competitor.firstView.firstMeaningfulPaint = chooseLoserFMP(competitorFMPData, speedKitVC)
        // winner is bigger than winner-threshold && smaller than or equal to loser-threshold
      } else if (competitorVC <= LOSER_THRESHOLD){
        competitor.firstView.firstMeaningfulPaint = chooseLoserFMP(competitorFMPData, LOSER_THRESHOLD)
      }
      // competitor is the winner
    } else {
      if (competitorVC <= WINNER_THRESHOLD) {
        speedKit.firstView.firstMeaningfulPaint = chooseLoserFMP(speedKitFMPData, competitorVC)
        // winner is bigger than winner-threshold && smaller than or equal to loser-threshold
      } else if (speedKitVC <= LOSER_THRESHOLD){
        speedKit.firstView.firstMeaningfulPaint = chooseLoserFMP(speedKitFMPData, LOSER_THRESHOLD)
      }
    }
  }

  return await Promise.all([competitor.save(), speedKit.save()])
}
