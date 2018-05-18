export enum DataType {
  JAVASCRIPT = 'javascript',
  JSON = 'json',
}

export class Serializer {
  /**
   * Serializes given data as the given type.
   */
  serialize(data: any, type: DataType): string {
    switch (type) {
      case DataType.JAVASCRIPT:
        return this.serializeJavascript(data)
      case DataType.JSON:
        return this.serializeJson(data)
      default:
        throw new Error(`Invalid type specified: ${type}. Must be one of ${DataType}`)
    }
  }

  /**
   * Deserializes given data as the given type.
   */
  deserialize(data: string, type: DataType): any {
    const decoded = this.decode(data, type)
    return this.denormalize(decoded)
  }

  /**
   * Decodes given data from the given type.
   */
  decode(data: string, type: DataType): any {
    switch (type) {
      case DataType.JSON:
        return JSON.parse(data)
      default:
        throw new Error(`Invalid type specified: ${type}. Must be one of ${DataType}`)
    }
  }

  /**
   * Denormalizes the data of a JSON.
   */
  denormalize(data: any): any {
    if (typeof data === 'string') {
      // Is it an encoded regular expression?
      const match = /^regexp:\/(.*)\/([\w]*)$/.exec(data)
      if (match) {
        const [, source, flags] = match
        return new RegExp(source, flags)
      }

      return data
    }

    if (typeof data !== 'object') {
      return data
    }

    if (data === null) {
      return data
    }

    if (data instanceof Array) {
      return data.map(item => this.denormalize(item))
    }

    const obj = Object.create(null)
    for (const [key, value] of Object.entries(data)) {
      obj[key] = this.denormalize(value)
    }

    return obj
  }

  /**
   * Serializes data to executable JavaScript.
   */
  private serializeJavascript(thing: any, indent = ''): string {
    if (typeof thing == 'undefined') {
      return 'void 0'
    }

    if (typeof thing != 'object') {
      return JSON.stringify(thing)
    }

    if (thing === null) {
      return 'null'
    }

    if (thing instanceof RegExp) {
      return `/${thing.source}/${thing.flags || ''}`
    }

    const innerIndent = `${indent}  `
    if (thing instanceof Array) {
      return `[\n${thing.map(it => `${innerIndent}${this.serializeJavascript(it, innerIndent)}`).join(',\n')}\n${indent}]`
    }

    // Handle as simple object
    const objectContents = Object
      .entries(thing)
      .map(([key, value]) => `${innerIndent}${this.escapeKey(key)}: ${this.serializeJavascript(value, innerIndent)}`)
      .join(',\n')
    return `{\n${objectContents}\n${indent}}`
  }

  /**
   * Converts something to JSON.
   *
   * @param thing The thing to serialize as JSON.
   * @return A JSON string.
   */
  private serializeJson(thing: any): string {
    return JSON.stringify(thing, ((key, value) => {
      if (value instanceof RegExp) {
        return `regexp:/${value.source}/${value.flags || ''}`
      }

      return value
    }))
  }

  /**
   * Escapes an object key for JavaScript serialization.
   */
  private escapeKey(key: string): string {
    if (key.match(/[a-z][0-9a-z]*/i)) {
      return key
    }

    return `"${key}"`
  }
}
