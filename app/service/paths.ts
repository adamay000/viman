import { app } from 'electron'
import isDev from 'electron-is-dev'
import { resolve } from 'path'
import mkdirp from 'mkdirp'

export const PATH_DATA = isDev ? resolve(__dirname, '../') : app.getPath('userData')
export const PATH_SQLITE = resolve(PATH_DATA, '.sqlite')
export const PATH_VIDEO_THUMBNAIL = resolve(PATH_DATA, 'thumbnails')

export async function initializeDirectories() {
  await Promise.all([mkdirp(PATH_VIDEO_THUMBNAIL)])
}
