import { FunctionComponent, ReactNode, memo } from 'react'
import { VideoControls } from '@/components/global/videos/VideoControls'
import styles from '@/components/global/Header.module.sass'

interface HeaderProps {
  videoControls?: boolean
  filter?: string
  setFilter?: (filter: string) => void
  children?: ReactNode
}

function useCreateVideoControls(videoControls: boolean) {
  if (!videoControls) {
    return null
  }

  return (
    <div className={styles.item}>
      <VideoControls />
    </div>
  )
}

function useCreateFilter(filter?: string, setFilter?: (filter: string) => void) {
  if (filter === undefined) {
    return null
  }

  if (setFilter === undefined) {
    throw new Error('setFilter is required when filter is enabled.')
  }

  return (
    <div className={styles.item}>
      <input className={styles.filter} type="text" value={filter} onInput={(e) => setFilter(e.currentTarget.value)} />
    </div>
  )
}

export const Header: FunctionComponent<HeaderProps> = memo<HeaderProps>(
  ({ videoControls = false, filter, setFilter, children }) => {
    const $videoControls = useCreateVideoControls(videoControls)
    const $filter = useCreateFilter(filter, setFilter)

    return (
      <header className={styles.cHeader}>
        <div className={styles.title}>{children}</div>
        {($videoControls || $filter) && (
          <div className={styles.options}>
            {$videoControls}
            {$filter}
          </div>
        )}
      </header>
    )
  }
)

Header.displayName = 'Header'
