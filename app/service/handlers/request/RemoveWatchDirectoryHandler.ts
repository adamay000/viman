import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RequestChannel } from '@/ipc/channel'
import { WatchDirectory } from '@/service/models/WatchDirectory'
import { handleCommonErrors } from '@/service/handlers/error'

export class RemoveWatchDirectoryHandler extends Handler<'removeWatchDirectory'> {
  public async request(_context: HandlerContext, payload: RequestChannel['removeWatchDirectory']['request']) {
    await WatchDirectory.query()
      .delete()
      .where({ id: payload.id })
      .catch((exception) => {
        handleCommonErrors(exception)
        throw exception
      })

    return {}
  }
}
