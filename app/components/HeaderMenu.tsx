import { FunctionComponent, memo, useCallback } from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import { ipc } from '@/ipc/renderer'
import styles from '@/components/HeaderMenu.module.sass'

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
  }
]

export const HeaderMenu: FunctionComponent<HeaderMenuProps> = memo<HeaderMenuProps>(({ currentPath }) => {
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
        <button className={styles.button} onClick={useCallback(() => ipc.send('newWindow'), [])}>
          New Window
        </button>
        <button className={styles.button} onClick={useCallback(() => ipc.send('foreground', { isFixed: true }), [])}>
          固定
        </button>
        <button className={styles.button} onClick={useCallback(() => ipc.send('foreground', { isFixed: false }), [])}>
          非固定
        </button>
      </div>
    </nav>
  )
})

HeaderMenu.displayName = 'HeaderMenu'
