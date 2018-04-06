const { factorize } = require('./bulkTest');

exports.call = function callQueueTest(db, data, req) {

  return iterate(db)
    .catch(error => error.stack)
    .then(count => {
      return { count };
    });

};


function iterate(db, lastElemId = null) {
  let query = db.TestOverview.find()
    .isNull('factors')
    .equal('hasFinished', true)
    .ascending('id')
    .limit(100);

  if (lastElemId) {
    query = query.gt('id', lastElemId);
  }

  return query
    .resultList({ depth:2 }, overviews => {
      const updates = overviews.map(overview => {
        overview.factors = calculateFactors(overview.competitorTestResult, overview.speedKitTestResult, db);
        return overview.save()
          .then(() => overview.id);
      });
      return Promise.all(updates);
    })
    .catch(error => {
      db.log.error(`Could not fix factors`, { error: error.stack });
      return { error: error.stack };
    })
    .then(updated => {
      db.log.info(`Updated ${updated.length} overviews`, { updated });
      if (updated.length >= 100) {
        return iterate(db, updated[updated.length - 1])
          .then(count => updated.length + count);
      }
      return updated.length;
    });
}

function calculateFactors(compResult, skResult, db) {
  if (skResult.testDataMissing || compResult.testDataMissing || !compResult.firstView || ! skResult.firstView) {
    return null;
  }

  return factorize(db, compResult.firstView, skResult.firstView);
}
