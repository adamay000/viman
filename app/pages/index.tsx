import { NextPage } from 'next'
import Head from 'next/head'
import { memo, useEffect, useState } from 'react'
import { VideoList } from '@/components/global/videos/VideoList'
import { RequestChannel } from '@/ipc/channel'
import { CancellableRequest, ipc } from '@/ipc/renderer'
import { useGlobalState } from '@/store'
import { Header } from '@/components/global/Header'
import { noop } from '@/utilities/noop'
import styles from '@/assets/styles/pages/index.module.sass'

function useRequestVideos() {
  const [videos, setVideos] = useState<RequestChannel['videos']['response']['videos']>([])

  useEffect(() => {
    let req: CancellableRequest<'videos'> | null = null
    const request = async () => {
      req = ipc.request('videos')
      try {
        const response = await req
        if (videos.length !== response.videos.length) {
          setVideos(response.videos)
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

  return { videos }
}

const Home: NextPage = memo(() => {
  const { videos } = useRequestVideos()

  const [filter, setFilter] = useGlobalState('filter')

  return (
    <article className={styles.contentWrapper}>
      <Head>
        <title>Home</title>
      </Head>

      <div className={styles.header}>
        <Header videoControls filter={filter} setFilter={setFilter} />
      </div>

      <div className={styles.videos}>
        <VideoList videos={videos} />
      </div>
    </article>
  )
})

Home.displayName = 'Home'

export default Home
