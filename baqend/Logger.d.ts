declare interface Logger {
  log(message: string, data?: { [key: string]: any}): void
  warn(message: string, data?: { [key: string]: any}): void
  info(message: string, data?: { [key: string]: any}): void
  debug(message: string, data?: { [key: string]: any}): void
  error(message: string, data?: { [key: string]: any}): void
}
