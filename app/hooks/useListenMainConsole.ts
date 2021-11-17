import { useEffect } from 'react'
import { ipc, Listener } from '@/ipc/renderer'
import { noop } from '@/utilities/noop'

/** Show console logs in main process. They are sent through ipc. */
export function useListenMainConsole() {
  const style = 'background: #09c; border-radius: 0.5em; color: #fff; font-weight: bold; padding: 2px 0.5em;'
  const timestampStyle = 'color: #999; font-size: 80%; letter-spacing: -3px'
  const failedParseMessage = JSON.stringify('**Cannot JSON.parse()**')
  const log = ({ type, messages, timestamp }: { type: keyof Console; messages: Array<string>; timestamp: number }) => {
    const date = new Date(timestamp)
    // Simple formatting. It seems we can't display millisecond by toLocaleString().
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`

    console[type](
      `%cMain%c [${time}]`,
      style,
      timestampStyle,
      ...messages.map((message) => {
        try {
          return JSON.parse(message)
        } catch (exception) {
          return failedParseMessage
        }
      })
    )
  }

  useEffect(() => {
    ipc
      .request('consoleHistory', { timestamp: Date.now() })
      .then(({ history }) => {
        if (history.length === 0) {
          console.log('%cNo log from main process.', style)
          return
        }

        console.groupCollapsed(`%cMain process logs(${history.length}):`, style)
        history.forEach(log)
        console.groupEnd()
      })
      .catch(noop)

    const listener: Listener<'console'> = (_event, payload) => {
      log(payload)
    }

    ipc.on('console', listener)

    return () => {
      ipc.off('console', listener)
    }
  }, [])
}
