/**
 * Resource type as it was perceived by the rendering engine.
 */
export enum ResourceType {
  DOCUMENT = 'Document',
  STYLESHEET = 'Stylesheet',
  IMAGE = 'Image',
  MEDIA = 'Media',
  FONT = 'Font',
  SCRIPT = 'Script',
  TEXT_TRACK = 'TextTrack',
  XHR = 'XHR',
  FETCH = 'Fetch',
  EVENT_SOURCE = 'EventSource',
  WEB_SOCKET = 'WebSocket',
  MANIFEST = 'Manifest',
  SIGNED_EXCHANGE = 'SignedExchange',
  PING = 'Ping',
  CSP_VIOLATION_REPORT = 'CSPViolationReport',
  OTHER = 'Other',
}
