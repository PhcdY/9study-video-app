import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { Api, EventChannel, EventMap, InvokeChannel, InvokeMap } from '../shared/types'

const INVOKE: InvokeChannel[] = [
  'setup:get',
  'setup:run',
  'setup:skip',
  'setup:cancel',
  'dialog:pickFolder',
  'app:openLoginPage',
  'app:restartToUpdate',
  'app:version',
  'videos:list',
  'videos:script',
  'videos:audio',
  'videos:lessons',
  'videos:create',
  'videos:resumeDraft',
  'videos:dropDraft',
  'chat:open',
  'chat:send',
  'chat:chip',
  'chat:interrupt',
  'chat:approve',
  'studio:start',
  'shell:showItem',
  'dialog:pickFiles',
  'shell:openPath',
  'version:get',
  'version:update',
  'account:usage',
  'account:logout',
  'app:bugReport',
  'prefs:get',
  'prefs:set',
  'feedback:draft',
  'feedback:create',
  'feedback:list',
  'feedback:setState',
  'feedback:fix',
  'feedback:pickDir',
  'voice:speed',
  'voice:setSpeed',
  'disk:usage',
  'vivibe:usage',
  'disk:clean'
]
const EVENTS: EventChannel[] = [
  'setup:changed',
  'app:updateReady',
  'videos:changed',
  'chat:changed',
  'version:progress',
  'usage:changed',
  'feedback:changed',
  'prefs:changed',
  'vivibe:changed'
]

const api: Api = {
  invoke<K extends InvokeChannel>(channel: K, ...args: InvokeMap[K]['args']) {
    if (!INVOKE.includes(channel)) return Promise.reject(new Error(`kenh khong hop le: ${channel}`))
    return ipcRenderer.invoke(channel, ...args) as Promise<InvokeMap[K]['ret']>
  },
  on<K extends EventChannel>(channel: K, cb: (payload: EventMap[K]) => void) {
    if (!EVENTS.includes(channel)) throw new Error(`su kien khong hop le: ${channel}`)
    const listener = (_e: IpcRendererEvent, payload: EventMap[K]): void => cb(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
