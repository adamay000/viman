import { RendererToMainChannel, RequestChannel } from '@/ipc/channel'
import { ipc } from '@/ipc/main'
import { App } from '@/service/index'
import { Handler } from '@/service/handlers/Handler'
import { FilesHandler } from '@/service/handlers/FilesHandler'
import { ForegroundHandler } from '@/service/handlers/ForegroundHandler'
import { NewWindowHandler } from '@/service/handlers/NewWindowHandler'
import { ConsoleHistoryHandler } from '@/service/handlers/request/ConsoleHistoryHandler'
import { ItemsHandler } from '@/service/handlers/request/ItemsHandler'
import { VideosHandler } from '@/service/handlers/request/VideosHandler'
import { AddTagHandler } from '@/service/handlers/request/AddTagHandler'
import { RemoveTagHandler } from '@/service/handlers/request/RemoveTagHandler'

export function initializeHandler() {
  addHandler('files', new FilesHandler())
  addHandler('foreground', new ForegroundHandler())
  addHandler('newWindow', new NewWindowHandler())

  addRequestHandler('consoleHistory', new ConsoleHistoryHandler())
  addRequestHandler('items', new ItemsHandler())
  addRequestHandler('videos', new VideosHandler())
  addRequestHandler('addTag', new AddTagHandler())
  addRequestHandler('removeTag', new RemoveTagHandler())
}

function addHandler<T extends keyof RendererToMainChannel>(channel: T, handler: Handler<T>) {
  ipc.on(channel, async (event, requestId, payload) => {
    console.log(`Got request for '${channel}'. requestId is ${requestId}`)
    try {
      await handler.request(
        {
          event,
          requestId,
          app: App.findByWindow(event.sender)
        },
        payload
      )
    } catch (exception) {
      // TODO handle request error
      console.error(exception)
    }
  })
}

function addRequestHandler<T extends keyof RequestChannel>(channel: T, handler: Handler<T>) {
  ipc.on(channel, async (event, requestId, payload) => {
    const response = await handler.request(
      {
        event,
        requestId,
        app: App.findByWindow(event.sender)
      },
      payload
    )

    try {
      ipc.respond(event.sender, channel, requestId, response)
    } catch (exception) {
      console.error(exception)
    }
  })
}
