import { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import classNames from 'classnames'
import { useListenMainConsole } from '@/hooks/useListenMainConsole'
import { useFileSend } from '@/hooks/useFileSend'
import { HeaderMenu } from '@/components/global/HeaderMenu'
import { StatusBar } from '@/components/global/StatusBar'
import 'reset-css/reset.css'
import '@/assets/styles/index.sass'
import styles from '@/assets/styles/pages/_app.module.sass'

export function App({ Component, pageProps }: AppProps) {
  useListenMainConsole()

  const router = useRouter()

  const { dragging } = useFileSend()

  return (
    <div className={classNames(styles.mainApp, { [styles.dropping]: dragging })}>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <header className={styles.header}>
        <HeaderMenu currentPath={router.pathname} />
      </header>

      <main className={styles.body}>
        <Component {...pageProps} />
      </main>

      <footer className={styles.footer}>
        <StatusBar />
      </footer>
    </div>
  )
}

export default App
