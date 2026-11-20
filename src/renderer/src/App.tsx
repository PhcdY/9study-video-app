import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { api, useFeedback, usePrefs, useSetup, useUpdateReady, useVersion } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { SetupScreen } from '@/screens/Setup'
import { ReadyScreen } from '@/screens/Ready'
import { HomeScreen } from '@/screens/Home'
import { NewVideoScreen } from '@/screens/NewVideo'
import { WorkspaceScreen } from '@/screens/Workspace'
import { SettingsScreen } from '@/screens/Settings'
import { AssistantChatScreen } from '@/screens/AssistantChat'
import { FeedbackScreen, type FeedbackTarget } from '@/screens/Feedback'
import { InboxScreen } from '@/screens/Inbox'
import { UsagePill } from '@/components/UsagePill'
import logoNgang from '@/assets/brand/logo-ngang.png'
import { UpdateBanner, UpdateDialog } from '@/components/UpdateDialog'

type Route =
  | { name: 'ready' }
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'settings' }
  | { name: 'video'; key: string }
  | { name: 'assistant'; key: string; from?: 'inbox' }
  | { name: 'feedback'; target: FeedbackTarget; backKey: string }
  | { name: 'inbox' }

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
  const fullHeight =
    current?.name === 'video' || current?.name === 'assistant' || current?.name === 'feedback'
  const [prefs] = usePrefs()
  const [feedback] = useFeedback()
  const newFeedback = feedback?.items.filter((it) => it.state.status === 'moi').length ?? 0
  const ready = !!current && current.name !== 'ready'
  const [version, reloadVersion] = useVersion()

  const navItem = (
    name: 'home' | 'settings' | 'inbox',
    label: string,
    badge?: number
  ): React.JSX.Element => (
    <button
      type="button"
      onClick={() => setRoute({ name } as Route)}
      aria-current={current?.name === name ? 'page' : undefined}
      className={cn(
        'flex cursor-pointer items-center px-2.5 text-sm',
        current?.name === name
          ? 'font-bold text-navy shadow-[inset_0_-2px_0_var(--color-cham)]'
          : 'font-semibold text-phu hover:text-navy'
      )}
    >
      {label}
      {!!badge && (
        <span className="ml-1.5 rounded-full bg-cham px-1.5 py-px text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <div className={cn('flex flex-col', fullHeight ? 'h-full' : 'min-h-full')}>
      {/* Man lam video co thanh rieng (theo thiet ke), khong co thanh dau chung */}
      {!fullHeight && (
        <header className="sticky top-0 z-30 shrink-0 border-b border-vien bg-white">
          <div
            className={cn(
              'box-border flex h-14 items-center gap-7',
              // Cai dat lan dau: thanh trai het chieu ngang; cac man khac: thang hang voi noi dung (1180)
              ready ? 'mx-auto w-full max-w-[1180px] px-8' : 'px-6'
            )}
          >
            <span className="flex items-center gap-2">
              <img src={logoNgang} alt={copy.appName} className="h-7 w-auto" draggable={false} />
              <span className="text-base font-extrabold text-cham">{copy.appNameAccent}</span>
              {snap && !snap.allDone && (
                <span className="ml-1 text-sm text-phu">· {copy.setupTitle}</span>
              )}
            </span>
            {ready && (
              <nav aria-label="Chính" className="flex items-stretch gap-1 self-stretch">
                {navItem('home', copy.nav.videos)}
                {prefs?.maintainer && navItem('inbox', copy.inbox.nav, newFeedback)}
                {navItem('settings', copy.settings.nav)}
              </nav>
            )}
            <div className="ml-auto flex items-center gap-3">
              {update && (
                <div className="flex items-center gap-3 rounded-[10px] border border-vien px-3 py-1.5 text-sm">
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
              {ready && current?.name === 'inbox' && (
                <span className="rounded-md bg-[#F1F3FA] px-2.5 py-1 text-xs font-semibold text-phu">
                  {copy.inbox.mode}
                </span>
              )}
              {ready && <UsagePill onOpenSettings={() => setRoute({ name: 'settings' })} />}
            </div>
          </div>
        </header>
      )}

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
        <AssistantChatScreen
          chatKey={current.key}
          onBack={() => setRoute({ name: current.from ?? 'home' } as Route)}
        />
      ) : current.name === 'inbox' ? (
        <InboxScreen
          version={version}
          onOpenChat={(key) => setRoute({ name: 'assistant', key, from: 'inbox' })}
        />
      ) : current.name === 'feedback' ? (
        <FeedbackScreen
          target={current.target}
          onClose={() => setRoute({ name: 'video', key: current.backKey })}
        />
      ) : (
        <WorkspaceScreen
          key={current.key}
          chatKey={current.key}
          onBack={() => setRoute({ name: 'home' })}
          onFeedback={(target) => setRoute({ name: 'feedback', target, backKey: current.key })}
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
