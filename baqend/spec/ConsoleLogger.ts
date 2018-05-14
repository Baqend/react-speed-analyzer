/**
 * Created on 2018-05-14.
 *
 * @author Konstantin Simon Maria Möllers
 */
export class ConsoleLogger implements Logger {

  debug(message: string, data?: { [p: string]: any }): void {
    console.debug(message, data)
  }

  error(message: string, data?: { [p: string]: any }): void {
    console.error(message, data)
  }

  info(message: string, data?: { [p: string]: any }): void {
    console.info(message, data)
  }

  log(message: string, data?: { [p: string]: any }): void {
    console.log(message, data)
  }

  warn(message: string, data?: { [p: string]: any }): void {
    console.warn(message, data)
  }
}
