// Insert ipcRenderer to client
// This is required when we keep webpack target as web, and run application on both electron and browser
// See https://github.com/electron/electron/issues/9920
import { ipcRenderer } from 'electron'

window.ipcRenderer = ipcRenderer

export {}
