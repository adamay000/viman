import { FunctionComponent, memo, useCallback, useMemo, useState } from 'react'
import { AutoSizer, Grid, GridCellRenderer } from 'react-virtualized'
import { VideoCell } from '@/components/global/videos/VideoCell'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from '@/constants'
import styles from '@/components/global/videos/VideoList.module.sass'

interface VideoListProps {
  videos: Array<{
    id: number
    path: string
    size: number
    duration: number
    thumbnailTimestamps: Array<number>
  }>
}

export const VideoList: FunctionComponent<VideoListProps> = memo(({ videos }) => {
  const [column, setColumn] = useState(4)
  const [filter, setFilter] = useState('')
  const [autospeed, setAutospeed] = useState(500)
  const [seek, setSeek] = useState(true)

  const filteredVideos = useMemo(
    () => videos.filter((video) => !filter || new RegExp(filter, 'i').test(video.path)),
    [videos.map(({ id }) => id).join(','), filter]
  )

  const $videoGrid = (
    <AutoSizer>
      {({ width, height }) => {
        const thumbnailWidth = Math.floor(width / column)
        const thumbnailHeight = (thumbnailWidth * THUMBNAIL_HEIGHT) / THUMBNAIL_WIDTH
        return (
          <Grid
            autoContainerWidth
            columnCount={column}
            rowCount={Math.ceil(filteredVideos.length / column)}
            columnWidth={thumbnailWidth}
            rowHeight={thumbnailHeight}
            width={width}
            height={height}
            tabindex={-1}
            cellRenderer={
              (({ isVisible, columnIndex, rowIndex, style }) => {
                if (!isVisible) return null
                const index = columnIndex + rowIndex * column
                const video = filteredVideos[index]
                if (!video) return null
                return (
                  <div key={video.id} style={style}>
                    <VideoCell
                      id={video.id}
                      path={video.path}
                      width={thumbnailWidth}
                      height={thumbnailHeight}
                      timestamps={video.thumbnailTimestamps}
                      duration={video.duration}
                      autospeed={autospeed}
                      seek={seek}
                    />
                  </div>
                )
              }) as GridCellRenderer
            }
          />
        )
      }}
    </AutoSizer>
  )

  return (
    <section className={styles.cVideoList}>
      <header className={styles.videosettings}>
        Size:
        <input
          type="range"
          min={1}
          max={10}
          value={column}
          onChange={useCallback((e) => setColumn(Number(e.target.value)), [])}
        />
        Speed:
        <input
          type="range"
          min={50}
          max={1000}
          value={autospeed}
          onChange={useCallback((e) => setAutospeed(Number(e.target.value)), [])}
        />
        Seek:
        <input
          type="checkbox"
          defaultChecked={seek}
          onClick={useCallback(() => setSeek((prevSeek) => !prevSeek), [])}
        />
        Filter:
        <input type="text" value={filter} onInput={useCallback((e) => setFilter(e.target.value), [])} />
      </header>

      <div className={styles.videos}>
        <div className={styles.info}>Count: {filteredVideos.length}</div>
        <div className={styles.videogrid}>{$videoGrid}</div>
      </div>
    </section>
  )
})

VideoList.displayName = 'VideoList'
