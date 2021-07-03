import { FunctionComponent, memo, useEffect, useState, useMemo } from 'react'
import { RequestChannel } from '@/ipc/channel'
import { CancellableRequest, ipc } from '@/ipc/renderer'
import { noop } from '@/utilities/noop'

interface FileListProps {
  filter: string
}

function useRequestItems() {
  const [items, setItems] = useState<RequestChannel['items']['response']['items']>([])

  useEffect(() => {
    let req: CancellableRequest<'items'> | null = null
    const request = async () => {
      req = ipc.request('items')
      try {
        const response = await req
        if (items.length !== response.items.length) {
          setItems(response.items)
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

  return { items }
}

export const FileList: FunctionComponent<FileListProps> = memo(({ filter }) => {
  const { items } = useRequestItems()
  const filteredItems = useMemo(
    () => items.filter((item) => !filter || new RegExp(filter, 'i').test(item.path)),
    [items.length, filter]
  )

  return (
    <div>
      <div>Total: {filteredItems.length}</div>
      <div>Analyzed: {filteredItems.filter((item) => item.status === 'analyzed').length}</div>
      <div>Idle: {filteredItems.filter((item) => item.status === 'idle').length}</div>
      <hr />
      {filteredItems.map((item) => (
        <div key={item.path}>
          {item.path}
          <br />
          {item.status}
          <br />
          {item.error}
          <br />
          {item.externalTable}
        </div>
      ))}
    </div>
  )
})

FileList.displayName = 'FileList'
