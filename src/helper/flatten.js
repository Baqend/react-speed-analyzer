export function flatten(arr) {
  return arr.reduce(
    (acc, val) => acc.concat(
      Array.isArray(val) ? flatten(val) : val
    ), []
  )
}
