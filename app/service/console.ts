/**
 * @file Replace console functions to store logs and send them to renderer.
 */

import { ipc } from '@/ipc/main'
import { MainToRendererChannel } from '@/ipc/channel'

export type HistoryObject = {
  type: MainToRendererChannel['console']['type']
  messages: Array<string>
  timestamp: number
}

const history: Array<HistoryObject> = []

export function getConsoleHistory(): ReadonlyArray<HistoryObject> {
  return history
}

/** Send console.log to renderer process via ipc. */
export function sendLogToRenderer() {
  const types: Array<MainToRendererChannel['console']['type']> = ['log', 'warn', 'error', 'debug', 'info']
  types.forEach((type) => {
    const original = console[type]
    const stringifyFailedMessage = JSON.stringify('**Cannot JSON.stringify()**')

    console[type] = (...args: Array<unknown>) => {
      original(...args)

      const log: HistoryObject = {
        type,
        messages: args.map((arg) => {
          try {
            return JSON.stringify(arg)
          } catch (exception) {
            return stringifyFailedMessage
          }
        }),
        timestamp: Date.now()
      }

      history.unshift(log)
      if (history.length > 100) {
        history.length = 100
      }

      ipc.broadcast('console', log)
    }
  })
}
