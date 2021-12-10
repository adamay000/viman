import { Inject, inject } from '@/service/injection'
import { Handler } from '@/service/handlers/Handler'
import { addItemsFromWatchedDirectories } from '@/service/operations/addItemsFromWatchedDirectories'
import { Processing } from '@/service/processing'

export class FilesFromWatchedDirectoryHandler extends Handler<'filesFromWatchedDirectory'> {
  @inject(Inject.Processing)
  private readonly processing!: Processing

  public async request() {
    try {
      const addedItems = await addItemsFromWatchedDirectories(this.processing.getExtensions())
      return { addedItems }
    } catch (exception) {
      console.error(exception)
      return {
        addedItems: []
      }
    }
  }
}
