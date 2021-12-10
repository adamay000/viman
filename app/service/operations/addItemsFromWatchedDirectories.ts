import { promisify } from 'util'
import { join } from 'path'
import _glob from 'glob'
import { WatchDirectory } from '@/service/models/WatchDirectory'
import { addItemFromPath } from '@/service/operations/addItemFromPath'

const glob = promisify(_glob)

export async function addItemsFromWatchedDirectories(extensions: Array<string>): Promise<Array<string>> {
  if (
    extensions.some((extension) => {
      return extension.length < 3 || !extension.startsWith('.')
    })
  ) {
    throw new Error(`Extension must be started with dot. Given extensions: ${JSON.stringify(extensions)}`)
  }

  const startTime = Date.now()

  const watchDirectories = await WatchDirectory.query()

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

  const addedItems = [] as Array<string>
  for await (const path of files) {
    try {
      await addItemFromPath(path)
      addedItems.push(path)
    } catch (exception) {
      console.error(exception)
    }
  }

  console.log('Checked all files in watched directories and updated database:')
  console.log('Time:', `${Date.now() - startTime}ms`)
  console.log(`  Added: ${addedItems.length}`)

  return addedItems
}
