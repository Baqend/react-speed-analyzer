exports.get = function get(db, req, res) {
  const testId = req.query.id;
  return db.TestOverview.load(testId, {depth: 1}).then(overview => {
    const competitorWaterfall = overview.competitorTestResult.summaryUrl;
    const speedKitWaterfall = overview.speedKitTestResult.summaryUrl;

    return res.send({competitorWaterfall, speedKitWaterfall});
  })
};
