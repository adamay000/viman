import { UniqueViolationError } from 'objection'
import { stat as _stat } from 'fs'
import { promisify } from 'util'
import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { handleCommonErrors } from '@/service/handlers/error'
import { RequestChannel } from '@/ipc/channel'
import { RequestError } from '@/ipc/RequestError'
import { WatchDirectory } from '@/service/models/WatchDirectory'

const stat = promisify(_stat)

export class AddWatchDirectoryHandler extends Handler<'addWatchDirectory'> {
  public async request(_context: HandlerContext, payload: RequestChannel['addWatchDirectory']['request']) {
    const stats = await stat(payload.path).catch((exception) => {
      throw RequestError.createError({
        code: RequestError.Code.AccessDenied,
        message: exception.message,
        detail: {
          path: payload.path
        }
      })
    })

    if (!stats.isDirectory()) {
      throw RequestError.createError({
        code: RequestError.Code.AccessDenied,
        message: 'File is not directory.',
        detail: {
          path: payload.path
        }
      })
    }

    const watchDirectory = await WatchDirectory.query()
      .insertAndFetch({
        path: payload.path,
        recursive: payload.recursive
      })
      .catch((exception) => {
        if (exception instanceof UniqueViolationError) {
          throw RequestError.createError({
            code: RequestError.Code.PathConstraint,
            message: exception.message,
            detail: {
              table: exception.table,
              columns: exception.columns
            }
          })
        }

        handleCommonErrors(exception)
        throw exception
      })

    console.log(
      `New watchDirectory is added: id=${watchDirectory.id} path=${watchDirectory.path} recursive=${watchDirectory.recursive}`
    )

    return {
      id: watchDirectory.id
    }
  }
}
