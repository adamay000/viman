import { BrowserWindow, WebContents, protocol } from 'electron'
import isDev from 'electron-is-dev'
import windowStateKeeper from 'electron-window-state'
import { resolve } from 'path'
import { access } from 'fs'
import { promisify } from 'util'
import remove from 'lodash/remove'
import urljoin from 'url-join'
import { Item } from '@/service/models/Item'
import { PATH_VIDEO_THUMBNAIL } from '@/paths'

export class App {
  private static readonly instances: Array<App> = []

  public static hasInstance() {
    return App.instances.length !== 0
  }

  public static getAllInstances(): ReadonlyArray<App> {
    return App.instances
  }

  public static findByWindow(webContents: WebContents) {
    return App.instances.find(({ window }) => window.webContents === webContents) ?? null
  }

  public static launch() {
    return new App()
  }

  public readonly window: BrowserWindow

  public constructor() {
    this.window = createWindow()
    this.window.on('closed', this.destroyed.bind(this))
    this.window.webContents.on('did-finish-load', this.ready.bind(this))

    if (isDev) {
      this.window.webContents.openDevTools({
        mode: 'bottom'
      })
    }

    const url = isDev ? 'http://localhost:3000' : urljoin('file://', __dirname, '../index.html')
    this.window.loadURL(url).catch(() => {
      this.window.close()
    })

    // Make it able to access images via original protocol such as thumbnail://
    protocol.registerFileProtocol('thumbnail', async (request, callback) => {
      // Allow only integer for security reason.
      const id = parseInt(decodeURIComponent(request.url).substr(12), 10)
      if (Number.isNaN(id)) {
        callback()
        return
      }

      const path = resolve(PATH_VIDEO_THUMBNAIL, `${id}.png`)
      try {
        await promisify(access)(path)
        callback({
          path: resolve(PATH_VIDEO_THUMBNAIL, `${id}.png`)
        })
        return
      } catch (exception) {
        // Backwards compatibility with version 1.0.0.
        // Thumbnail created with above, filename is like '{size}-{filename}.png'.
        const item = await Item.query().where({ id }).first()
        if (!item) {
          callback()
          return
        }

        const filename = `${item.size}-${item.filename}.png`

        callback({
          path: resolve(PATH_VIDEO_THUMBNAIL, filename)
        })
      }
    })

    this.created()
  }

  private ready() {
    this.window.show()
    this.window.focus()
  }

  private created() {
    App.instances.push(this)
  }

  private destroyed() {
    remove(App.instances, this)
  }
}

function createWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600
  })
  const win = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    webPreferences: {
      nodeIntegration: true,
      preload: resolve(__dirname, isDev ? '../preload.dev.js' : '../preload.js')
    }
  })
  // win.removeMenu()
  mainWindowState.manage(win)
  return win
}
