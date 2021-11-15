import {
  memo,
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  KeyboardEvent,
  ChangeEvent
} from 'react'
import classnames from 'classnames'
import { CancellableRequest, ipc } from '@/ipc/renderer'
import { noop } from '@/utilities/noop'
import styles from '@/components/pages/index/TagInput.module.sass'

enum TagPriority {
  Recommended,
  Related,
  MostUsed
}

interface TagSuggestion {
  tagName: string
  count: number
  priority: TagPriority
}

export interface TagInputHandle {
  focus(): void
  clear(): void
}

interface TagInputProps {
  itemId: number
  tags: Array<string>
  onSubmit: (tagName: string) => void
  disabled?: boolean
  width?: string
}

function useRequestTagSuggestions() {
  const req = useRef<CancellableRequest<'tagSuggestions'> | null>(null)

  useEffect(() => {
    return () => {
      req.current?.cancel()
    }
  }, [])

  return async (itemId: number, tagName: string): Promise<Array<TagSuggestion>> => {
    req.current?.cancel()
    req.current = ipc.request('tagSuggestions', { itemId, tagName })
    try {
      const { relatedTags, mostUsedTags } = await req.current
      const relatedTagIds = relatedTags.map(({ tagId }) => tagId)
      const mostUsedTagIds = mostUsedTags.map(({ tagId }) => tagId)
      const recommendedTagIds = relatedTagIds.filter((tagId) => mostUsedTagIds.includes(tagId))
      console.log('relatedTagIds', relatedTagIds)
      console.log('mostUsedTagIds', mostUsedTagIds)
      console.log('recommendedTagIds', recommendedTagIds)
      return [
        ...relatedTags
          .filter(({ tagId }) => recommendedTagIds.includes(tagId))
          .map(({ tagName, count }) => ({ tagName, count, priority: TagPriority.Recommended })),
        ...relatedTags
          .filter(({ tagId }) => !recommendedTagIds.includes(tagId))
          .map(({ tagName, count }) => ({ tagName, count, priority: TagPriority.Related })),
        ...mostUsedTags
          .filter(({ tagId }) => !recommendedTagIds.includes(tagId))
          .map(({ tagName, count }) => ({ tagName, count, priority: TagPriority.MostUsed }))
      ]
    } catch (exception) {
      console.error(exception)
      return []
      // do nothing
    }
  }
}

function useTagSuggestions(itemId: number, tags: Array<string>) {
  const [tagSuggestions, setTagSuggestions] = useState<Array<TagSuggestion>>([])
  const requestTagSuggestions = useRequestTagSuggestions()
  const updateTagSuggestions = useCallback(
    async (tagName: string) => {
      const tagSuggestions = await requestTagSuggestions(itemId, tagName)
      setTagSuggestions(tagSuggestions)
    },
    [itemId]
  )

  useEffect(() => {
    updateTagSuggestions('').catch(noop)
  }, [tags.length])

  return {
    tagSuggestions,
    updateTagSuggestions
  }
}

export const TagInput = memo(
  forwardRef<TagInputHandle, TagInputProps>(
    ({ itemId, tags, onSubmit, disabled = false, width = '100%' }, forwardedRef) => {
      const [tagName, setTagName] = useState('')
      const [isComposing, setIsComposing] = useState(false)
      const [isFocused, setIsFocused] = useState(false)
      const { tagSuggestions, updateTagSuggestions } = useTagSuggestions(itemId, tags)

      const inputRef = useRef<HTMLInputElement>(null)
      useImperativeHandle(
        forwardedRef,
        () => {
          return {
            focus() {
              inputRef.current?.focus()
            },
            clear() {
              setTagName('')
            }
          }
        },
        []
      )

      const onType = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const typedTagName = e.target.value
        setTagName(typedTagName)

        await updateTagSuggestions(typedTagName)
      }, [])

      const detectEnter = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
          if (!isComposing && e.code === 'Enter' && tagName) {
            onSubmit(tagName)
          }
        },
        [tagName, isComposing, onSubmit]
      )

      // Focus input after adding/removing tags
      useEffect(() => {
        inputRef.current?.focus()
      }, [tags.length, tagSuggestions.length])

      return (
        <div className={styles.cTagInput}>
          <input
            ref={inputRef}
            className={styles.input}
            style={{ width }}
            type="text"
            placeholder="Tag"
            value={tagName}
            onChange={onType}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={detectEnter}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
          />
          {isFocused && tagSuggestions.length > 0 && (
            <div className={styles.suggestions}>
              {tagSuggestions.map(({ tagName, count, priority }) => (
                <button
                  key={tagName}
                  className={classnames(styles.suggestion, {
                    [styles.recommended]: priority === TagPriority.Recommended
                  })}
                  onMouseDown={() => onSubmit(tagName)}
                >
                  {tagName} ({count})
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }
  )
)

TagInput.displayName = 'TagInput'
