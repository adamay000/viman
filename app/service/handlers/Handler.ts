import { IpcMainEvent } from 'electron'
import { RendererToMainChannel, RequestChannel, RequestId } from '@/ipc/channel'
import { App } from '@/service'
export interface HandlerContext {
  event: IpcMainEvent
  requestId: RequestId
  app: App | null
}
export abstract class Handler<T extends keyof RendererToMainChannel | keyof RequestChannel> {
  public abstract request(
    context: HandlerContext,
    payload: T extends keyof RendererToMainChannel
      ? RendererToMainChannel[T]
      : T extends keyof RequestChannel
      ? RequestChannel[T]['request']
      : never
  ): T extends keyof RendererToMainChannel
    ? void
    : T extends keyof RequestChannel
    ? Promise<RequestChannel[T]['response']>
    : never
}
