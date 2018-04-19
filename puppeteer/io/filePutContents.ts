import { writeFile } from 'fs'

/**
 * Puts a buffer's content to a file.
 */
export function filePutContents(path: string, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    writeFile(path, data, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
