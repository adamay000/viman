import { FunctionComponent, memo, useCallback } from 'react'
import { useGlobalState } from '@/store'
import { VIDEO_COLUMN_MIN, VIDEO_COLUMN_MAX, VIDEO_AUTOSPEED_MIN, VIDEO_AUTOSPEED_MAX } from '@/constants'
import styles from '@/components/global/videos/VideoControls.module.sass'

export const VideoControls: FunctionComponent = memo(() => {
  const [column, setColumn] = useGlobalState('column')
  const [speed, setSpeed] = useGlobalState('autospeed')

  return (
    <div className={styles.cVideoControls}>
      <div className={styles.item}>
        <div className={styles.title}>Column</div>
        <input
          className={styles.range}
          type="range"
          min={VIDEO_COLUMN_MIN}
          max={VIDEO_COLUMN_MAX}
          value={column}
          onChange={useCallback((e) => setColumn(Number(e.target.value)), [])}
        />
      </div>
      <div className={styles.item}>
        <div className={styles.title}>Speed</div>
        <input
          className={styles.range}
          type="range"
          min={VIDEO_AUTOSPEED_MIN}
          max={VIDEO_AUTOSPEED_MAX}
          value={speed}
          onChange={useCallback((e) => setSpeed(Number(e.target.value)), [])}
        />
      </div>
    </div>
  )
})

VideoControls.displayName = 'VideoControls'
