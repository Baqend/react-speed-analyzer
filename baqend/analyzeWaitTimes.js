const fetch = require('node-fetch');

exports.get = function(db, req, res) {
  return db.TestResult.find()
    .notEqual('priority', 9)
    .equal('testDataMissing', false)
    .descending('createdAt')
    .limit(50)
    .resultList(tests => Promise.all(tests.map(test => getTimings(test))))
    .then(data => toHistogram(data))
    // .then(data => db.log.info(`Histogram`, {data}));
    .then(data => res.send({data}));
};

function getTimings(test) {
  return fetch(`http://ec2-18-195-220-131.eu-central-1.compute.amazonaws.com/viewlog.php?test=${test.testId}`)
    .then(response => response.text())
    .then(text => analyzeText(text))
    .catch(error => {
      return {wait: null, exec: null};
    });
}

function analyzeText(text) {
  const createdRegEx = /^(.*?) \- Test Created$/;
  const startedRegEx = /^(.*?) \- Starting test/;
  const finishedRegEx = /^(.*?) \- Test Complete$/;

  const lines = text.split('\n').filter(str => str.length);

  const createdMatch = createdRegEx.exec(lines.find(line => createdRegEx.test(line)));
  const startedMatch = startedRegEx.exec(lines.find(line => startedRegEx.test(line)));
  const finishedMatch = finishedRegEx.exec(lines.find(line => finishedRegEx.test(line)));

  if (!createdMatch || !startedMatch || !finishedMatch || !createdMatch[1] || !startedMatch[1] || !finishedMatch[1]) {
    return {wait: null, exec: null};
  }

  const wait = (new Date(startedMatch[1]).getTime() - new Date(createdMatch[1]).getTime()) / 1000;
  const exec = (new Date(finishedMatch[1]).getTime() - new Date(startedMatch[1]).getTime()) / 1000;

  return {wait: wait.toFixed(0), exec: exec.toFixed(0)};
}

function toHistogram(data) {
  const rows = data.map(times => `${times.wait},${times.exec}`);
  const histogramData = rows.filter(row => !row.includes('null')).join('\n');
  return `WaitTime,ExecutionTime\n${histogramData}`;
}
