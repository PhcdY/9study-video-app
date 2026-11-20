// Dang ky kenh IPC co kieu. Giao dien chi goi duoc nhung kenh liet ke trong shared/types.ts.
import { BrowserWindow, dialog, ipcMain } from 'electron'
import type { EventChannel, EventMap, InvokeChannel, InvokeMap } from '../shared/types'

export function handle<K extends InvokeChannel>(
  channel: K,
  fn: (...args: InvokeMap[K]['args']) => Promise<InvokeMap[K]['ret']> | InvokeMap[K]['ret']
): void {
  ipcMain.handle(channel, (_e, ...args) => fn(...(args as InvokeMap[K]['args'])))
}

export function broadcast<K extends EventChannel>(channel: K, payload: EventMap[K]): void {
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send(channel, payload)
}

export async function pickFolder(defaultPath: string): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() ?? undefined
  const opts: Electron.OpenDialogOptions = {
    defaultPath,
    properties: ['openDirectory', 'createDirectory']
  }
  const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts)
  return res.canceled ? null : (res.filePaths[0] ?? null)
}
