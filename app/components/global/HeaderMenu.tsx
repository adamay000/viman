import { shell } from 'electron'
import { FunctionComponent, memo, useEffect, useState } from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import { URLSearchParams } from 'url'
import { ipc } from '@/ipc/renderer'
import styles from '@/components/global/HeaderMenu.module.sass'

interface HeaderMenuProps {
  currentPath: string
}

const links: Array<{ title: string; href: string }> = [
  {
    title: 'Videos',
    href: '/'
  },
  {
    title: 'All files',
    href: '/files'
  },
  {
    title: 'Tags',
    href: '/tags'
  }
]

type ButtonContext = { dataPath: string }
const buttons: Array<{
  title: string
  callback: (context: ButtonContext) => void
  hide?: (context: ButtonContext) => boolean
}> = [
  {
    title: 'Data Directory',
    callback: ({ dataPath }) => shell.openItem(dataPath),
    hide: ({ dataPath }) => dataPath === ''
  },
  {
    title: 'New Window',
    callback: () => ipc.send('newWindow')
  },
  {
    title: 'Fixed',
    callback: () => ipc.send('foreground', { isFixed: true })
  },
  {
    title: 'Unfixed',
    callback: () => ipc.send('foreground', { isFixed: false })
  }
]

export const HeaderMenu: FunctionComponent<HeaderMenuProps> = memo<HeaderMenuProps>(({ currentPath }) => {
  const [dataPath, setDataPath] = useState('')
  useEffect(() => {
    setDataPath(new URLSearchParams(location.search).get('dataPath') || '')
  }, [])

  return (
    <nav className={styles.cHeaderMenu}>
      <div className={styles.left}>
        {links.map((link) => (
          <Link key={link.title} href={link.href}>
            <a className={classnames(styles.button, { [styles.active]: currentPath === link.href })}>{link.title}</a>
          </Link>
        ))}
      </div>
      <div className={styles.right}>
        {buttons.map((button) => {
          if (button.hide && button.hide({ dataPath })) return null
          return (
            <button key={button.title} className={styles.button} onClick={() => button.callback({ dataPath })}>
              {button.title}
            </button>
          )
        })}
      </div>
    </nav>
  )
})

HeaderMenu.displayName = 'HeaderMenu'
