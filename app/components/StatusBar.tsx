import { FunctionComponent, memo, useEffect, useState } from 'react'
import { ipc, Listener } from '@/ipc/renderer'
import styles from '@/components/StatusBar.module.sass'

function useListenStatus() {
  const [status, setStatus] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => {
    const listener: Listener<'status'> = (_event, payload) => {
      setStatus(payload.message)
      setDetails(payload.details)
    }

    ipc.on('status', listener)

    return () => {
      ipc.off('status', listener)
    }
  }, [])

  return {
    status,
    details
  }
}

export const StatusBar: FunctionComponent = memo(() => {
  const { status, details } = useListenStatus()

  return (
    <div className={styles.cStatusBar}>
      <p className={styles.message}>{status}</p>
      <p className={styles.details}>{details}</p>
    </div>
  )
})

StatusBar.displayName = 'StatusBar'
