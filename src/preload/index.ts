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
  'app:update',
  'app:busyWork',
  'app:version',
  'app:openTeamFolder',
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
  'chat:statuses',
  'legacy:scan',
  'legacy:findDirs',
  'legacy:import',
  'legacy:chats',
  'legacy:transcript',
  'legacy:resume',
  'legacy:ack',
  'legacy:trashSource',
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
  'feedback:fixDetail',
  'voice:speed',
  'voice:setSpeed',
  'disk:usage',
  'vivibe:usage',
  'app:errorShown',
  'bugs:shots',
  'bugs:send',
  'bugs:setState',
  'bugs:askAi',
  'disk:clean'
]
const EVENTS: EventChannel[] = [
  'setup:changed',
  'app:updateReady',
  'videos:changed',
  'chat:changed',
  'legacy:progress',
  'chat:statuses',
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
