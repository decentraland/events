enum StatusCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  IAmATeapot = 418,
  TooManyRequests = 429,
  InternalServerError = 500,
  NotImplemented = 501,
  ServiceUnavailable = 503,
}

export default class RequestError extends Error {

  static StatusCode = StatusCode

  constructor(message: string, public statusCode: StatusCode = StatusCode.InternalServerError, public data?: any) {
    super(message)
  }
}
