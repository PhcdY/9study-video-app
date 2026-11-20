import { useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { copy } from '@/lib/copy'
import { Button } from '@/components/ui/button'

export function ReadyScreen(): React.JSX.Element {
  const [home, setHome] = useState(false)
  if (home)
    return (
      <div className="flex flex-1 flex-col gap-2 px-12 py-10">
        <h1 className="m-0 text-[28px] font-extrabold">{copy.ready.homeTitle}</h1>
        <p className="m-0 text-base text-phu">{copy.ready.homeSoon}</p>
      </div>
    )
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="flex max-w-[560px] flex-col items-center gap-5 rounded-xl border border-vien bg-white px-12 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-xong-nen">
          <PartyPopper aria-hidden className="size-7 text-xong" />
        </div>
        <h1 className="m-0 text-[28px] font-extrabold">{copy.ready.title}</h1>
        <p className="m-0 text-base leading-relaxed text-phu">{copy.ready.desc}</p>
        <Button onClick={() => setHome(true)}>{copy.ready.primary}</Button>
      </div>
    </div>
  )
}
