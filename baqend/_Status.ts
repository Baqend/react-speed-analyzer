import { StatusString } from 'baqend'

function hasStatus(entity: StatefulEntity, ...expected: StatusString[]): boolean {
  return expected.includes(entity.status) || entity.status === null
}

export enum Status {
  WAIT_FOR_PUPPETEER = 'WAIT_FOR_PUPPETEER',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export interface StatefulEntity {
  status: StatusString
  hasFinished: boolean
}

export function isQueued(entity: StatefulEntity) {
  return !entity.hasFinished && hasStatus(entity, Status.QUEUED)
}

export function isUnfinished(entity: StatefulEntity) {
  return !entity.hasFinished && hasStatus(entity, Status.QUEUED, Status.RUNNING)
}

export function isFinished(entity: StatefulEntity) {
  return entity.hasFinished || hasStatus(entity, Status.CANCELED, Status.SUCCESS, Status.INCOMPLETE, Status.FAILED)
}

export function isIncomplete(entity: StatefulEntity) {
  return entity.hasFinished && hasStatus(entity, Status.CANCELED, Status.INCOMPLETE, Status.FAILED)
}

export function isPending(entity: StatefulEntity) {
  return !entity.hasFinished && hasStatus(entity, Status.PENDING)
}

export function isFailed(entity: StatefulEntity) {
  return entity.hasFinished && hasStatus(entity, Status.FAILED)
}

/**
 * Sets the given entity to the queued state.
 */
export function setQueued(entity: StatefulEntity) {
  entity.status = Status.QUEUED
  entity.hasFinished = false
}

/**
 * Sets the given entity to the queued state.
 */
export function setWaitForPuppeteer(entity: StatefulEntity) {
  entity.status = Status.WAIT_FOR_PUPPETEER
  entity.hasFinished = false
}


/**
 * Sets the given entity to the running state.
 */
export function setRunning(entity: StatefulEntity) {
  entity.status = Status.RUNNING
  entity.hasFinished = false
}

/**
 * Sets the given entity to the canceled state.
 */
export function setCanceled(entity: StatefulEntity) {
  entity.status = Status.CANCELED
  entity.hasFinished = true
}

/**
 * Sets the given entity to the success state.
 */
export function setSuccess(entity: StatefulEntity) {
  entity.status = Status.SUCCESS
  entity.hasFinished = true
}

/**
 * Sets the given entity to the incomplete state.
 */
export function setIncomplete(entity: StatefulEntity) {
  entity.status = Status.INCOMPLETE
  entity.hasFinished = true
}

/**
 * Sets the given entity to the failed state.
 */
export function setFailed(entity: StatefulEntity) {
  entity.status = Status.FAILED
  entity.hasFinished = true
}

/**
 * Sets the given entity to the failed state.
 */
export function setPending(entity: StatefulEntity) {
  entity.status = Status.PENDING
  entity.hasFinished = false
}

