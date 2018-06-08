import { baqend } from 'baqend'
import { Request, Response } from 'express'
import { bootstrap } from './_compositionRoot'
import { DataType } from './_Serializer'

/**
 * POST: Start the smart config generation.
 */
export async function post(db: baqend, req: Request, res: Response) {
  const { body: { url, mobile = false, location = 'eu', thirdParty = true, dataType = DataType.JAVASCRIPT } } = req
  if (!url) {
    res.status(400)
    res.send({ error: 'Please provide a URL.' })
  }
  const { accept = null } = req.headers

  const { puppeteer, serializer } = bootstrap(db)

  /**
   * Converts the given JSON to a different data type.
   */
  function convert(json: string, dataType: DataType): string {
    if (dataType == DataType.JSON) {
      return json
    }

    const data = serializer.deserialize(json, DataType.JSON)
    return serializer.serialize(data, dataType)
  }

  try {
    const puppeteerData = await puppeteer.analyze(url, mobile, location, thirdParty)
    const json = puppeteerData.smartConfig

    if (accept === 'application/javascript') {
      const config = convert(json, DataType.JAVASCRIPT)
      res.header('content-type', 'application/javascript; charset=utf-8')
      res.send(config)

      return
    }

    const config = convert(json, dataType)

    res.send({ url, mobile, config, dataType })
  } catch (error) {
    res.status(500)
    res.send({ error: error.message, stack: error.stack, url, mobile })
  }
}
