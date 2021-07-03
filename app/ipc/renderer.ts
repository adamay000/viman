import { IpcRenderer, IpcRendererEvent } from 'electron'
import isElectron from 'is-electron'
import { MainToRendererChannel, RendererToMainChannel, RequestChannel, RequestId } from '@/ipc/channel'
import { noop } from '@/utilities/noop'

// Avoid to load electron on browser because it causes module error by accessing to fs
// Replace methods to empty functions
const ipcRenderer = isElectron()
  ? window.ipcRenderer
  : {
      send: noop,
      on: noop,
      removeListener: noop
    }

export interface Listener<T extends keyof MainToRendererChannel> {
  (event: IpcRendererEvent, payload: MainToRendererChannel[T]): void
}

const listeners = new Map<Listener<keyof MainToRendererChannel>, Parameters<IpcRenderer['on']>[1]>()

let requestId = 0

export class CancellableRequest<T extends keyof RequestChannel> extends Promise<RequestChannel[T]['response']> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cancel() {}
}

// Wrap ipcRenderer to achieve type-safe connection
export const ipc = {
  send<T extends keyof RendererToMainChannel>(
    channel: T,
    ...[payload]: RendererToMainChannel[T] extends void ? [] : [RendererToMainChannel[T]]
  ) {
    requestId += 1
    ipcRenderer.send(channel, requestId, payload)
  },
  on<T extends keyof MainToRendererChannel>(channel: T, listener: Listener<T>) {
    const on = ((event, _requestId, payload) => {
      listener(event, payload)
    }) as Parameters<IpcRenderer['on']>[1]
    listeners.set(listener as Listener<keyof MainToRendererChannel>, on)
    ipcRenderer.on(channel, on)
  },
  off<T extends keyof MainToRendererChannel>(channel: T, listener: Listener<T>) {
    const on = listeners.get(listener as Listener<keyof MainToRendererChannel>)
    if (on) {
      ipcRenderer.removeListener(channel, on)
    }
  },
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  request<T extends keyof RequestChannel>(
    channel: T,
    ...[payload]: RequestChannel[T]['request'] extends void ? [] : [RequestChannel[T]['request']]
  ): CancellableRequest<T> {
    let resolve: (_value: RequestChannel[T]['response']) => void = noop
    let reject: (_value?: Error) => void = noop
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    }) as CancellableRequest<T>
    promise.cancel = reject

    requestId += 1
    const id = requestId

    ipcRenderer.send(channel, id, payload)

    const listener = (_event: IpcRendererEvent, requestId: RequestId, payload: RequestChannel[T]['response']) => {
      if (requestId === id) {
        ipcRenderer.removeListener(channel, listener)

        resolve(payload)
      }
    }

    promise.catch(() => {
      ipcRenderer.removeListener(channel, listener)
    })

    ipcRenderer.on(channel, listener)

    return promise
  }
}
