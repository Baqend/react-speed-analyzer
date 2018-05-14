import 'mocha'
import DB from 'baqend'
import { expect } from 'chai'
import { call } from '../startMultiComparison'
import { sleep } from '../_sleep';
import { Priority } from '../_TestParams';

describe('startMultiComparison', () => {
  before(async () => {
    if (!DB.isOpen) {
      await DB.connect('makefast-dev')
    }
  })

  it('starts multi comparisons correctly', async () => {
    // Check call result
    const result = await call(DB, { url: 'obama.org', runs: 3, priority: Priority.HIGH })
    expect(result).to.be.ok
    expect(result.url).to.eql('https://www.obama.org/')
    expect(result.puppeteer!.url).to.eql('https://www.obama.org/')
    expect(result.puppeteer!.displayUrl).to.eql('https://www.obama.org/')
    expect(result.puppeteer!.type.framework).to.eql('wordpress')
    expect(result.hasFinished).to.be.false

    // Check remote
    const id = result.id
    expect(id.substr(0, 13)).to.eql('/db/BulkTest/')

    await sleep(5000)
    const bulkTest = await DB.BulkTest.load(id, { depth: 2 })

    expect(bulkTest).to.be.ok
    expect(bulkTest.puppeteer).to.be.ok
    expect(bulkTest.url).to.eql('https://www.obama.org/')
    expect(bulkTest.priority).to.eql(Priority.HIGH)

    const comparison = bulkTest.testOverviews[0]
    expect(comparison).to.be.ok
    expect(comparison.url).to.eql('https://www.obama.org/')
    expect(comparison.displayUrl).to.eql('https://www.obama.org/')
    expect(comparison.type).to.eql('wordpress')

    // Check comparison's tests
    expect(comparison.speedKitTestResult).to.be.ok
    expect(comparison.speedKitTestResult.id.substr(0, 15)).to.eql('/db/TestResult/')
    expect(comparison.speedKitTestResult.url).to.eql('https://www.obama.org/')
    expect(comparison.speedKitTestResult.isClone).to.be.true
    expect(comparison.competitorTestResult).to.be.ok
    expect(comparison.competitorTestResult.id.substr(0, 15)).to.eql('/db/TestResult/')
    expect(comparison.competitorTestResult.url).to.eql('https://www.obama.org/')
    expect(comparison.competitorTestResult.isClone).to.be.false
  })
})
