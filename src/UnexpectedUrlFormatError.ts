/**
 * This error is thrown by functions that expect a URL to be in a certain format
 * and are given a URL (or other text string) that does not match the expected format.
 * @member {string} message `Unexpected URL format. ${url} does not match ${expectedFormat}`
 */
export class UnexpectedUrlFormatError extends Error {
  /**
   * Creates a new instance of the class.
   * @param url The URL that caused the exception.
   * @param expectedFormat The regular expression showing the format that was expected.
   */
  constructor(public url: string, public expectedFormat: RegExp) {
    super(`Unexpected URL format. ${url} does not match ${expectedFormat}`);
  }
}
