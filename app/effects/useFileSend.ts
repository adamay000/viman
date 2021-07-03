import { useCallback } from 'react'
import { ipc } from '@/ipc/renderer'
import { useDropZone } from '@/effects/useDropZone'

function sendFilePathsToMainProcess(files: FileList) {
  const paths = Array.from<File>(files)
    .map(({ path }) => path)
    .filter(Boolean)
  if (paths.length > 0) ipc.send('files', { paths })
}

/** Send dropped files to main process */
export function useFileSend() {
  const { dragging } = useDropZone(
    useCallback((event) => {
      if (!event.dataTransfer || event.dataTransfer.files.length === 0) return
      sendFilePathsToMainProcess(event.dataTransfer.files)
    }, []),
    process.browser ? document : null
  )

  return { dragging }
}
