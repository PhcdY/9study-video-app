import { ChevronLeft } from 'lucide-react'
import { useChat } from '@/lib/api'
import { copy } from '@/lib/copy'
import { ChatPanel } from '@/components/workspace/ChatPanel'

/** Cuoc tro chuyen cua app khong gan voi video nao (vd nho AI doi phien ban bo cong cu). */
export function AssistantChatScreen({
  chatKey,
  onBack
}: {
  chatKey: string
  onBack: () => void
}): React.JSX.Element {
  const chat = useChat(chatKey)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="box-border flex min-h-16 items-center gap-4 border-b border-vien bg-white px-6 py-2">
        <button
          type="button"
          aria-label={copy.workspace.back}
          onClick={onBack}
          className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] border border-vien hover:bg-nen"
        >
          <ChevronLeft aria-hidden className="size-[18px]" />
        </button>
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">{copy.assistant.phienBan}</span>
          <span className="text-[13px] text-phu">{copy.assistant.phienBanSub}</span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 bg-nen">
        <ChatPanel chatKey={chatKey} chat={chat} stage="kichBan" wide />
      </div>
    </div>
  )
}
