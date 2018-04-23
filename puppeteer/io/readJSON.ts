import { readFile } from 'fs'

export function readJSON(filename: string, otherwise = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    readFile(filename, 'utf8', (err, data) => {
      if (err) {
        resolve(otherwise)
      } else {
        try {
          const json = JSON.parse(data)
          resolve(json)
        } catch (e) {
          resolve(otherwise)
        }
      }
    })
  })
}
