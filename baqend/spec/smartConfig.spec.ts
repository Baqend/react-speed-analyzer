import 'mocha'
import DB from 'baqend'
import { Request, Response } from 'express'
import { expect } from 'chai'
import { get, post } from '../smartConfig'
import { sleep } from '../_sleep';

function mockReqRes(body: any = {}, query: any = {}): { req: Request, res: Response & { data: any, statusCode: number } } {
  const req = { body, query } as any
  const res = {
    statusCode: 200,
    data: {},
    status(code) {
      this.statusCode = code
    },
    send(data) {
      this.data = data
    },
  } as any

  return { req, res }
}

describe('smartConfig', () => {
  before(async () => {
    if (!DB.isOpen) {
      await DB.connect('makefast-dev')
    }
  })

  let testId
  it('POSTs new smart config tests', async () => {
    const { req, res } = mockReqRes({ url: 'https://www.alibaba.com/' })
    await post(DB, req, res)

    // Check POST result
    expect(res.data).to.be.ok
    expect(res.data.testId).to.be.ok
    expect(res.data.url).to.be.eql('https://www.alibaba.com/')
    expect(res.data.params).to.be.eql({})

    testId = res.data.testId
  })

  it('GETs generated smart config', async () => {

    const { req, res } = mockReqRes({}, { testId })
    await get(DB, req, res)

    // Wait until result is done
    while (res.statusCode == 404) {
      res.statusCode = 200
      await sleep(1000)
      await get(DB, req, res)
    }

    // Check GET result
    expect(res.data).to.be.ok
    expect(res.data.testId).to.eql(testId)
    expect(res.data.url).to.be.eql('https://www.alibaba.com/')
    expect(res.data.mobile).to.be.eql(false)
    expect(res.data.config).to.be.eql('{ appName: "makefast-dev", whitelist: [{ host: [/.*alibaba\\.com/, /sc01\\.alicdn\\.com/, /sc02\\.alicdn\\.com/, /g\\.alicdn\\.com/, /img\\.alicdn\\.com/, /i\\.alicdn\\.com/, /is\\.alicdn\\.com/, /assets\\.alicdn\\.com/] }], userAgentDetection: false }')
  })
})
