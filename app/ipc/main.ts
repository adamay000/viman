import { ipcMain, IpcMainEvent, WebContents } from 'electron'
import { MainToRendererChannel, RendererToMainChannel, RequestChannel, RequestId } from '@/ipc/channel'
import { RequestError } from '@/ipc/RequestError'
import { App } from '@/service'

// Wrap ipcMain to achieve type-safe connection
export const ipc = {
  broadcast<T extends keyof MainToRendererChannel>(
    channel: T,
    ...[payload]: MainToRendererChannel[T] extends void ? [] : [MainToRendererChannel[T]]
  ) {
    for (const app of App.getAllInstances()) {
      app.window.webContents.send(channel, null, payload)
    }
  },
  respond<T extends keyof RequestChannel>(
    sender: WebContents,
    channel: T,
    requestId: RequestId,
    payload: RequestChannel[T]['response']
  ) {
    sender.send(channel, requestId, payload)
  },
  respondError<T extends keyof RequestChannel>(
    sender: WebContents,
    channel: T,
    requestId: RequestId,
    error: RequestError.Errors
  ) {
    sender.send(channel, requestId, {
      code: error.code,
      message: error.message,
      detail: error.detail
    })
  },
  on<T extends keyof RendererToMainChannel | keyof RequestChannel>(
    channel: T,
    listener: (
      event: IpcMainEvent,
      requestId: RequestId,
      payload: T extends keyof RendererToMainChannel
        ? RendererToMainChannel[T]
        : T extends keyof RequestChannel
        ? RequestChannel[T]['request']
        : never
    ) => void | Promise<void>
  ) {
    ipcMain.on(channel, async (event, requestId, payload) => {
      await listener(event, requestId, payload)
    })
  }
}
