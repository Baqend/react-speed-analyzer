import { baqend } from 'baqend'

/**
 * @param db          The Baqend instance.
 * @param entityClass The class to generate an ID for.
 * @param length      The ID's length (optional).
 * @return The generated unique ID.
 */
export async function generateUniqueId(db: baqend, entityClass: string, length: number = 5): Promise<string> {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let uniqueId = charSet.charAt(Math.floor(Math.random() * (charSet.length - 10)))

  for (let i = 0; i < length; i += 1) {
    uniqueId += charSet.charAt(Math.floor(Math.random() * charSet.length))
  }

  try {
    const count = await db[entityClass].find().eq('id', `/db/${entityClass}/${uniqueId}`).count()
    if (count > 0) {
      return generateUniqueId(db, entityClass, length)
    }

    return uniqueId
  } catch (error) {
    db.log.warn(`Could not generateUniqueId with error ${error.stack}.`)
    throw new Error(`Could not generateUniqueId with error: ${error.message}`)
  }
}

/**
 * Baqend code API call.
 */
export function call(db: baqend, data: { entityClass: string, length: number}): Promise<string> {
  const { entityClass, length = 5 } = data

  return generateUniqueId(db, entityClass, length)
}
