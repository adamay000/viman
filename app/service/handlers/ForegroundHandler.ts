import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RendererToMainChannel } from '@/ipc/channel'

export class ForegroundHandler extends Handler<'foreground'> {
  public request(context: HandlerContext, { isFixed }: RendererToMainChannel['foreground']) {
    if (context.app) {
      context.app.window.setAlwaysOnTop(isFixed)
    }
  }
}
