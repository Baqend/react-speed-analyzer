exports.run = function(db) {
  return db.User.logout().then(() => {
    return db.User.login('adminUser', 'GdrsF+DZ]2,+~4.R')
  }).then(() => {
    let folder = db.File('/file/baqend_assets/');
    return folder.delete()
  }).then(() => {
    return db.send(new db.message.DeleteBloomFilter());
  });
}
