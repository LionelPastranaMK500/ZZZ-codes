import { contextBridge, ipcRenderer } from 'electron'

// API segura disponible como window.api en el renderer
contextBridge.exposeInMainWorld('api', {
  // seguir recibiendo mensajes de prueba si quieres
  onMainMessage(cb: (msg: unknown) => void) {
    const handler = (_e: Electron.IpcRendererEvent, msg: unknown) => cb(msg)
    ipcRenderer.on('main-process-message', handler)
    return () => ipcRenderer.removeListener('main-process-message', handler)
  },

  // 👉 nueva función para pedir los códigos al main
  getCodes: () => ipcRenderer.invoke('codes:fetch'),
})
