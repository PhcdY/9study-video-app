// Dich lenh AI chay sang ma nhan tieng Viet (giao dien doi ma -> cau trong copy.ts). Ham thuan, co bai thu.
import type { ApprovalTitle, StatusLabel } from '../../../shared/video'
import { childEnv, exe } from '../runtime'
import { run } from '../process'

/**
 * Codex tren Windows boc lenh trong powershell: `"C:\...\powershell.exe" -Command 'py scripts/x.py a'`.
 * Boc lop vo de lay lenh that.
 */
export function unwrapCommand(cmd: string): string {
  const m =
    /^\s*"?[^"]*?(?:powershell|pwsh)(?:\.exe)?"?\s+(?:-NoProfile\s+)?-Command\s+(['"])([\s\S]*)\1\s*$/i.exec(
      cmd
    )
  if (m) return m[2].replace(/''/g, "'").trim()
  const c = /^\s*"?[^"]*?cmd(?:\.exe)?"?\s+\/[cs]\s+([\s\S]*)$/i.exec(cmd)
  if (c) return c[1].replace(/^"([\s\S]*)"$/, '$1').trim()
  return cmd.trim()
}

/** Ma nhan cho dong trang thai khi AI dang chay lenh. */
export function statusLabelFor(rawCommand: string): StatusLabel {
  const c = unwrapCommand(rawCommand)
  if (/vivibe_tts\.py|scripts[/\\]tts\.py/.test(c)) return 'taoGiong'
  if (/align_words\.py/.test(c)) return 'canTu'
  if (/remotion\s+render|export-captions/.test(c)) return 'xuatVideo'
  if (/storyboard\.mjs/.test(c)) return 'xuatStoryboard'
  if (/check-layout\.mjs/.test(c)) return 'kiemBoCuc'
  if (/stills\.mjs/.test(c)) return 'chupAnh'
  if (/check_script\.py/.test(c)) return 'kiemKichBan'
  if (/npm\s+run\s+lint|\btsc\b|eslint/.test(c)) return 'kiemLoi'
  if (/^git\s/.test(c)) return 'xemBan'
  if (/^(rg|grep|findstr|Select-String)\b|Get-ChildItem.*-Recurse/i.test(c)) return 'timTaiLieu'
  if (/^(cat|type|Get-Content|head|tail|sed|ls|dir|Get-ChildItem)\b/i.test(c)) return 'docTaiLieu'
  return 'lamViec'
}

export interface ApprovalInfo {
  title: ApprovalTitle
  costly: boolean
  /** Lenh nguyen van, chi hien khi la lenh la */
  command?: string
  /** Viec quen thuoc cua bo cong cu */
  label?: StatusLabel
}

/** Thong tin the xin quyen cho mot lenh. */
export function describeApproval(rawCommand: string, reason?: string | null): ApprovalInfo {
  const c = unwrapCommand(rawCommand)
  if (/vivibe_tts\.py/.test(c) && !/--(estimate|list-voices)\b/.test(c))
    return { title: /--only\b/.test(c) ? 'taoLaiGiong' : 'taoGiong', costly: true }
  if (/remotion\s+render/.test(c)) return { title: 'xuatVideo', costly: false }
  if (/^git\s+(switch|checkout|pull|reset|stash|merge|rebase|fetch)\b/.test(c))
    return { title: 'doiBan', costly: false }
  if (/^npm\s+(install|i|ci)\b|npx\s+remotion\s+browser/.test(c))
    return { title: 'caiThuVien', costly: false }
  // Cong cu cua bo cong cu va lenh chi doc: hien ten viec thay cho lenh
  const label = statusLabelFor(rawCommand)
  if (label !== 'lamViec') return { title: 'congCu', costly: false, label }
  if (reason && /network|mạng|internet/i.test(reason))
    return { title: 'mang', costly: false, command: c }
  return { title: 'lenhLa', costly: false, command: c }
}

/**
 * Khoa "loai viec" cho nut "Luon cho phep viec nay". Codex chi nho dung nguyen cau lenh da duyet
 * (acceptForSession), con AI thuong chay lai cung cong cu voi tham so khac (`--estimate`,
 * `--list-voices`, bo cau khac...) nen hoi lai. App tu nho theo loai viec nay.
 * Tra ve null khi viec phai hoi tung lan (ton credit, lenh la).
 */
export function approvalKey(info: ApprovalInfo, rawCommand: string): string | null {
  if (info.costly || info.title === 'lenhLa') return null
  const argv = splitArgs(unwrapCommand(rawCommand))
  switch (info.title) {
    case 'congCu':
      return info.label ? `congCu:${info.label}` : null
    case 'doiBan':
      // git switch khac git reset: moi kieu doi ban duyet rieng
      return `doiBan:${argv[1] ?? ''}`
    case 'mang':
      // Cung chuong trinh, cung script (vd "py scripts/x.py ...")
      return argv.length ? `mang:${argv.slice(0, 2).join(' ')}` : null
    default:
      return info.title
  }
}

/** Tach dong lenh thanh tham so (ton trong dau ngoac kep / don). */
export function splitArgs(cmd: string): string[] {
  const out: string[] = []
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cmd))) out.push(m[1] ?? m[2] ?? m[3])
  return out
}

/** Doc dong tom tat cua vivibe_tts.py: "... · 49 dòng cần tạo · tổng 3640 ký tự (...)". */
export function parseVoiceEstimate(text: string): { lines: number; chars: number } | null {
  const m = /(\d+)\s+dòng cần tạo[\s\S]*?tổng\s+(\d+)\s+ký tự/.exec(text)
  return m ? { lines: Number(m[1]), chars: Number(m[2]) } : null
}

/** Chay lai lenh tao giong doc o che do --estimate (khong goi API, khong ton credit). */
export async function estimateVoice(
  projectDir: string,
  rawCommand: string
): Promise<{ lines: number; chars: number } | null> {
  const argv = splitArgs(unwrapCommand(rawCommand))
  const i = argv.findIndex((a) => /vivibe_tts\.py$/.test(a))
  if (i < 0) return null
  const out: string[] = []
  const res = await run(exe.py(), [...argv.slice(i), '--estimate'], {
    cwd: projectDir,
    env: childEnv(projectDir),
    onLine: (l) => out.push(l),
    signal: AbortSignal.timeout(60_000)
  })
  return res.code === 0 ? parseVoiceEstimate(out.join('\n')) : null
}
