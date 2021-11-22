import { RendererToMainChannel, RequestChannel } from '@/ipc/channel'
import { RequestError } from '@/ipc/RequestError'
import { ipc } from '@/ipc/main'
import { App } from '@/service/index'
import { Handler } from '@/service/handlers/Handler'
import { FilesHandler } from '@/service/handlers/FilesHandler'
import { ForegroundHandler } from '@/service/handlers/ForegroundHandler'
import { NewWindowHandler } from '@/service/handlers/NewWindowHandler'
import { ConsoleHistoryHandler } from '@/service/handlers/request/ConsoleHistoryHandler'
import { SelectDirectoryHandler } from '@/service/handlers/request/SelectDirectoryHandler'
import { ItemsHandler } from '@/service/handlers/request/ItemsHandler'
import { VideosHandler } from '@/service/handlers/request/VideosHandler'
import { VideosByTagHandler } from '@/service/handlers/request/VideosByTagHandler'
import { GetAllTagsHandler } from '@/service/handlers/request/GetAllTagsHandler'
import { GetTagsHandler } from '@/service/handlers/request/GetTagsHandler'
import { AddTagHandler } from '@/service/handlers/request/AddTagHandler'
import { RemoveTagHandler } from '@/service/handlers/request/RemoveTagHandler'
import { TagSuggestionsHandler } from '@/service/handlers/request/TagSuggestionsHandler'
import { GetWatchDirectoriesHandler } from '@/service/handlers/request/GetWatchDirectoriesHandler'
import { AddWatchDirectoryHandler } from '@/service/handlers/request/AddWatchDirectoryHandler'
import { RemoveWatchDirectoryHandler } from '@/service/handlers/request/RemoveWatchDirectoryHandler'

export function initializeHandler() {
  addHandler('files', new FilesHandler())
  addHandler('foreground', new ForegroundHandler())
  addHandler('newWindow', new NewWindowHandler())

  addRequestHandler('consoleHistory', new ConsoleHistoryHandler())
  addRequestHandler('selectDirectory', new SelectDirectoryHandler())
  addRequestHandler('items', new ItemsHandler())
  addRequestHandler('videos', new VideosHandler())
  addRequestHandler('videosByTag', new VideosByTagHandler())
  addRequestHandler('getAllTags', new GetAllTagsHandler())
  addRequestHandler('getTags', new GetTagsHandler())
  addRequestHandler('addTag', new AddTagHandler())
  addRequestHandler('removeTag', new RemoveTagHandler())
  addRequestHandler('tagSuggestions', new TagSuggestionsHandler())
  addRequestHandler('getWatchDirectories', new GetWatchDirectoriesHandler())
  addRequestHandler('addWatchDirectory', new AddWatchDirectoryHandler())
  addRequestHandler('removeWatchDirectory', new RemoveWatchDirectoryHandler())
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
      console.error(exception)
    }
  })
}

function addRequestHandler<T extends keyof RequestChannel>(channel: T, handler: Handler<T>) {
  ipc.on(channel, async (event, requestId, payload) => {
    const startTime = Date.now()
    try {
      const response = await handler.request(
        {
          event,
          requestId,
          app: App.findByWindow(event.sender)
        },
        payload
      )
      ipc.respond(event.sender, channel, requestId, response)
    } catch (exception) {
      console.error(exception)

      if (RequestError.isRequestError(exception)) {
        ipc.respondError(event.sender, channel, requestId, exception)
        return
      }

      ipc.respondError(
        event.sender,
        channel,
        requestId,
        RequestError.createError({
          code: RequestError.Code.Unknown,
          message: exception.message,
          detail: null
        })
      )
    } finally {
      const elapsed = Date.now() - startTime
      console.log(`Request(id: ${requestId}) for ${channel} is done in ${elapsed}ms.`)
    }
  })
}
