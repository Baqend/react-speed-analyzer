import 'mocha'
import DB from 'baqend'
import { Request, Response } from 'express'
import { expect } from 'chai'
import { post } from '../smartConfig'

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

describe('smartConfig', function () {
  this.timeout(10_000)

  before(async () => {
    if (!DB.isOpen) {
      await DB.connect('makefast-dev')
    }
  })

  it('POSTs new smart config tests', async () => {
    const { req, res } = mockReqRes({ url: 'https://www.alibaba.com/', mobile: false })
    await post(DB, req, res)
    console.log(res.data)

    // Check POST result
    expect(res.data).to.be.ok
    expect(res.data.config).to.be.ok
    expect(res.data.url).to.be.eql('https://www.alibaba.com/')
    expect(res.data.mobile).to.be.eql(false)
  })
})
