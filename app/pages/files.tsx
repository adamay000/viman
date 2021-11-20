import { NextPage } from 'next'
import Head from 'next/head'
import { memo, useCallback, useState } from 'react'
import { FileList } from '@/components/pages/files/FileList'
import styles from '@/assets/styles/pages/files.module.sass'

const Files: NextPage = memo(() => {
  const [filter, setFilter] = useState('')

  return (
    <article className={styles.contentWrapper}>
      <Head>
        <title>Files</title>
      </Head>

      <header className={styles.filesettings}>
        Filter:
        <input type="text" value={filter} onInput={useCallback((e) => setFilter(e.currentTarget.value), [])} />
      </header>

      <section className={styles.files}>
        <FileList filter={filter} />
      </section>
    </article>
  )
})

Files.displayName = 'Files'

export default Files
