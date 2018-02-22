/* eslint-disable no-use-before-define */
exports.call = function callGenerateUniqueId(db, data) {
  return generateUniqueId(db, data.entityClass, data.length);
};

/**
 * @param db The Baqend instance.
 * @param {string} entityClass
 * @param {string} length (optional)
 * @return {string}
 */
function generateUniqueId(db, entityClass, length = 5) {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let uniqueId = charSet.charAt(Math.floor(Math.random() * (charSet.length - 10)));

  for (let i = 0; i < length; i += 1) {
    uniqueId += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }

  return db[entityClass].find().eq('id', `/db/${entityClass}/${uniqueId}`).count((count) => {
    if (count > 0) {
      return generateUniqueId(db, length, entityClass);
    }

    return uniqueId;
  }).catch((error) => {
    db.log.warn(`Could not generateUniqueId with error ${error.stack}.`);
  });
}

exports.generateUniqueId = generateUniqueId;
