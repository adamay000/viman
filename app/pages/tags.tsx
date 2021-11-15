import { NextPage } from 'next'
import Head from 'next/head'
import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { RequestChannel } from '@/ipc/channel'
import { ipc } from '@/ipc/renderer'
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

      <header>
        Filter:
        <input type="text" value={filter} onInput={useCallback((e) => setFilter(e.target.value), [])} />
      </header>

      <section className={styles.tags}>
        <ul className={styles.tagList}>
          {filteredTags.map((tag) => (
            <li key={tag.tagId} className={styles.tag}>
              <Link href={`/tag?id=${tag.tagId}`}>
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
