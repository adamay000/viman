import { Handler } from '@/service/handlers/Handler'
import { WatchDirectory } from '@/service/models/WatchDirectory'

export class GetWatchDirectoriesHandler extends Handler<'getWatchDirectories'> {
  public async request() {
    const watchDirectories = await WatchDirectory.query()

    return {
      watchDirectories: watchDirectories.map((watchDirectory) => ({
        id: watchDirectory.id,
        path: watchDirectory.path,
        recursive: watchDirectory.recursive
      }))
    }
  }
}
