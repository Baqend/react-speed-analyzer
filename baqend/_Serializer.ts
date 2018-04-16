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
    switch (type) {
      case DataType.JSON:
        return this.deserializeJson(data)
      default:
        throw new Error(`Invalid type specified: ${type}. Must be one of ${DataType}`)
    }
  }

  /**
   * Serializes data to executable JavaScript.
   */
  private serializeJavascript(thing: any): string {
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

    if (thing instanceof Array) {
      return `[${thing.map(it => this.serializeJavascript(it)).join(', ')}]`
    }

    // Handle as simple object
    const objectContents = Object
      .entries(thing)
      .map(([key, value]) => `${this.escapeKey(key)}: ${this.serializeJavascript(value)}`)
      .join(', ')
    return `{ ${objectContents} }`
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
   * Converts something from JSON.
   */
  private deserializeJson(thing: string): any {
    return JSON.parse(thing, ((key, value) => {
      if (typeof value === 'string') {
        const match = /^regexp:\/(.*)\/([\w]*)$/.exec(value)
        if (match) {
          const [, source, flags] = match
          return new RegExp(source, flags)
        }
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
