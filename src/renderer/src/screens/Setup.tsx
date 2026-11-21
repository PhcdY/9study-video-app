import { useState } from 'react'
import type { SetupSnapshot } from '../../../shared/types'
import { StepNav } from '@/components/setup/StepNav'
import { StepPanel } from '@/components/setup/StepPanel'

/** Buoc dang lam: buoc dang chay, neu khong thi buoc dau tien chua xong. */
function activeIndex(snap: SetupSnapshot): number {
  const running = snap.steps.findIndex((s) => s.status === 'running')
  if (running >= 0) return running
  // Vua nhan xong du lieu cu: dung o man "Da nhan" cho toi khi bam Tiep tuc
  if (snap.legacy?.result && !snap.legacy.seen) {
    const i = snap.steps.findIndex((s) => s.id === 'taiDuAn')
    if (i >= 0) return i
  }
  const next = snap.steps.findIndex((s) => s.status === 'ready' || s.status === 'error')
  return next >= 0 ? next : snap.steps.length - 1
}

export function SetupScreen({ snap }: { snap: SetupSnapshot }): React.JSX.Element {
  const auto = activeIndex(snap)
  // Nguoi dung bam xem buoc khac; khi buoc dang lam doi (vua xong mot buoc) thi tu nhay sang buoc moi
  const [picked, setPicked] = useState<{ index: number; auto: number } | null>(null)
  const current = picked && picked.auto === auto ? picked.index : auto
  const step = snap.steps[current]

  return (
    <div className="box-border flex flex-1 flex-wrap items-start gap-8 px-12 py-10">
      <StepNav
        steps={snap.steps}
        current={current}
        onSelect={(index) => setPicked({ index, auto })}
      />
      <StepPanel key={step.id} snap={snap} step={step} index={current} />
    </div>
  )
}
