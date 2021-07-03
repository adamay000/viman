import { basename, extname } from 'path'
import { stat } from 'fs'
import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RendererToMainChannel } from '@/ipc/channel'
import { Item } from '@/service/models/Item'

export class FilesHandler extends Handler<'files'> {
  public request(_context: HandlerContext, payload: RendererToMainChannel['files']) {
    for (const path of payload.paths) {
      stat(path, async (err, stats) => {
        if (err) {
          console.error(`Failed to get stats for ${path}.`, err)
          return
        }
        if (!stats.isFile()) return
        await this.addItem(path, stats.size).catch((exception) => {
          console.error(`Failed to add item to database for ${path}.`, exception)
        })
      })
    }
  }

  private async addItem(path: string, size: number) {
    const id = Item.generateId(path, size)
    ;(await Item.query().where('id', id).first()) ||
      (await Item.query().insertAndFetch({
        id,
        path,
        filename: basename(path),
        extension: extname(path),
        size: size
      }))
  }
}
