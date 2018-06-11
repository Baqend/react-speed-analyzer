const fetch = require('node-fetch')
const assert = require('assert')
const analyzerAPIUrl = 'https://makefast.app.baqend.com/v1'
const analyzerCodeUrl = `${analyzerAPIUrl}/code`

async function testAnalyzer(siteUrl, expectedParams) {

  const comparisonBody = {
    url: siteUrl,
    location: 'eu-central-1:Chrome.Native',
    mobile: false,
    speedKitConfig: expectedParams.speedKitConfig,
    withPuppeteer: false,
  }

  const startComparison = await post(`${analyzerCodeUrl}/startComparison`, JSON.stringify(comparisonBody))
  if (!startComparison.ok) {
    reportError(`Start Comparison Request failed with status: ${startComparison.status}: ${startComparison.statusText}`)
  }

  console.log('Start comparison ok')
  const comparisonResponse = await startComparison.json()

  console.log('Waiting for Results')
  await waitAndReport(240)

  const testOverviewRes = await fetch(`${analyzerAPIUrl}${comparisonResponse.id}`)
  if (!testOverviewRes.ok) {
    reportError(`TestOveriew Request failed with status: ${testOverviewRes.status}: ${testOverviewRes.statusText}`)
  }

  const testOverview = await testOverviewRes.json()

  // Test analyzeUrl params
  checkAnalyzeResult(testOverview, expectedParams)
  console.log('Analyze url params ok')

  //Test the params to start the test with
  checkTestParams(testOverview, expectedParams)
  console.log('Test params ok')

  // Test config analysis if available
  if (expectedParams.configAnalysis) {
    checkConfigAnalysis(testOverview, expectedParams)
    console.log('Config analysis ok')
  }

  const compId = testOverview.competitorTestResult
  const skId = testOverview.speedKitTestResult

  const compResultRes = await fetch(`${analyzerAPIUrl}${compId}`)

  if (!compResultRes.ok) {
    reportError(`Competitor Test Result Request failed with status: ${compResultRes.status}: ${compResultRes.statusText}`)
  }

  const skResultRes = await fetch(`${analyzerAPIUrl}${skId}`)

  if (!skResultRes.ok) {
    reportError(`Speed Kit Test Result Request failed with status: ${skResultRes.status}: ${skResultRes.statusText}`)
  }

  const compResult = await compResultRes.json()
  const skResult = await skResultRes.json()

  checkTestResult(compResult, false)
  console.log('Competitor Test OK')

  checkTestResult(skResult, true)
  console.log('Speed Kit Test OK')

  console.log(`Test Successful. Speedup: ${(compResult.firstView.speedIndex - skResult.firstView.speedIndex)}ms SI -- ${(compResult.firstView.firstMeaningfulPaint - skResult.firstView.firstMeaningfulPaint)}ms FMP`)
}

async function waitAndReport(time) {
  for (let i = 0; i < time; i += 10) {
    console.log(`${time - i}s to go`)
    await (new Promise(resolve => setTimeout(resolve, 10000)))
  }
}

function reportError(msg, err) {
  throw new Error(msg, err)
}

function checkAnalyzeResult(result, expectedResult){
  try {
    assert.equal(result.url, expectedResult.url, 'Attribute "url" not matching')
    assert.equal(result.displayUrl, expectedResult.displayUrl, 'Attribute "displayUrl" not matching')
    assert.equal(result.type, expectedResult.type, 'Attribute "type" not matching')
    assert.equal(result.isSecured, expectedResult.isSecured, 'Attribute "isSecured" not matching')
  } catch(err) {
    console.log(err)
    reportError(`Analyse url params not valid. Id: ${result.id}`, err)
  }
}

