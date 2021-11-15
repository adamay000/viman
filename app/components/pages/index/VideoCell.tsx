import { shell } from 'electron'
import { basename } from 'path'
import { FunctionComponent, memo, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import { ipc } from '@/ipc/renderer'
import { RequestError } from '@/ipc/RequestError'
import { TagInput, TagInputHandle } from '@/components/pages/index/TagInput'
import { Thumbnail } from '@/components/pages/index/Thumbnail'
import { noop } from '@/utilities/noop'
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
    const req = ipc.request('getTags', { itemId })
    req
      .then((response) => {
        setTags(response.tags)
      })
      .catch(noop)
    return () => {
      req.cancel()
    }
  }, [itemId])

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
    const [isEditing, setIsEditing] = useState(false)

    const tagInputRef = useRef<TagInputHandle>(null)

    const { tags, isUpdatingTag, addTag, removeTag } = useManageTags(
      id,
      useCallback(() => tagInputRef.current?.clear(), [])
    )

    const openApplication = useCallback(() => !isShowDetail && shell.openItem(path), [path, isShowDetail])
    const toggleDetail = useCallback(() => {
      if (!isShowDetail) {
        setIsEditing(false)
      }
      setIsShowDetail(!isShowDetail)
    }, [isShowDetail])

    return (
      <div className={styles.cVideoCell} onClick={openApplication} onContextMenu={toggleDetail}>
        {isShowDetail && (
          <div className={styles.details}>
            <div className={styles.title}>{basename(path)}</div>
            <ul className={styles.tags}>
              {tags.map((tag) => (
                <li key={tag.tagId} className={classnames(styles.tagButton, { [styles.remove]: isEditing })}>
                  {isEditing ? (
                    <button className={styles.button} onClick={async () => removeTag(tag.tagId)}>
                      {tag.tagName}
                    </button>
                  ) : (
                    <Link href={`/tags?id=${tag.tagId}`}>
                      <a className={styles.button}>{tag.tagName}</a>
                    </Link>
                  )}
                </li>
              ))}
              {tags.length > 0 && (
                <li className={classnames(styles.tagButton, styles.edit)}>
                  <button className={styles.button} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? '完了' : '編集'}
                  </button>
                </li>
              )}
            </ul>
            <div className={styles.input}>
              <TagInput
                ref={tagInputRef}
                itemId={id}
                tags={tags.map(({ tagName }) => tagName)}
                onSubmit={addTag}
                disabled={isUpdatingTag}
                width="40%"
              />
            </div>
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
