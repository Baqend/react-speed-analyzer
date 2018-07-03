import { model } from 'baqend'

const WINNER_THRESHOLD = 90
const LOSER_THRESHOLD = 80

// If a VC is bigger than 50 we will assume that the paint was meaningful
const VC_THRESHOLD = 50

function chooseCandidate(fmpData: model.FMPData, goalVC: number): model.Candidate {
  if (fmpData.candidates) {
    return fmpData.candidates
      .sort(({ startTime: a }, { startTime: b }) => a - b)
      .reduce((prev, curr) => {
        if (curr.visualCompleteness === 0) {
          return prev
        }

        if (prev.visualCompleteness >= goalVC) {
          return prev
        }

        return (Math.abs(curr.visualCompleteness - goalVC) <
          Math.abs(prev.visualCompleteness - goalVC) ? curr : prev);
    });
  } else {
    return fmpData.suggestedCandidate
  }
}

function isSpeedKitWinner(speedKitVC: number, competitorVC: number): boolean {
  // In the case of an instant 100 we can assume there is an outlier
  if (speedKitVC > VC_THRESHOLD && competitorVC > VC_THRESHOLD) {
    return speedKitVC < competitorVC
  }

  return speedKitVC > competitorVC
}

function getLoserCandidate(winnerVC: number, loserFMP: model.FMPData): model.Candidate {
  const loserVC = loserFMP.suggestedCandidate.visualCompleteness

  // In the case of that the difference between the winnerVC and loserVC is bigger than 10, then winnerVC
  // seems not comparable; winnerVC does not represent a realistic visual painting process
  if (winnerVC <= WINNER_THRESHOLD) {
    return chooseCandidate(loserFMP, winnerVC)

    // winner is bigger than winner-threshold && smaller than or equal to loser-threshold
  } else if (loserVC <= LOSER_THRESHOLD){
    return chooseCandidate(loserFMP, LOSER_THRESHOLD)
  }

  return loserFMP.suggestedCandidate;
}

// Compares whether the wptFMP is below the startTime (both of the candidate to be compared).
function compareCandidateTimings(candidate: model.Candidate, compareCandidate: model.Candidate): number {
  if (candidate.wptFMP) {
    return candidate.wptFMP
  }

  if (!compareCandidate.wptFMP) {
    return candidate.endTime
  }

  return compareCandidate.wptFMP < compareCandidate.startTime ? candidate.startTime : candidate.endTime
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

    const suggestedCompetitorCandidate = competitorFMPData.suggestedCandidate
    const suggestedSpeedKitCandidate = speedKitFMPData.suggestedCandidate

    const competitorVC = suggestedCompetitorCandidate.visualCompleteness
    const speedKitVC = suggestedSpeedKitCandidate.visualCompleteness

    if (isSpeedKitWinner(speedKitVC, competitorVC)) {
      const competitorCandidate = getLoserCandidate(speedKitVC, competitorFMPData)
      speedKit.firstView.firstMeaningfulPaint = compareCandidateTimings(suggestedSpeedKitCandidate, competitorCandidate);
      competitor.firstView.firstMeaningfulPaint = compareCandidateTimings(competitorCandidate, suggestedSpeedKitCandidate);
    } else {
      const speedKitCandidate = getLoserCandidate(competitorVC, speedKitFMPData)
      speedKit.firstView.firstMeaningfulPaint = compareCandidateTimings(speedKitCandidate, suggestedCompetitorCandidate);
      competitor.firstView.firstMeaningfulPaint = compareCandidateTimings(suggestedCompetitorCandidate, speedKitCandidate);
    }
  }

  return await Promise.all([competitor.save(), speedKit.save()])
}
