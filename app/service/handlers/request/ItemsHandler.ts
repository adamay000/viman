import { Handler } from '@/service/handlers/Handler'
import { Item } from '@/service/models/Item'

export class ItemsHandler extends Handler<'items'> {
  public async request() {
    const items = await Item.query()

    await Promise.resolve()
    return {
      items: items.map((item) => ({
        name: item.filename,
        path: item.path,
        status: item.status,
        error: item.error || '',
        externalTable: item.external_table
      }))
    }
  }
}
