import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RendererToMainChannel } from '@/ipc/channel'
import { addItemFromPath } from '@/service/operations/addItemFromPath'

export class FilesHandler extends Handler<'files'> {
  public request(_context: HandlerContext, payload: RendererToMainChannel['files']) {
    for (const path of payload.paths) {
      addItemFromPath(path).catch(console.error)
    }
  }
}
