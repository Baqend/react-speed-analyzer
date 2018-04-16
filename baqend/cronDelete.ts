import { baqend } from 'baqend'
import credentials from './credentials'

export async function run(db: baqend) {
  await db.User.logout()
  await db.User.login(credentials.delete_cronjob_user, credentials.delete_cronjob_password)

  await db.send(new db.message.TruncateBucket('speedKit.Asset'))

  const folder = new db.File('/file/baqend_assets/')
  await folder.delete()

  await db.send(new db.message.DeleteBloomFilter())
}
