import { MutableRefObject, useState, useEffect, useRef } from 'react'

type DropZoneListener = (event: DragEvent) => void
type DropZoneRef<T extends HTMLElement> = MutableRefObject<T | undefined>

export function useDropZone(onDropCallback: DropZoneListener, dropZoneTarget: Document | null): { dragging: boolean }
export function useDropZone<T extends HTMLElement>(
  onDropCallback: DropZoneListener,
  dropZoneTarget: DropZoneRef<T>
): { dragging: boolean }
export function useDropZone<T extends HTMLElement>(
  onDropCallback: DropZoneListener
): { dragging: boolean; ref: DropZoneRef<T> }
export function useDropZone<T extends HTMLElement>(
  onDropCallback: DropZoneListener,
  dropZoneTarget?: Document | DropZoneRef<T> | null
): { dragging: boolean; ref?: DropZoneRef<T> } {
  const ref = useRef<T>()

  const [isDragging, setDragging] = useState(false)

  useEffect(() => {
    function onDrop(event: Event) {
      event.preventDefault()
      event.stopPropagation()
      setDragging(false)
      onDropCallback(event as DragEvent)
    }
    function onDragging(event: Event) {
      event.preventDefault()
      event.stopPropagation()
      setDragging(true)
    }
    function onNotDragging(event: Event) {
      event.preventDefault()
      event.stopPropagation()
      setDragging(false)
    }

    const target = dropZoneTarget ?? ref.current
    if (!(target instanceof HTMLElement || target instanceof Document)) {
      return
    }

    target.addEventListener('drop', onDrop)
    target.addEventListener('dragenter', onDragging)
    target.addEventListener('dragover', onDragging)
    target.addEventListener('dragleave', onNotDragging)
    target.addEventListener('dragend', onNotDragging)
    return () => {
      target.removeEventListener('drop', onDrop)
      target.removeEventListener('dragenter', onDragging)
      target.removeEventListener('dragover', onDragging)
      target.removeEventListener('dragleave', onNotDragging)
      target.removeEventListener('dragend', onNotDragging)
    }
  }, [onDropCallback, dropZoneTarget])

  if ((process.browser && dropZoneTarget === document) || dropZoneTarget === null) {
    return {
      dragging: isDragging
    }
  }

  return {
    dragging: isDragging,
    ref
  }
}
