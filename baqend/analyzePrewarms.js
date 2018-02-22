const { API } = require('./Pagetest');

exports.get = function(db, req, res) {

  const options = {
    requests: false,
    breakdown: false,
    domains: false,
    pageSpeed: false,
  };

  const start = new Date();
  start.setDate(start.getDate() - 3);

  return db['logs.AppLog'].find()
    .gt('date', start)
    .equal('message', 'Prewarm done')
    .equal('level', 'info')
    .limit(1)
    .resultList()
    .then(logs => Promise.all(logs.map(log => {
      const { testId } = log.data;
      return API.getTestResults(testId, options)
        .then(result => {
          return { testId, valid: isResultValid(result) };
        })
        .catch(error => {
          return { testId, valid: true };
        });
    })))
    .then(classifiedTests => classifiedTests.filter(({testId, valid}) => !valid))
    .then(filteredTests => filteredTests.map(({testId,}) => toLink(testId)))
    .then(result => res.send({ result }));
};

function toLink(testId) {
  return `http://ec2-18-195-220-131.eu-central-1.compute.amazonaws.com/results.php?test=${testId}`
}

function isResultValid(result) {
  return result
    && result.data
    && result.data.runs
    && result.data.runs['1']
    && result.data.runs['1'].firstView
    && result.data.runs['1'].firstView.TTFB > 0;
}
