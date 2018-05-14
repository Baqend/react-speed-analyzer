import { expect } from 'chai'
import 'mocha'
import { ConfigGenerator } from '../_ConfigGenerator'
import { ConsoleLogger } from './ConsoleLogger'

describe('ConfigGenerator', () => {

  let logger: Logger
  let configGenerator: ConfigGenerator

  before(() => {
    logger = new ConsoleLogger()
    configGenerator = new ConfigGenerator(logger)
  })

  it('generates a minimal config', () => {
    const minimal1 = configGenerator.generateMinimal('https://alibaba.com', false)
    expect(minimal1).to.deep.equal({
      appName: 'makefast-dev',
      whitelist: [
        { host: /^[A-Za-z.-]*alibaba\.com$/ },
      ],
      userAgentDetection: false,
    })
  })

  it('generates a fallback config', () => {
    const minimal1 = configGenerator.generateFallback('https://alibaba.com', false)
    expect(minimal1).to.deep.equal({
      appName: 'makefast-dev',
      whitelist: [
        { host: /^[A-Za-z.-]*alibaba\.com$/ },
        {
          host: [
            /cdn/,
            /(?:^|\.)assets\./,
            /(?:^|\.)static\./,
            /(?:^|\.)images\./,
            's3.amazonaws.com',
            'ajax.googleapis.com',
          ],
        },
        { pathname: [/\.min\.(?:css|js)$/] },
        { url: ['https://apis.google.com/js/plusone.js'] },
      ],
      userAgentDetection: false,
    })
  })

  it('generates a smart config', async () => {
    const domains = [
      's3.amazonaws.com',
      'ajax.googleapis.com',
      'foo.bar',
    ]
    const minimal1 = await configGenerator.generateSmart('https://alibaba.com', domains, false)
    expect(minimal1).to.deep.equal({
      appName: 'makefast-dev',
      whitelist: [
        { host: /^[A-Za-z.-]*alibaba\.com$/ },
        {
          host: [
            /s3\.amazonaws\.com$/,
            /ajax\.googleapis\.com$/,
          ],
        },
      ],
      userAgentDetection: false,
    })
  })
})
