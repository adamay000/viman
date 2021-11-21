import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { memo, useEffect, useState, useMemo } from 'react'
import { useGlobalState } from '@/store'
import { ipc } from '@/ipc/renderer'
import { RequestChannel } from '@/ipc/channel'
import { Header } from '@/components/global/Header'
import { VideoList } from '@/components/global/videos/VideoList'
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

  const [filter, setFilter] = useGlobalState('filter')
  const [tagLogic, setTagLogic] = useState('and' as RequestChannel['videosByTag']['request']['logic'])
  const [reloadFlag, setReloadFlag] = useState(false)

  const tagIds = useMemo(
    () =>
      ([] as Array<string>)
        .concat(router.query.id ?? '')
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => !Number.isNaN(value)),
    [router.query.id]
  )

  const { videos, tags } = useRequestVideos(tagLogic, tagIds, reloadFlag)

  return (
    <article className={styles.contentWrapper}>
      <Head>
        <title>Tag({tags.map(({ tagName }) => tagName).join(', ')})</title>
      </Head>

      <div className={styles.header}>
        <Header videoControls filter={filter} setFilter={setFilter}>
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>
              {tagIds.length === 0 ? 'タグなし' : tags.map(({ tagName }) => tagName).join(', ')}
            </h1>
            {tags.length > 0 && tagIds.length > 0 && (
              <Link href={{ pathname: '/tags', query: { id: tagIds } }}>
                <a className={styles.button}>追加</a>
              </Link>
            )}
            {tags.length > 0 && tagIds.length > 1 && (
              <button className={styles.button} onClick={() => setTagLogic(tagLogic === 'and' ? 'or' : 'and')}>
                {tagLogic}
              </button>
            )}
            {tags.length > 0 && (
              <button className={styles.button} onClick={() => setReloadFlag(!reloadFlag)}>
                更新
              </button>
            )}
          </div>
        </Header>
      </div>

      <div className={styles.videos}>
        <VideoList videos={videos} />
      </div>
    </article>
  )
})

Tag.displayName = 'Tag'

export default Tag
