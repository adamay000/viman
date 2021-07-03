import { app } from 'electron'
import isDev from 'electron-is-dev'
import { resolve } from 'path'
import mkdirp from 'mkdirp'

export const PATH_SQLITE = resolve(isDev ? __dirname : app.getPath('userData'), '.sqlite')
export const PATH_VIDEO_THUMBNAIL = resolve(isDev ? __dirname : app.getPath('userData'), 'thumbnails')

export async function initializeDirectories() {
  await Promise.all([mkdirp(PATH_VIDEO_THUMBNAIL)])
}
