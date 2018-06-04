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

function setLoserFMP(winnerVC: number, loser: model.TestResult) {
  if (loser.firstView) {
    const fMPData = loser.firstView.fmpData
    const loserVC = fMPData.suggestedCandidate.visualCompleteness

    if (winnerVC <= WINNER_THRESHOLD) {
      loser.firstView.firstMeaningfulPaint = chooseLoserFMP(fMPData, winnerVC)
      // winner is bigger than winner-threshold && smaller than or equal to loser-threshold
    } else if (loserVC <= LOSER_THRESHOLD){
      loser.firstView.firstMeaningfulPaint = chooseLoserFMP(fMPData, LOSER_THRESHOLD)
    }
  }
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

    isSpeedKitWinner(speedKitVC, competitorVC) ? setLoserFMP(speedKitVC, competitor) : setLoserFMP(competitorVC, speedKit)
  }

  return await Promise.all([competitor.save(), speedKit.save()])
}
