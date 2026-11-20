import { Loader2, RefreshCw } from 'lucide-react'
import { api, useSetup, useUpdateReady } from '@/lib/api'
import { copy } from '@/lib/copy'
import { SetupScreen } from '@/screens/Setup'
import { ReadyScreen } from '@/screens/Ready'

function App(): React.JSX.Element {
  const snap = useSetup()
  const update = useUpdateReady()

  return (
    <div className="flex min-h-full flex-col">
      <header className="box-border flex h-14 items-center gap-3 border-b border-vien bg-white px-6">
        <span className="text-[17px] font-extrabold">
          {copy.appName} <span className="text-cham">{copy.appNameAccent}</span>
        </span>
        {snap && !snap.allDone && <span className="text-sm text-phu">· {copy.setupTitle}</span>}
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
      ) : snap.allDone ? (
        <ReadyScreen />
      ) : (
        <SetupScreen snap={snap} />
      )}
    </div>
  )
}

export default App
