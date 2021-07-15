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
import { useComponentId } from '@/hooks/useComponentId'
import { CancellableRequest, ipc } from '@/ipc/renderer'
import { noop } from '@/utilities/noop'
import styles from '@/components/pages/index/TagInput.module.sass'

export interface TagInputHandle {
  focus(): void
  clear(): void
}

interface TagInputProps {
  itemId: number
  onSubmit: (tagName: string) => void
  disabled?: boolean
}

function useRequestTagSuggestions() {
  const req = useRef<CancellableRequest<'tagSuggestions'> | null>(null)

  useEffect(() => {
    return () => {
      req.current?.cancel()
    }
  }, [])

  return async (itemId: number, tagName: string) => {
    req.current?.cancel()
    req.current = ipc.request('tagSuggestions', { itemId, tagName })
    try {
      const response = await req.current
      return response.tags.map(({ tagName, count }) => ({ tagName, count }))
    } catch (exception) {
      return []
      // do nothing
    }
  }
}

function useTagSuggestions(itemId: number) {
  const [tagSuggestions, setTagSuggestions] = useState<Array<{ tagName: string; count: number }>>([])
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
  }, [])

  return {
    tagSuggestions,
    updateTagSuggestions
  }
}

export const TagInput = memo(
  forwardRef<TagInputHandle, TagInputProps>(({ itemId, onSubmit, disabled = false }, forwardedRef) => {
    const [tagName, setTagName] = useState('')
    const [isComposing, setIsComposing] = useState(false)
    const componentId = useComponentId((id) => `tag-input-${id}`)
    const { tagSuggestions, updateTagSuggestions } = useTagSuggestions(itemId)

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

    return (
      <div className={styles.cTagInput}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          list={componentId}
          value={tagName}
          onChange={onType}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={detectEnter}
          disabled={disabled}
        />
        <datalist id={componentId}>
          {tagSuggestions.map(({ tagName, count }) => (
            <option key={tagName} label={`(${count})`} value={tagName} />
          ))}
        </datalist>
      </div>
    )
  })
)

TagInput.displayName = 'TagInput'
