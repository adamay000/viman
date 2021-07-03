import { basename } from 'path'
import { FunctionComponent, Fragment, memo, useEffect, useState, useMemo, useCallback, MouseEvent } from 'react'
import { toTime } from '@/utilities/time'
import { THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT } from '@/constants'
import styles from '@/components/pages/index/Thumbnail.module.sass'

interface ThumbnailProps {
  path: string
  width: number
  height: number
  timestamps: Array<number>
  duration: number
  autospeed: number
  seek: boolean
}

function useControlFrame(autospeed: ThumbnailProps['autospeed'], frameLength: number) {
  const [isHover, setIsHover] = useState(false)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (isHover) {
        return
      }
      setFrame((prevFrame) => (prevFrame >= frameLength - 1 ? 0 : prevFrame + 1))
    }, autospeed)
    return () => {
      clearInterval(interval)
    }
  }, [isHover, autospeed, frameLength])

  const onMouseMove = useCallback((event: MouseEvent<HTMLElement>) => {
    setIsHover(true)
    const { width, x } = event.currentTarget.getBoundingClientRect()
    const progress = Math.max(0, Math.min(1, (event.clientX - x) / width))

    const frame = Math.round((frameLength - 1) * progress)
    setFrame(frame)
  }, [])

  const onMouseLeave = useCallback(() => {
    setIsHover(false)
  }, [])

  return {
    frame,
    onMouseMove,
    onMouseLeave
  }
}

export const Thumbnail: FunctionComponent<ThumbnailProps> = memo(
  ({ path, width, height, timestamps, duration, autospeed, seek }) => {
    const { frame, onMouseMove, onMouseLeave } = useControlFrame(autospeed, timestamps.length)

    const filename = useMemo(() => basename(path), [path])
    const time = useMemo(() => toTime(duration), [duration])
    const tick = useMemo(
      () => toTime(duration * (frame / timestamps.length), duration > 3600),
      [duration, frame, timestamps.length]
    )

    const $thumbnail = useMemo(
      () => (
        <div
          className={styles.image}
          style={{
            width: THUMBNAIL_WIDTH,
            height: THUMBNAIL_HEIGHT,
            backgroundImage: `url("${encodeURI(path)}")`,
            backgroundPosition: `${-frame * THUMBNAIL_WIDTH}px 0`,
            transform: `scale(${width / THUMBNAIL_WIDTH})`
          }}
        />
      ),
      [path, frame, width]
    )

    const $seek = useMemo(
      () => (
        <Fragment>
          <div className={styles.time}>
            {tick} / {time}
          </div>
          {seek && <div className={styles.seek} style={{ width: `${(100 * frame) / timestamps.length}%` }} />}
        </Fragment>
      ),
      [tick, time, seek, frame, timestamps.length]
    )

    return (
      <div
        title={filename}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className={styles.cThumbnail}
        style={{ width, height }}
      >
        {$thumbnail}
        {$seek}
      </div>
    )
  }
)

Thumbnail.displayName = 'Thumbnail'
