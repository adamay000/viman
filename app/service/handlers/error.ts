import { RequestError } from '@/ipc/RequestError'
import { UniqueViolationError } from 'db-errors'
import { ValidationError } from 'objection'

export function handleCommonErrors(exception: Error) {
  if (exception instanceof ValidationError) {
    throw RequestError.createError({
      code: RequestError.Code.Validation,
      message: exception.message,
      detail: exception.data
    })
  }

  if (exception instanceof UniqueViolationError) {
    throw RequestError.createError({
      code: RequestError.Code.TagConstraint,
      message: exception.message,
      detail: {
        table: exception.table,
        columns: exception.columns
      }
    })
  }
}
