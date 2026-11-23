import { useState } from 'react'
import { Check, ChevronLeft, MessageSquareWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FeedbackTarget } from '@/screens/Feedback'
import type { VideoStage } from '../../../shared/video'
import { togglePick, type Pick } from '../../../shared/picks'
import { subjectName } from '../../../shared/prompt'
import { api, useAppUpdate, useChat, useVideos } from '@/lib/api'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { ChatPanel } from '@/components/workspace/ChatPanel'
import { UsagePill } from '@/components/UsagePill'
import { UpdatePill } from '@/components/UpdatePill'
import {
  AudioTab,
  FinalTab,
  ScriptTab,
  StoryboardTab,
  StudioTab
} from '@/components/workspace/ResultTabs'

type Tab = keyof typeof copy.workspace.tabs
const TABS: Tab[] = ['kichBan', 'storyboard', 'chuyenDong', 'giongDoc', 'thanhPham']
const DEFAULT_TAB: Record<VideoStage, Tab> = {
  kichBan: 'kichBan',
  duyetHinh: 'storyboard',
  giongDoc: 'giongDoc',
  daXuat: 'thanhPham'
}
const STEPS: VideoStage[] = ['kichBan', 'duyetHinh', 'giongDoc']

export function WorkspaceScreen({
  chatKey,
  onBack,
  onFeedback
}: {
  chatKey: string
  onBack: () => void
  onFeedback: (t: FeedbackTarget) => void
}): React.JSX.Element {
  const chat = useChat(chatKey)
  const videos = useVideos()
  const update = useAppUpdate()
  const slug = chat?.slug ?? (chatKey.startsWith('moi-') ? undefined : chatKey)
  // Video moi dang do (chua co thu muc): tim theo khoa cuoc tro chuyen
  const video = videos?.videos.find((v) => v.slug === (slug ?? chatKey))
  const stage: VideoStage = video?.stage ?? 'kichBan'
  // Tab do nguoi dung chon; khi video sang buoc moi thi tu ve tab hop voi buoc do
  const [picked, setPicked] = useState<{ tab: Tab; stage: VideoStage } | null>(null)
  const tab = picked && picked.stage === stage ? picked.tab : DEFAULT_TAB[stage]
  // Anh / cau dang chon de nho AI sua (theo tung video)
  const [chosen, setChosen] = useState<{ key: string; list: Pick[] }>({ key: chatKey, list: [] })
  const picks = chosen.key === chatKey ? chosen.list : []
  const setPicks = (list: Pick[]): void => setChosen({ key: chatKey, list })
  const onPick = (p: Pick): void => setPicks(togglePick(picks, p))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="box-border flex min-h-16 flex-wrap items-center gap-4 border-b border-vien bg-white px-6 py-2">
        <button
          type="button"
          aria-label={copy.workspace.back}
          onClick={onBack}
          className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] border border-vien hover:bg-nen"
        >
          <ChevronLeft aria-hidden className="size-[18px]" />
        </button>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <span className="truncate text-base font-bold">
            {video?.title ?? copy.workspace.newTitle}
          </span>
          <span className="text-[13px] text-phu">
            {video
              ? [
                  `${subjectName(video.subject)}${video.lop ? ` ${video.lop}` : ''}`,
                  copy.home.loai(video.loai)
                ]
                  .filter(Boolean)
                  .join(' · ')
              : copy.workspace.newSub}
          </span>
        </div>
        <StageBar stage={stage} />
        {slug && !video?.draft && (
          <Button variant="outline" size="sm" onClick={() => onFeedback({ slug })}>
            <MessageSquareWarning aria-hidden className="size-4" /> {copy.feedback.open}
          </Button>
        )}
        {update && <UpdatePill update={update} />}
        <UsagePill />
      </div>

      <div className="flex min-h-0 flex-1">
        <ChatPanel
          chatKey={chatKey}
          chat={chat}
          slug={slug}
          stage={stage}
          draft={!slug && !!video?.draft}
          picks={picks}
          onPicksChange={setPicks}
        />
        <section
          aria-label="Kết quả"
          className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-4 overflow-y-auto px-6 py-5"
        >
          <div
            role="tablist"
            className="no-scrollbar flex max-w-full shrink-0 gap-1 self-start overflow-x-auto rounded-lg border border-vien bg-white p-1"
          >
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setPicked({ tab: t, stage })}
                className={cn(
                  'h-9 shrink-0 cursor-pointer rounded-lg px-3.5 text-sm whitespace-nowrap',
                  tab === t
                    ? 'bg-cham-nhat font-bold text-cham'
                    : 'font-semibold text-phu hover:text-navy'
                )}
              >
                {copy.workspace.tabs[t]}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="flex min-h-0 flex-1 flex-col">
            {tab === 'kichBan' && (
              <ScriptTab slug={slug} version={video?.draft ? undefined : video?.updatedAt} />
            )}
            {tab === 'storyboard' && (
              <StoryboardTab
                video={video}
                slug={slug}
                picks={picks}
                onPick={onPick}
                onFeedback={(beatLine) => slug && onFeedback({ slug, beatLine, kind: 'hinh' })}
                onRefresh={
                  slug && !chat?.busy
                    ? () => void api.invoke('chat:chip', chatKey, 'xuatLaiStoryboard', slug)
                    : undefined
                }
              />
            )}
            {tab === 'chuyenDong' && <StudioTab compositionId={video?.compositionId} />}
            {tab === 'giongDoc' && (
              <AudioTab
                slug={slug}
                version={video?.updatedAt}
                picks={picks}
                onPick={onPick}
                onWrong={(beatLine) => slug && onFeedback({ slug, beatLine, kind: 'giong' })}
              />
            )}
            {tab === 'thanhPham' && (
              <FinalTab video={video} onFeedback={(time) => slug && onFeedback({ slug, time })} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StageBar({ stage }: { stage: VideoStage }): React.JSX.Element {
  const at = stage === 'daXuat' ? 3 : STEPS.indexOf(stage)
  return (
    <ol aria-label="Tiến độ video" className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden className={cn('h-0.5 w-5', i <= at ? 'bg-xong' : 'bg-vien-dam')} />
          )}
          <span
            aria-current={i === at ? 'step' : undefined}
            className={cn(
              'flex h-9 items-center gap-2 rounded-full px-3 text-sm',
              i < at && 'bg-xong-nen font-semibold text-xong',
              i === at && 'bg-cham font-bold text-white',
              i > at && 'border border-vien bg-white font-semibold text-phu'
            )}
          >
            {i < at ? (
              <Check aria-hidden className="size-4" strokeWidth={2.4} />
            ) : (
              <span>{i + 1} ·</span>
            )}
            <span>{copy.stage[s]}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