function checkTestParams(result, expectedResult){
  try {
    if (expectedResult.speedKitConfig) {
      assert.equal(result.speedKitConfig, expectedResult.speedKitConfig, 'Attribute "speedKitConfig" not matching')
    }

    assert.equal(result.mobile, expectedResult.mobile, 'Attribute "mobile" not matching')
    assert.equal(result.isSpeedKitComparison, expectedResult.isSpeedKitComparison, 'Attribute "isSpeedKitComparison" not matching')
    assert.equal(result.speedKitVersion, expectedResult.speedKitVersion, 'Attribute "speedKitVersion" not matching')
  } catch(err) {
    console.log(err)
    reportError(`Test params not valid. Id: ${result.id}`, err)
  }
}

function checkConfigAnalysis(result, expectedResult) {
  try{
    assert.equal(result.configAnalysis.configMissing, expectedResult.configAnalysis.configMissing, 'Attribute "configMissing" not matching')
    assert.equal(result.configAnalysis.swPath, expectedResult.configAnalysis.swPath, 'Attribute "swPath" not matching')
    assert.equal(result.configAnalysis.isDisabled, expectedResult.configAnalysis.isDisabled, 'Attribute "isDisabled" not matching')
    assert.equal(result.configAnalysis.swPathMatches, expectedResult.configAnalysis.swPathMatches, 'Attribute "swPathMatching" not matching')
  } catch(err) {
    console.log(err)
    reportError(`Config analysis not valid. Id: ${result.id}`, err)
  }
}

function checkTestResult(result, speedKit) {
  try {
    assert.ok(result.firstView, 'First View missing')
    assert.ok(result.firstView.speedIndex, 'Speed Index missing')
    assert.ok(result.firstView.firstMeaningfulPaint, 'First Meaningful Paint missing')
    assert.ok(result.url, 'Url missing')
    assert.ok(result.summaryUrl, 'Summary Link missing')
    assert.ok(result.videoFileFirstView, 'Video File missing')
    assert.ok(!result.testDataMissing, 'Test Data missing')
    assert.ok(result.hasFinished, 'Test not finished')
    assert.ok(!result.isWordPress, 'Testpage wrongly categoriezed as WordPress')
    assert.equal(0, result.priority, 'Priority not 0')
  } catch(err) {
    console.log(err)
    reportError(`Testresult for ${speedKit? 'Speed Kit' : 'Competitor'} not valid. Id: ${result.id}`, err)
  }
}

async function post(url, body) {
  const headers = {}
  headers['content-type'] = 'application/json;charset=UTF-8'

  return fetch(url, { method: 'POST', headers, body})
}

async function executeAnalyzerTest() {
  try {
    console.log('Testing kicker.de (no Speed Kit installed)')
    await execNonSpeedKit()
    console.log('Testing fussballdaten.de (with Speed Kit installed)')
    await execSpeedKit()
  } catch(err) {
    console.error(err.stack, err.cause)
    process.exit(1)
  }
}

async function execNonSpeedKit() {
  const url = 'kicker.de'
  const speedKitConfigString = '{"appName": "makefast", "whitelist": [{ "host": [ /.*kicker\\.de/ ] }], "userAgentDetection": false }'
  const expectedParams = {
    url: 'http://www.kicker.de/',
    displayUrl: 'http://www.kicker.de/',
    mobile: false,
    isSpeedKitComparison: false,
    speedKitVersion: null,
    speedKitConfig: speedKitConfigString,
    configAnalysis: null,
    isSecured: false,
    type: null
  }

  return testAnalyzer(url, expectedParams)
}

async function execSpeedKit() {
  const url = 'https://www.fussballdaten.de/bundesliga/ewige-tabelle/'
  const expectedParams = {
    url: 'https://www.fussballdaten.de/bundesliga/ewige-tabelle/',
    displayUrl: 'https://www.fussballdaten.de/bundesliga/ewige-tabelle/',
    mobile: false,
    isSpeedKitComparison: true,
    speedKitVersion: '1.6.0',
    speedKitConfig: null,
    configAnalysis: {
      configMissing: false,
      swPath: 'https://www.fussballdaten.de/sw.js',
      swPathMatches: true,
      isDisabled: false
    },
    isSecured: true,
    type: null
  }

  return testAnalyzer(url, expectedParams)
}

executeAnalyzerTest()
