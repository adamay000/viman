import { ErrorHash } from 'objection'

export namespace RequestError {
  export enum Code {
    Validation = 'validation',
    AccessDenied = 'access-denied',
    TagConstraint = 'tag-constraint',
    PathConstraint = 'path-constraint',

    Unknown = 'unknown',
    Cancel = 'cancel'
  }

  type TypedError<C extends Code, T> = {
    code: C
    message: string
    detail: T
  }

  export type Validation = TypedError<Code.Validation, ErrorHash>
  export type AccessDenied = TypedError<
    Code.AccessDenied,
    {
      path: string
    }
  >
  export type TagConstraint = TypedError<
    Code.TagConstraint,
    {
      table: string
      columns: Array<string>
    }
  >
  export type PathConstraint = TypedError<
    Code.PathConstraint,
    {
      table: string
      columns: Array<string>
    }
  >
  export type Unknown = TypedError<Code.Unknown, null>
  export type Cancel = TypedError<Code.Cancel, null>

  export type Errors = Validation | AccessDenied | TagConstraint | PathConstraint | Unknown | Cancel

  export function createError(error: Errors): Error & Errors {
    const createdError = new Error(error.message) as Error & Errors
    createdError.message = error.message
    createdError.code = error.code
    createdError.detail = error.detail
    return createdError
  }

  export function isCancel(error: unknown) {
    return is(Code.Cancel, error)
  }

  export function is(code: Code, error: unknown) {
    return isRequestError(error) && error.code === code
  }

  export function isRequestError(error: unknown): error is Errors {
    if (typeof error !== 'object') {
      return false
    }

    const errorObject = error as Record<string, unknown>

    if (!Object.values(Code).includes(errorObject.code as Code)) {
      return false
    }

    if (typeof errorObject.message !== 'string') {
      return false
    }

    return 'detail' in errorObject
  }
}
