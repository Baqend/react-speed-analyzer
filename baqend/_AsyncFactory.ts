export interface AsyncFactory<T> {

  /**
   * Creates the object which is demanded by this factory.
   *
   * @return A promise which resolves with the created object.
   */
  create(...args: any[]): Promise<T>
}
