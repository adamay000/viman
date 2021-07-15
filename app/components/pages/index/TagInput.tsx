import { memo, useState, useRef, useCallback, forwardRef, useImperativeHandle, KeyboardEvent, ChangeEvent } from 'react'
import styles from '@/components/pages/index/TagInput.module.sass'

export interface TagInputHandle {
  focus(): void
  clear(): void
}

interface TagInputProps {
  onSubmit: (tagName: string) => void
  disabled?: boolean
}

export const TagInput = memo(
  forwardRef<TagInputHandle, TagInputProps>(({ onSubmit, disabled = false }, forwardedRef) => {
    const [tagName, setTagName] = useState('')
    const [isComposing, setIsComposing] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const onType = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const typedTagName = e.target.value
      setTagName(typedTagName)
    }, [])

    const detectEnter = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isComposing && e.code === 'Enter' && tagName) {
          onSubmit(tagName)
        }
      },
      [tagName, isComposing, onSubmit]
    )

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

    return (
      <div className={styles.cTagInput}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={tagName}
          onChange={onType}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={detectEnter}
          disabled={disabled}
        />
      </div>
    )
  })
)

TagInput.displayName = 'TagInput'
