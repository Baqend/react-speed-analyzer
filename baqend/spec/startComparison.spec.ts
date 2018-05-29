import 'mocha'
import DB from 'baqend'
import { expect } from 'chai'
import { Request, Response } from 'express'
import { post } from '../startComparison'

function mockReqRes(body: any = {}, query: any = {}): { req: Request, res: Response & { data: any, statusCode: number } } {
  const req = { body, query } as any
  const res = {
    statusCode: 200,
    data: {},
    status(code: number) {
      this.statusCode = code
    },
    send(data: any) {
      this.data = data
    },
  } as any

  return { req, res }
}

describe('startComparison', () => {
  before(async () => {
    if (!DB.isOpen) {
      await DB.connect('makefast-dev')
    }
  })

  it('starts comparisons correctly', async () => {
    const url = 'google.de'
    const { req, res } = mockReqRes({ url })
    // Check call result
    await post(DB, req, res)

    expect(res.statusCode).to.eql(200)
    const result = res.data
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
