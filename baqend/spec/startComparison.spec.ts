import 'mocha'
import DB from 'baqend'
import { expect } from 'chai'
import { call } from '../startComparison'

describe('startComparison', () => {
  before(async () => {
    await DB.connect('makefast-dev')
  })

  it('starts comparisons correctly', async () => {
    // Check call result
    const result= await call(DB, { url: 'google.de' })
    expect(result).to.be.ok
    expect(result.url).to.eql('https://www.google.de/')
    expect(result.displayUrl).to.eql('https://www.google.de/')
    expect(result.type).to.be.null
    expect(result.hasFinished).to.be.false

    // Check remote
    const id = result.id
    expect(id.substr(0, 17)).to.eql('/db/TestOverview/')

    const comparison = await DB.TestOverview.load(id, { depth: 1 })
    expect(comparison).to.be.ok
    expect(comparison.url).to.eql('https://www.google.de/')
    expect(comparison.displayUrl).to.eql('https://www.google.de/')
    expect(comparison.type).to.be.null

    // Check comparison's tests
    expect(comparison.speedKitTestResult).to.be.ok
    expect(comparison.speedKitTestResult.id.substr(0, 15)).to.eql('/db/TestResult/')
    expect(comparison.speedKitTestResult.url).to.eql('https://www.google.de/')
    expect(comparison.speedKitTestResult.isClone).to.be.true
    expect(comparison.competitorTestResult).to.be.ok
    expect(comparison.competitorTestResult.id.substr(0, 15)).to.eql('/db/TestResult/')
    expect(comparison.competitorTestResult.url).to.eql('https://www.google.de/')
    expect(comparison.competitorTestResult.isClone).to.be.false
  })
})
