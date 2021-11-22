import { dialog } from 'electron'
import { Handler, HandlerContext } from '@/service/handlers/Handler'

export class SelectDirectoryHandler extends Handler<'selectDirectory'> {
  public async request(context: HandlerContext) {
    if (!context.app) {
      return { path: null }
    }
    const result = await dialog.showOpenDialog(context.app.window, {
      properties: ['openDirectory']
    })
    return {
      path: result.filePaths[0] || null
    }
  }
}
