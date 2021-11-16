import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { memo, useEffect, useState } from 'react'
import { VideoList } from '@/components/global/videos/VideoList'
import { ipc } from '@/ipc/renderer'
import { RequestChannel } from '@/ipc/channel'
import { noop } from '@/utilities/noop'
import styles from '@/assets/styles/pages/tag.module.sass'

function useRequestVideos(
  logic: RequestChannel['videosByTag']['request']['logic'],
  tagIds: RequestChannel['videosByTag']['request']['tagIds'],
  reloadFlag: boolean
) {
  const [videos, setVideos] = useState<RequestChannel['videosByTag']['response']['videos']>([])
  const [tags, setTags] = useState<RequestChannel['videosByTag']['response']['tags']>([])

  useEffect(() => {
    const req = ipc.request('videosByTag', {
      logic,
      tagIds
    })

    req
      .then((response) => {
        setVideos(response.videos)
        setTags(response.tags)
      })
      .catch(noop)

    return () => {
      req.cancel()
    }
  }, [logic, tagIds.join(','), reloadFlag])

  return { videos, tags }
}

const Tag: NextPage = memo(() => {
  const router = useRouter()

  const [tagId, setTagId] = useState(-1)
  const [reloadFlag, setReloadFlag] = useState(false)

  useEffect(() => {
    const id = Number.parseInt(`${router.query.id}`, 10)
    if (!Number.isNaN(id)) {
      setTagId(id)
    }
  }, [router.query.id])

  const { videos, tags } = useRequestVideos('and', [tagId], reloadFlag)

  return (
    <article className={styles.contentWrapper}>
      <Head>
        <title>Tag({tags.map(({ tagName }) => tagName).join(', ')})</title>
      </Head>

      <h1 className={styles.title}>{tagId === -1 ? 'タグなし' : tags.map(({ tagName }) => tagName).join(', ')}</h1>

      <button className={styles.reload} onClick={() => setReloadFlag(!reloadFlag)}>
        更新
      </button>

      <VideoList videos={videos} />
    </article>
  )
})

Tag.displayName = 'Tag'

export default Tag
