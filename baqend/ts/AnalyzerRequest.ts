export interface AnalyzerRequest<T> {

  /**
   * Creates the object which is demanded by this request.
   *
   * @return The created object demanded by the request.
   */
  create(): Promise<T>
}
