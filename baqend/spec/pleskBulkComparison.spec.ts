import 'mocha'
import DB from 'baqend'
import { Request, Response } from 'express'
import { expect } from 'chai'
import { get, post } from '../pleskBulkComparison'

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

describe('pleskBulkComparison', () => {
  before(async () => {
    if (!DB.isOpen) {
      await DB.connect('makefast-dev')
    }
  })

  let bulkComparisonId: string
  it('POSTs new bulk comparisons', async () => {
    const { req, res } = mockReqRes(['moellers.systems'])
    await post(DB, req, res)

    // Check POST result
    expect(res.data).to.be.ok
    expect(res.data.bulkComparisonId).to.be.ok
    expect(res.data.domainMap).to.be.eql([['moellers.systems', 'https://moellers.systems/hello!']])

    bulkComparisonId = res.data.bulkComparisonId
  })

  it('GETs generated smart config', async () => {
    const { req, res } = mockReqRes({}, { bulkComparisonId, url: 'https://moellers.systems/hello!' })
    await get(DB, req, res)

    // Check GET result
    expect(res.data).to.be.ok
    expect(res.data.bulkComparisonId).to.eql(bulkComparisonId)
    expect(res.data.url).to.be.eql('https://moellers.systems/hello!')
  })
})
