import { NextPage } from 'next'
import Head from 'next/head'
import { memo, useState, useEffect, useCallback } from 'react'
import { RequestChannel } from '@/ipc/channel'
import { ipc } from '@/ipc/renderer'
import { RequestError } from '@/ipc/RequestError'
import { Header } from '@/components/global/Header'
import { noop } from '@/utilities/noop'
import styles from '@/assets/styles/pages/directory.module.sass'

function useRequestWatchDirectories(reloadCount: number) {
  const [watchDirectories, setWatchDirectories] = useState<
    RequestChannel['getWatchDirectories']['response']['watchDirectories']
  >([])

  useEffect(() => {
    const req = ipc.request('getWatchDirectories')
    req
      .then((response) => {
        setWatchDirectories(response.watchDirectories)
      })
      .catch(noop)

    return () => {
      req.cancel()
    }
  }, [reloadCount])

  return { watchDirectories }
}

const WatchDirectory: NextPage = memo(() => {
  const [updateCount, setUpdateCount] = useState(0)
  const { watchDirectories } = useRequestWatchDirectories(updateCount)

  const [selectedDirectory, setSelectedDirectory] = useState('')
  const [recursive, setRecursive] = useState(true)

  const openDirectorySelector = useCallback(async () => {
    const { path } = await ipc.request('selectDirectory')
    if (path) {
      setSelectedDirectory(path)
    }
  }, [])

  const addWatchDirectory = useCallback(async () => {
    try {
      await ipc.request('addWatchDirectory', {
        path: selectedDirectory,
        recursive
      })
    } catch (exception) {
      if (RequestError.is(RequestError.Code.PathConstraint, exception)) {
        return
      }
      console.error(exception)
      return
    }

    setUpdateCount(updateCount + 1)
  }, [updateCount, selectedDirectory, recursive])

  const removeWatchDirectory = useCallback(
    async (id: number) => {
      try {
        await ipc.request('removeWatchDirectory', {
          id
        })
      } catch (exception) {
        console.error(exception)
        return
      }
      setUpdateCount(updateCount + 1)
    },
    [updateCount]
  )

  return (
    <article className={styles.contentWrapper}>
      <Head>
        <title>WatchDirectory</title>
      </Head>

      <div>
        <Header />
      </div>

      <section>
        <div>
          <button onClick={openDirectorySelector}>select directory</button>
          {selectedDirectory}
        </div>
        {selectedDirectory && (
          <div>
            <label>
              <input type="checkbox" checked={recursive} onChange={() => setRecursive(!recursive)} />
              recursive
            </label>
            <button onClick={addWatchDirectory}>追加</button>
          </div>
        )}

        <hr />

        {watchDirectories.map((watchDirectory) => (
          <div key={watchDirectory.id}>
            {watchDirectory.path}
            {watchDirectory.recursive && ' [recursive]'}
            <button onClick={async () => await removeWatchDirectory(watchDirectory.id)}>削除</button>
          </div>
        ))}
      </section>
    </article>
  )
})

WatchDirectory.displayName = 'WatchDirectory'

export default WatchDirectory
