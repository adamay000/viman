import { NextPage } from 'next'
import Head from 'next/head'
import { memo, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { RequestChannel } from '@/ipc/channel'
import { ipc } from '@/ipc/renderer'
import { Header } from '@/components/global/Header'
import { noop } from '@/utilities/noop'
import styles from '@/assets/styles/pages/tags.module.sass'

function useRequestTags() {
  const [tags, setTags] = useState<RequestChannel['getAllTags']['response']['tags']>([])

  useEffect(() => {
    const req = ipc.request('getAllTags')
    req
      .then((response) => {
        setTags(response.tags)
      })
      .catch(noop)

    return () => {
      req.cancel()
    }
  }, [])

  return { tags }
}

const Tags: NextPage = memo(() => {
  const { tags } = useRequestTags()
  const [filter, setFilter] = useState('')

  const filteredTags = useMemo(
    () => tags.filter((tag) => !filter || new RegExp(filter, 'i').test(tag.tagName)),
    [tags.length, filter]
  )

  return (
    <article className={styles.contentWrapper}>
      <Head>
        <title>Tags</title>
      </Head>

      <div className={styles.header}>
        <Header filter={filter} setFilter={setFilter} />
      </div>

      <section className={styles.tags}>
        <ul className={styles.tagList}>
          {!filter && (
            <li className={styles.tag}>
              <Link href={{ pathname: '/tag', query: { id: -1 } }}>
                <a className={styles.link}>タグなし</a>
              </Link>
            </li>
          )}
          {filteredTags.map((tag) => (
            <li key={tag.tagId} className={styles.tag}>
              <Link href={{ pathname: '/tag', query: { id: tag.tagId } }}>
                <a className={styles.link}>
                  {tag.tagName} ({tag.count})
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
})

Tags.displayName = 'Tags'

export default Tags
