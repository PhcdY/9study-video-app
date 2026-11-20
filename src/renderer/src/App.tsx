import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { api, useSetup, useUpdateReady, useVersion } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { SetupScreen } from '@/screens/Setup'
import { ReadyScreen } from '@/screens/Ready'
import { HomeScreen } from '@/screens/Home'
import { NewVideoScreen } from '@/screens/NewVideo'
import { WorkspaceScreen } from '@/screens/Workspace'
import { SettingsScreen } from '@/screens/Settings'
import { AssistantChatScreen } from '@/screens/AssistantChat'
import { UsagePill } from '@/components/UsagePill'
import { UpdateBanner, UpdateDialog } from '@/components/UpdateDialog'

type Route =
  | { name: 'ready' }
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'settings' }
  | { name: 'video'; key: string }
  | { name: 'assistant'; key: string }

function App(): React.JSX.Element {
  const snap = useSetup()
  const update = useUpdateReady()
  // Lan dau thay cai dat xong: mo app da xong tu truoc thi vao thang Video cua toi,
  // vua cai xong trong phien nay thi hien man "May ban da san sang" mot lan.
  const [route, setRoute] = useState<Route | null>(null)
  const [sawSetup, setSawSetup] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  if (snap && !snap.allDone && !sawSetup) setSawSetup(true)
  const current: Route | null = !snap?.allDone
    ? null
    : (route ?? (sawSetup ? { name: 'ready' } : { name: 'home' }))
  const fullHeight = current?.name === 'video' || current?.name === 'assistant'
  const ready = !!current && current.name !== 'ready'
  const [version, reloadVersion] = useVersion()

  const navItem = (name: 'home' | 'settings', label: string): React.JSX.Element => (
    <button
      type="button"
      onClick={() => setRoute(name === 'home' ? { name: 'home' } : { name: 'settings' })}
      aria-current={current?.name === name ? 'page' : undefined}
      className={cn(
        'cursor-pointer px-2.5 text-sm',
        current?.name === name
          ? 'font-bold text-navy shadow-[inset_0_-2px_0_var(--color-cham)]'
          : 'font-semibold text-phu hover:text-navy'
      )}
    >
      {label}
    </button>
  )

  return (
    <div className={cn('flex flex-col', fullHeight ? 'h-full' : 'min-h-full')}>
      <header className="box-border flex h-14 shrink-0 items-center gap-6 border-b border-vien bg-white px-6">
        <span className="text-[17px] font-extrabold">
          {copy.appName} <span className="text-cham">{copy.appNameAccent}</span>
        </span>
        {snap && !snap.allDone && (
          <span className="-ml-3 text-sm text-phu">· {copy.setupTitle}</span>
        )}
        {ready && (
          <nav aria-label="Chính" className="flex flex-grow items-stretch self-stretch">
            {navItem('home', copy.nav.videos)}
            {navItem('settings', copy.settings.nav)}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3">
          {update && (
            <div className="flex items-center gap-3 rounded-lg border border-vien px-3 py-1.5 text-sm">
              <b>{copy.updateReady(update)}</b>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 font-bold text-cham"
                onClick={() => void api.invoke('app:restartToUpdate')}
              >
                <RefreshCw aria-hidden className="size-4" /> {copy.restartToUpdate}
              </button>
            </div>
          )}
          {ready && <UsagePill onClick={() => setRoute({ name: 'settings' })} />}
        </div>
      </header>

      {current?.name === 'home' && version && (
        <UpdateBanner info={version} onOpen={() => setShowUpdate(true)} />
      )}

      {!snap ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-phu">
          <Loader2 aria-hidden className="size-5 animate-spin" /> {copy.loading}
        </div>
      ) : !current ? (
        <SetupScreen snap={snap} />
      ) : current.name === 'ready' ? (
        <ReadyScreen onStart={() => setRoute({ name: 'home' })} />
      ) : current.name === 'home' ? (
        <HomeScreen
          onOpen={(key) => setRoute({ name: 'video', key })}
          onNew={() => setRoute({ name: 'new' })}
        />
      ) : current.name === 'new' ? (
        <NewVideoScreen
          onCancel={() => setRoute({ name: 'home' })}
          onCreated={(key) => setRoute({ name: 'video', key })}
        />
      ) : current.name === 'settings' ? (
        <SettingsScreen version={version} onOpenUpdate={() => setShowUpdate(true)} />
      ) : current.name === 'assistant' ? (
        <AssistantChatScreen chatKey={current.key} onBack={() => setRoute({ name: 'home' })} />
      ) : (
        <WorkspaceScreen
          key={current.key}
          chatKey={current.key}
          onBack={() => setRoute({ name: 'home' })}
        />
      )}

      {showUpdate && version && (
        <UpdateDialog
          info={version}
          onClose={() => setShowUpdate(false)}
          onUpdated={reloadVersion}
          onHandoff={(key) => {
            setShowUpdate(false)
            setRoute({ name: 'assistant', key })
          }}
        />
      )}
    </div>
  )
}

export default App
