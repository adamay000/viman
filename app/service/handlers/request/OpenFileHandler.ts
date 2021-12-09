import { shell } from 'electron'
import { stat as _stat } from 'fs'
import { promisify } from 'util'
import { basename, join } from 'path'
import _glob from 'glob'
import { Inject, inject } from '@/service/injection'
import { Processing } from '@/service/processing'
import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RequestChannel } from '@/ipc/channel'
import { Item } from '@/service/models/Item'
import { WatchDirectory } from '@/service/models/WatchDirectory'

const stat = promisify(_stat)
const glob = promisify(_glob)

export class OpenFileHandler extends Handler<'openFile'> {
  @inject(Inject.Processing)
  private readonly processing!: Processing

  private fileCache: Array<string> = []

  public async request(_context: HandlerContext, payload: RequestChannel['openFile']['request']) {
    const item = await Item.query().findById(payload.id)
    if (!item) {
      console.error(`Item not found: id=${payload.id}`)
      return { path: null, updated: false }
    }

    const stats = await stat(item.path).catch(() => null)

    // If file is found, just open it
    if (stats) {
      shell.openItem(item.path)
      return { path: item.path, updated: false }
    }

    // If file is not found, search same file from watched directories
    // Search from cache first because glob takes a time
    const pathFromCache = await this.updateFilePath(this.fileCache, payload.id, item.filename, item.size)
    if (pathFromCache) {
      shell.openItem(pathFromCache)
      return { path: pathFromCache, updated: true }
    }

    const files = await this.getFilesFromWatchDirectory()
    this.fileCache = files

    const path = await this.updateFilePath(files, payload.id, item.filename, item.size)
    if (path) {
      shell.openItem(path)
      return { path, updated: true }
    }

    // TODO update item status to 'deleted'

    return { path: null, updated: false }
  }

  private async getFilesFromWatchDirectory(): Promise<Array<string>> {
    const watchDirectories = await WatchDirectory.query()

    const startTime = Date.now()

    const extensions = this.processing.getExtensions()
    const filename = `*{${extensions.join(',')}}`
    const filesPerDirectory = await Promise.all(
      watchDirectories.map(async ({ path, recursive }) => {
        // Note that glob cannot access network volume on Windows without cwd option
        return (await glob(recursive ? `**/${filename}` : filename, { cwd: path })).map((filename) =>
          join(path, filename)
        )
      })
    )
    const files = ([] as Array<string>).concat(...filesPerDirectory)

    console.log(`Time taken for glob: ${Date.now() - startTime}ms`)
    console.log(`Number of target files: ${files.length}`)

    return files
  }

  private async updateFilePath(
    targetFiles: Array<string>,
    id: number,
    filename: string,
    size: number
  ): Promise<string | null> {
    // Search file which has same filename and size
    for await (const path of targetFiles) {
      const targetFilename = basename(path)
      if (targetFilename !== filename) {
        continue
      }

      const stats = await stat(path).catch(() => null)
      if (stats?.size !== size) {
        continue
      }

      await Item.query().findById(id).patch({
        path,
        filename: targetFilename
      })

      return path
    }

    return null
  }
}
