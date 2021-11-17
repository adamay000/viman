import { app } from 'electron'
import { Inject, provide } from '@/service/injection'
import { App } from '@/service'
import { initializeDirectories } from '@/service/paths'
import { initializeDatabase } from '@/service/database'
import { initializeHandler } from '@/service/handler'
import { Processing } from '@/service/processing'
import { VideoProcessor } from '@/service/processors/VideoProcessor'
import { sendLogToRenderer } from '@/service/console'
import { Item } from '@/service/models/Item'
import { Queue } from '@/utilities/queue'

async function main() {
  sendLogToRenderer()

  const queue = new Queue<Item>((a, b) => a.id === b.id)
  provide(Inject.Queue, queue)

  await initializeDirectories()
  await initializeDatabase()
  initializeHandler()

  const processing = new Processing()
  processing.addProcessor(VideoProcessor)
  await processing.loadQueue()

  App.launch()
}

app.on('ready', main)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (!App.hasInstance()) App.launch()
})
