import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { api, useSetup, useUpdateReady } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { SetupScreen } from '@/screens/Setup'
import { ReadyScreen } from '@/screens/Ready'
import { HomeScreen } from '@/screens/Home'
import { NewVideoScreen } from '@/screens/NewVideo'
import { WorkspaceScreen } from '@/screens/Workspace'

type Route = { name: 'ready' } | { name: 'home' } | { name: 'new' } | { name: 'video'; key: string }

function App(): React.JSX.Element {
  const snap = useSetup()
  const update = useUpdateReady()
  // Lan dau thay cai dat xong: mo app da xong tu truoc thi vao thang Video cua toi,
  // vua cai xong trong phien nay thi hien man "May ban da san sang" mot lan.
  const [route, setRoute] = useState<Route | null>(null)
  const [sawSetup, setSawSetup] = useState(false)
  if (snap && !snap.allDone && !sawSetup) setSawSetup(true)
  const current: Route | null = !snap?.allDone
    ? null
    : (route ?? (sawSetup ? { name: 'ready' } : { name: 'home' }))
  const inWorkspace = current?.name === 'video'

  return (
    <div className={cn('flex flex-col', inWorkspace ? 'h-full' : 'min-h-full')}>
      <header className="box-border flex h-14 shrink-0 items-center gap-6 border-b border-vien bg-white px-6">
        <span className="text-[17px] font-extrabold">
          {copy.appName} <span className="text-cham">{copy.appNameAccent}</span>
        </span>
        {snap && !snap.allDone && (
          <span className="-ml-3 text-sm text-phu">· {copy.setupTitle}</span>
        )}
        {current && current.name !== 'ready' && (
          <nav aria-label="Chính" className="flex items-stretch self-stretch">
            <button
              type="button"
              onClick={() => setRoute({ name: 'home' })}
              aria-current={current.name === 'home' ? 'page' : undefined}
              className={cn(
                'cursor-pointer px-2.5 text-sm',
                current.name === 'home'
                  ? 'font-bold text-navy shadow-[inset_0_-2px_0_var(--color-cham)]'
                  : 'font-semibold text-phu'
              )}
            >
              {copy.nav.videos}
            </button>
          </nav>
        )}
        {update && (
          <div className="ml-auto flex items-center gap-3 rounded-lg border border-vien px-3 py-1.5 text-sm">
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
      </header>
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
      ) : (
        <WorkspaceScreen
          key={current.key}
          chatKey={current.key}
          onBack={() => setRoute({ name: 'home' })}
        />
      )}
    </div>
  )
}

export default App
