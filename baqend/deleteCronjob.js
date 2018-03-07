const credentials = require('./deleteCronjobCredentials');

exports.run = function(db) {
  return db.User.logout().then(() => {
    return db.User.login(credentials.user, credentials.password);
  }).then(() => {
    return db.send(new db.message.TruncateBucket('speedKit.Asset'));
  }).then(() => {
    let folder = db.File('/file/baqend_assets/');
    return folder.delete();
  }).then(() => {
    return db.send(new db.message.DeleteBloomFilter());
  });
};
