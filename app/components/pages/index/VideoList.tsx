import { shell } from 'electron'
import { FunctionComponent, memo, useCallback, useEffect, useState, useMemo } from 'react'
import { AutoSizer, Grid, GridCellRenderer } from 'react-virtualized'
import { RequestChannel } from '@/ipc/channel'
import { CancellableRequest, ipc } from '@/ipc/renderer'
import { Thumbnail } from '@/components/pages/index/Thumbnail'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from '@/constants'
import { noop } from '@/utilities/noop'
import styles from '@/components/pages/index/VideoList.module.sass'

interface VideoListProps {
  column: number
  filter: string
  autospeed: number
  seek: boolean
}

function useRequestVideos() {
  const [videos, setVideos] = useState<RequestChannel['videos']['response']['videos']>([])

  useEffect(() => {
    let req: CancellableRequest<'videos'> | null = null
    const request = async () => {
      req = ipc.request('videos')
      try {
        const response = await req
        if (videos.length !== response.videos.length) {
          setVideos(response.videos)
        }
      } catch (exception) {
        // do nothing
      }
    }
    const interval = setInterval(request, 5000)
    request().catch(noop)
    return () => {
      clearInterval(interval)
      req?.cancel()
    }
  }, [])

  return { videos }
}

export const VideoList: FunctionComponent<VideoListProps> = memo(({ column, filter, autospeed, seek }) => {
  const { videos } = useRequestVideos()
  const filteredVideos = useMemo(
    () => videos.filter((video) => !filter || new RegExp(filter, 'i').test(video.path)),
    [videos.length, filter]
  )

  const openApplication = useCallback((path: string) => shell.openItem(path), [])

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
                  <div key={video.path + index} style={style} onClick={() => openApplication(video.path)}>
                    <Thumbnail
                      path={`thumbnail://${video.id}`}
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
    <div className={styles.cVideoList}>
      <div className={styles.info}>Count: {filteredVideos.length}</div>
      <div className={styles.videos}>{$videoGrid}</div>
    </div>
  )
})

VideoList.displayName = 'VideoList'
