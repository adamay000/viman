import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { getConsoleHistory } from '@/service/console'
import { RequestChannel } from '@/ipc/channel'

export class ConsoleHistoryHandler extends Handler<'consoleHistory'> {
  public async request(_context: HandlerContext, payload: RequestChannel['consoleHistory']['request']) {
    const history = getConsoleHistory()
      .filter(({ timestamp }) => timestamp < payload.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp)
    return await Promise.resolve({
      history
    })
  }
}
