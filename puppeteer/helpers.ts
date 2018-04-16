export function mergeMaps<K,V>(target: Map<K,V>, ...maps: Array<Map<K,V>>): Map<K,V> {
  for (const map of maps) {
    map.forEach((value, key) => target.set(key, value))
  }
  return target
}

export function objectToMap<V>(source: { [key: string]: V }): Map<string, V> {
  return new Map<string, V>(Object.entries(source))
}

export function lcFirst(string: string): string {
  if (!string) {
    return string
  }

  return `${string[0].toLowerCase()}${string.substr(1)}`
}

export function kebabToCamelCase(string: string): string {
  return string.replace(/-(.)/g, (str, arg: string) => arg.toUpperCase())
}

export function difference(first: number | undefined, second: number | undefined, factor = 1): number {
  if (typeof first !== 'number' || typeof second !== 'number') {
    return -1
  }

  if (first === -1 || second === -1) {
    return -1
  }

  return roundToThousandths((first - second) * factor)
}

export function optionalNumber(number: number | undefined) {
  if (typeof number !== 'number' || number === -1) {
    return -1
  }

  return roundToThousandths(number)
}

export function roundToThousandths(number: number): number {
  return Math.round(number * 1000) / 1000
}
