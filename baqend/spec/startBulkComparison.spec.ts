import DB from 'baqend'
import { expect } from 'chai'
import 'mocha'
import { sleep } from '../_sleep'
import { Priority } from '../_TestParams'
import { call } from '../startBulkComparison'

describe('startBulkComparison', () => {
  before(async () => {
    if (!DB.isOpen) {
      await DB.connect('makefast-dev')
    }
  })

  it('starts bulk comparisons correctly', async () => {
    // Check call result
    const result = call(DB, [{ url: 'obama.org', runs: 3, priority: Priority.HIGH }])
    expect(result).to.be.ok
    expect(result.tests).to.have.length(1)
    expect(result.createdBy).to.be.null
    expect(result.id).to.be.ok

    // Check remote
    await sleep(5000)
    const bulkComparison = await DB.BulkComparison.load(result.id, { depth: 3 })

    const bulkTest = bulkComparison.multiComparisons[0]
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
