import { stat as _stat } from 'fs'
import { basename, extname } from 'path'
import { promisify } from 'util'
import { Item } from '@/service/models/Item'

const stat = promisify(_stat)

/** @returns {boolean} Is file added or not */
export async function addItemFromPath(path: string): Promise<boolean> {
  const stats = await stat(path).catch((exception) => {
    console.error(`Failed to get stats for ${path}.`, exception)
    throw exception
  })
  if (!stats.isFile()) return false

  const filename = basename(path)
  const extension = extname(path)
  const size = stats.size

  try {
    if (await Item.query().where({ filename, size }).first()) {
      return false
    }

    await Item.query().insertAndFetch({
      path,
      filename,
      extension,
      size
    })

    return true
  } catch (exception) {
    console.error(`Failed to add item to database for ${path}.`, exception)
    throw exception
  }
}
