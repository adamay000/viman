import { NextPage } from 'next'
import Head from 'next/head'
import { memo, useCallback, useState } from 'react'
import { VideoList } from '@/components/pages/index/VideoList'
import styles from '@/assets/styles/pages/index.module.sass'

const Home: NextPage = memo(() => {
  const [column, setColumn] = useState(4)
  const [filter, setFilter] = useState('')
  const [autospeed, setAutospeed] = useState(500)
  const [seek, setSeek] = useState(true)

  return (
    <article className={styles.contentWrapper}>
      <Head>
        <title>Home</title>
      </Head>

      <header className={styles.videosettings}>
        Size:
        <input
          type="range"
          min={1}
          max={10}
          value={column}
          onChange={useCallback((e) => setColumn(Number(e.target.value)), [])}
        />
        Speed:
        <input
          type="range"
          min={50}
          max={1000}
          value={autospeed}
          onChange={useCallback((e) => setAutospeed(Number(e.target.value)), [])}
        />
        Seek:
        <input
          type="checkbox"
          defaultChecked={seek}
          onClick={useCallback(() => setSeek((prevSeek) => !prevSeek), [])}
        />
        Filter:
        <input type="text" value={filter} onInput={useCallback((e) => setFilter(e.target.value), [])} />
      </header>

      <section className={styles.videos}>
        <VideoList column={column} filter={filter} autospeed={autospeed} seek={seek} />
      </section>
    </article>
  )
})

Home.displayName = 'Home'

export default Home
