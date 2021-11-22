import { RequestError } from '@/ipc/RequestError'
import { ValidationError } from 'objection'

export function handleCommonErrors(exception: Error) {
  if (exception instanceof ValidationError) {
    throw RequestError.createError({
      code: RequestError.Code.Validation,
      message: exception.message,
      detail: exception.data
    })
  }
}
