import { shell } from 'electron'
import { FunctionComponent, memo, useCallback, useEffect, useRef, useState } from 'react'
import { ipc } from '@/ipc/renderer'
import { RequestError } from '@/ipc/RequestError'
import { TagInput, TagInputHandle } from '@/components/pages/index/TagInput'
import { Thumbnail } from '@/components/pages/index/Thumbnail'
import styles from '@/components/pages/index/VideoCell.module.sass'

interface VideoCellProps {
  id: number
  path: string
  width: number
  height: number
  timestamps: Array<number>
  duration: number
  autospeed: number
  seek: boolean
}

function useManageTags(itemId: number, clearInput: () => void) {
  const [tags, setTags] = useState<Array<{ tagId: number; tagName: string }>>([])
  const [isUpdatingTag, setIsUpdatingTag] = useState(false)

  useEffect(() => {
    // TODO Request tag list
  }, [])

  const addTag = useCallback(
    async (tagName: string) => {
      if (isUpdatingTag) return
      setIsUpdatingTag(true)

      try {
        const response = await ipc.request('addTag', {
          tagName,
          itemId
        })
        setTags(response.tags)
        clearInput()
      } catch (exception) {
        if (RequestError.isCancel(exception)) {
          return
        }
        if (RequestError.is(RequestError.Code.TagConstraint, exception)) {
          return
        }
        if (RequestError.is(RequestError.Code.Validation, exception)) {
          alert(exception.message)
          return
        }
        console.error(exception)
      } finally {
        setIsUpdatingTag(false)
      }
    },
    [itemId, isUpdatingTag]
  )

  const removeTag = useCallback(
    async (tagId: number) => {
      try {
        const response = await ipc.request('removeTag', {
          itemId,
          tagId
        })
        setTags(response.tags)
      } catch (exception) {
        console.error(exception)
      }
    },
    [itemId]
  )

  return {
    tags,
    isUpdatingTag,
    addTag,
    removeTag
  }
}

export const VideoCell: FunctionComponent<VideoCellProps> = memo(
  ({ id, path, width, height, timestamps, duration, autospeed, seek }) => {
    const [isShowDetail, setIsShowDetail] = useState(false)

    const tagInputRef = useRef<TagInputHandle>(null)

    const { tags, isUpdatingTag, addTag, removeTag } = useManageTags(
      id,
      useCallback(() => tagInputRef.current?.clear(), [])
    )

    const openApplication = useCallback(() => !isShowDetail && shell.openItem(path), [path, isShowDetail])
    const showDetail = useCallback(() => setIsShowDetail(true), [])
    const hideDetail = useCallback(() => setIsShowDetail(false), [])

    useEffect(() => {
      tagInputRef.current?.focus()
    }, [isShowDetail])

    return (
      <div className={styles.cVideoCell} onClick={openApplication} onContextMenu={showDetail}>
        {isShowDetail && (
          <div className={styles.details}>
            <TagInput ref={tagInputRef} onSubmit={addTag} disabled={isUpdatingTag} />
            <div>
              {tags.map((tag) => (
                <div key={tag.tagId}>
                  {tag.tagName}
                  <button onClick={async () => removeTag(tag.tagId)}>消す</button>
                </div>
              ))}
            </div>
            <button onClick={hideDetail}>閉じる</button>
          </div>
        )}
        <Thumbnail
          path={`thumbnail://${id}`}
          width={width}
          height={height}
          timestamps={timestamps}
          duration={duration}
          autospeed={autospeed}
          seek={seek}
        />
      </div>
    )
  }
)

VideoCell.displayName = 'VideoCell'
