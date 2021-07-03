import { Handler } from '@/service/handlers/Handler'
import { App } from '@/service'

export class NewWindowHandler extends Handler<'newWindow'> {
  public request() {
    App.launch()
  }
}
