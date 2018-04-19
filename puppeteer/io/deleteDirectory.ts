import rimraf from 'rimraf'

/**
 * Deletes a directory.
 */
export function deleteDirectory(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    rimraf(dir, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
