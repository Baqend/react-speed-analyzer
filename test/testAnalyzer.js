const fetch = require('node-fetch');
const assert = require('assert');
const analyzerAPIUrl = 'https://makefast.app.baqend.com/v1';
const analyzerCodeUrl = `${analyzerAPIUrl}/code`;

async function testAnalyzer(siteUrl, expectedUrlInfo, speedKitConfigString) {

  // Test Ratelimit
  const rateLimit = await fetch(`${analyzerCodeUrl}/testRateLimited`);

  if (!rateLimit.ok) {
    reportError(`Rate Limit Request failed with status: ${rateLimit.status}`);
  }

  console.log('Ratelimit Check ok');


  // Test NormalizeUrl
  const urlInfoBody = `{"urls": "${siteUrl}", "mobile": false}`;
  const urlInfoRes = await post(`${analyzerCodeUrl}/normalizeUrl`, urlInfoBody);

  if (!urlInfoRes.ok) {
    reportError(`Normalize Url Request failed with status: ${urlInfoRes.status}: ${urlInfoRes.statusText}`);
  }

  const urlInfo = await urlInfoRes.json();

  assert.deepEqual(expectedUrlInfo, urlInfo, `Unexpected Response from normalizeUrl. Expected: ${JSON.stringify(expectedUrlInfo)}. Given: ${JSON.stringify(urlInfo)}`);

  console.log('Normalize URL ok');

  // Test GenerateUniqueId

  const uniqueIdRes = await post(`${analyzerCodeUrl}/generateUniqueId`, '{"entityClass":"TestOverview"}');
  if (!uniqueIdRes.ok) {
    reportError(`Unique Id request failed with status: ${uniqueIdRes.status}: ${uniqueIdRes.statusText}`);
  }
  console.log('Unique ID ok');


  // Test QueueTest

  const compBody = {
    url: urlInfo[0].url,
    isSpeedKitComparison: urlInfo[0].speedkit,
    location: "eu-central-1:Chrome.Native",
    isClone:false,
    caching:false,
    mobile:false
  };

  const compTestRes = await post(`${analyzerCodeUrl}/queueTest`, JSON.stringify(compBody));

  if (!compTestRes.ok) {
    reportError(`Queue Test Competitor Request failed with status: ${compTestRes.status}: ${compTestRes.statusText}`);
  }

  const skBody = {
    url: urlInfo[0].url,
    isSpeedKitComparison: urlInfo[0].speedkit,
    speedKitConfig: speedKitConfigString,
    location: "eu-central-1:Chrome.Native",
    isClone:true,
    caching:false,
    mobile:false};

  const skTestRes = await post(`${analyzerCodeUrl}/queueTest`, JSON.stringify(skBody));

  if (!skTestRes.ok) {
    reportError(`Queue Test Speed Kit Request failed with status: ${skTestRes.status}: ${skTestRes.statusText}. Body: ${await skTestRes.text()}`);
  }

  const compId = (await compTestRes.json()).baqendId;
  const skId = (await skTestRes.json()).baqendId;

  console.log('Queue Test ok');

  // Test Test Results

  // Wait for tests to finish
  console.log('Waiting for Results');
  await waitAndReport(240);

  const compResultRes = await fetch(`${analyzerAPIUrl}/db/TestResult/${compId}`);

  if (!compResultRes.ok) {
    reportError(`Competitor Test Result Request failed with status: ${compResultRes.status}: ${compResultRes.statusText}`);
  }

  const skResultRes = await fetch(`${analyzerAPIUrl}/db/TestResult/${skId}`);

  if (!skResultRes.ok) {
    reportError(`Speed Kit Test Result Request failed with status: ${skResultRes.status}: ${skResultRes.statusText}`);
  }

  const compResult = await compResultRes.json();
  const skResult = await skResultRes.json();

  checkTestResult(compResult, false);

  console.log('Competitor Test OK');
  checkTestResult(skResult, true);

  console.log('Speed Kit Test OK');
  console.log(`Test Successful. Speedup: ${(compResult.firstView.speedIndex - skResult.firstView.speedIndex)}ms SI -- ${(compResult.firstView.firstMeaningfulPaint - skResult.firstView.firstMeaningfulPaint)}ms FMP`);

}

async function waitAndReport(time) {
  for (let i = 0; i < time; i += 10) {
    console.log(`${time - i}s to go`);
    await (new Promise(resolve => setTimeout(resolve, 10000)));
  }
}

function reportError(msg, err) {
  throw new Error(msg, err);
}

function checkTestResult(result, speedKit) {
  try {
    assert.ok(result.firstView, "First View missing");
    assert.ok(result.firstView.speedIndex, "Speed Index missing");
    assert.ok(result.firstView.firstMeaningfulPaint, "First Meaningful Paint missing");
    assert.ok(result.url, "Url missing");
    assert.ok(result.summaryUrl, "Summary Link missing");
    assert.ok(result.videoIdFirstView, "Video Id missing");
    assert.ok(result.videoFileFirstView, "Video File missing");
    assert.ok(!result.testDataMissing, "Test Data missing");
    assert.ok(result.hasFinished, "Test not finished");
    assert.ok(!result.isWordPress, "Testpage wrongly categoriezed as WordPress");
    assert.equal(0, result.priority, "Priority not 0");
  } catch(err) {
    console.log(err);
    reportError(`Testresult for ${speedKit? 'Speed Kit' : 'Competitor'} not valid. Id: ${result.id}`, err);
  }
}

async function post(url, body) {
  const headers = {};
  headers['content-type'] = 'application/json;charset=UTF-8';

  return fetch(url, { method: 'POST', headers, body});
}

async function executeAnalyzerTest() {
  try {
    console.log('Testing kicker.de (no Speed Kit installed)');
    await execNonSpeedKit();
    console.log('Testing fussballdaten.de (with Speed Kit installed)');
    await execSpeedKit();
  } catch(err) {
    console.error(err.stack, err.cause);
    process.exit(1);
  }
}

executeAnalyzerTest();

async function execNonSpeedKit() {
  const expectedUrlInfo = [{
    query: "kicker.de",
    url: "http://www.kicker.de/",
    displayUrl: "http://www.kicker.de/",
    isBaqendApp: false,
    isSecured: false,
    speedkit: false,
    speedkitVersion: null,
    type: null
  }];

  const speedKitConfigString = '{"appName": "makefast", "whitelist": [{ "host": [ /^(?:[\\w-]*\\.){0,3}(?:kicker\\.)/ ] }], "userAgentDetection": false }';

  return testAnalyzer(expectedUrlInfo[0].query, expectedUrlInfo, speedKitConfigString)
}

async function execSpeedKit() {
  const expectedUrlInfo = [{
    query: "https://www.fussballdaten.de/bundesliga/ewige-tabelle/",
    url: "https://www.fussballdaten.de/bundesliga/ewige-tabelle/",
    displayUrl: "https://www.fussballdaten.de/bundesliga/ewige-tabelle/",
    isBaqendApp: false,
    isSecured: true,
    speedkit: true,
    speedkitVersion: "1.1.4",
    type: null
  }];

  const speedKitConfigString = '';

  return testAnalyzer(expectedUrlInfo[0].query, expectedUrlInfo, speedKitConfigString)
}
