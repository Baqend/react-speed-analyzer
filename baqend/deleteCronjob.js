const credentials = require('./credentials');

exports.run = function(db) {
  return db.User.logout().then(() => {
    return db.User.login(credentials.delete_cronjob_user, credentials.delete_cronjob_password);
  }).then(() => {
    return db.send(new db.message.TruncateBucket('speedKit.Asset'));
  }).then(() => {
    let folder = db.File('/file/baqend_assets/');
    return folder.delete();
  }).then(() => {
    return db.send(new db.message.DeleteBloomFilter());
  });
};
