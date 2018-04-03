import { EntityManager } from 'baqend'

/**
 * @param db The Baqend instance.
 * @param entityClass
 * @param length (optional)
 * @return {Promise<string>}
 */
export function generateUniqueId(db: EntityManager, entityClass: string, length: number = 5): Promise<string> {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let uniqueId = charSet.charAt(Math.floor(Math.random() * (charSet.length - 10)));

  for (let i = 0; i < length; i += 1) {
    uniqueId += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }

  return db[entityClass].find().eq('id', `/db/${entityClass}/${uniqueId}`).count((count) => {
    if (count > 0) {
      return generateUniqueId(db, entityClass, length);
    }

    return uniqueId;
  }).catch((error) => {
    db.log.warn(`Could not generateUniqueId with error ${error.stack}.`);
    return null;
  });
}

export function call(db, data) {
  return generateUniqueId(db, data.entityClass, data.length);
}
