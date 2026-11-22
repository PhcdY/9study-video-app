import { describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  describeApproval,
  statusLabelFor,
  unwrapCommand
} from '../src/main/services/codex/approvals'
import {
  compositionIdFrom,
  listLessons,
  newestMtime,
  newVideoDirSince,
  sampleSlugsFrom,
  scanVideos,
  stageFrom
} from '../src/main/services/project'
import { chipPrompt, composeNewVideoPrompt, suggestedVoice } from '../src/shared/prompt'
import type { NewVideoInput } from '../src/shared/video'

const PS = '"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command'

describe('lenh cua AI', () => {
  it('boc lop powershell', () => {
    expect(unwrapCommand(`${PS} 'py scripts/check_script.py dao-ham'`)).toBe(
      'py scripts/check_script.py dao-ham'
    )
    expect(unwrapCommand(`${PS} 'git status --short .'`)).toBe('git status --short .')
    expect(unwrapCommand(`${PS} 'Write-Output ''a b'''`)).toBe("Write-Output 'a b'")
    expect(unwrapCommand('node scripts/storyboard.mjs x')).toBe('node scripts/storyboard.mjs x')
  })
  it('nhan dong trang thai', () => {
    expect(statusLabelFor(`${PS} 'py scripts/check_script.py a'`)).toBe('kiemKichBan')
    expect(statusLabelFor(`${PS} 'node scripts/storyboard.mjs tiem-can --scale 0.4'`)).toBe(
      'xuatStoryboard'
    )
    expect(statusLabelFor(`${PS} 'npx remotion render a out.mp4'`)).toBe('xuatVideo')
    expect(statusLabelFor(`${PS} 'Get-Content AGENTS.md'`)).toBe('docTaiLieu')
    expect(statusLabelFor(`${PS} 'rg -n beats src'`)).toBe('timTaiLieu')
    expect(statusLabelFor(`${PS} 'whoami'`)).toBe('lamViec')
  })
  it('the xin quyen: tao giong ton credit, uoc tinh thi khong', () => {
    expect(
      describeApproval(`${PS} 'py scripts/vivibe_tts.py src/videos/a/script.json --voice x'`)
    ).toEqual({
      title: 'taoGiong',
      costly: true
    })
    expect(describeApproval(`${PS} 'py scripts/vivibe_tts.py a --only b01-l02'`).title).toBe(
      'taoLaiGiong'
    )
    expect(describeApproval(`${PS} 'py scripts/vivibe_tts.py a --estimate'`).costly).toBe(false)
    expect(describeApproval(`${PS} 'git switch --detach refs/tags/4'`).title).toBe('doiBan')
    const la = describeApproval(`${PS} 'Remove-Item x'`)
    expect(la).toEqual({ title: 'lenhLa', costly: false, command: 'Remove-Item x' })
    expect(describeApproval(`${PS} 'py scripts/check_script.py a'`)).toEqual({
      title: 'congCu',
      costly: false,
      label: 'kiemKichBan'
    })
  })
})

describe('video', () => {
  it('suy ra buoc tu file co san', () => {
    const f = { hasVideoTsx: false, hasStoryboard: false, hasAudio: false, hasMp4: false }
    expect(stageFrom(f)).toBe('kichBan')
    expect(stageFrom({ ...f, hasVideoTsx: true })).toBe('duyetHinh')
    expect(stageFrom({ ...f, hasStoryboard: true, hasAudio: true })).toBe('giongDoc')
    expect(stageFrom({ ...f, hasAudio: true, hasMp4: true })).toBe('daXuat')
  })
  it('doc ma composition', () => {
    expect(compositionIdFrom('<Composition\n  id="bd-water"\n  component={X}')).toBe('bd-water')
    expect(compositionIdFrom('export const A = () => null')).toBeUndefined()
  })
  it('nhan video mau tu danh sach file cua ban phat hanh', () => {
    const s = sampleSlugsFrom([
      'src/videos/tiem-can/script.json',
      'src/videos/a/Video.tsx',
      'README.md'
    ])
    expect([...s]).toEqual(['tiem-can'])
  })

  it('bao storyboard cu khi hinh sua sau lan xuat cuoi (bao loi 22/11/2026)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'sb-'))
    try {
      const vid = path.join(dir, 'src', 'videos', 'a')
      const sb = path.join(dir, 'out', '_lam-viec', 'a', 'storyboard')
      mkdirSync(vid, { recursive: true })
      mkdirSync(path.join(sb, 'review'), { recursive: true })
      writeFileSync(path.join(vid, 'script.json'), '{"title":"A","beats":[]}')
      writeFileSync(path.join(vid, 'scene.tsx'), 'x')
      writeFileSync(path.join(sb, 'index.html'), '<html>')
      const t = (s: number): Date => new Date(Date.UTC(2026, 10, 21, 23, 0, s))
      utimesSync(path.join(vid, 'script.json'), t(0), t(0))
      utimesSync(path.join(vid, 'scene.tsx'), t(0), t(0))
      utimesSync(path.join(sb, 'index.html'), t(10), t(10))
      const scan = (): boolean | undefined =>
        scanVideos(dir, new Set(), new Set())[0].storyboardStale
      expect(scan()).toBe(false)
      // AI sua hinh, chi xuat anh rut gon trong review/: index.html van cu
      utimesSync(path.join(vid, 'scene.tsx'), t(20), t(20))
      writeFileSync(path.join(sb, 'review', 'b04.png'), 'png')
      expect(newestMtime(vid)).toBe(t(20).getTime())
      expect(scan()).toBe(true)
      // Xuat lai ban day du thi het cu
      utimesSync(path.join(sb, 'index.html'), t(30), t(30))
      expect(scan()).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('video moi khong gan vao video co san bi AI viet de (bao loi 22/11/2026)', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'moi-'))
    try {
      const root = path.join(dir, 'src', 'videos')
      const mk = (slug: string): void => {
        mkdirSync(path.join(root, slug), { recursive: true })
        writeFileSync(path.join(root, slug, 'script.json'), '{"title":"x","beats":[]}')
      }
      mk('cuc-tri-gtln-gtnn')
      const born = statSync(path.join(root, 'cuc-tri-gtln-gtnn')).birthtimeMs
      const since = born + 5100
      // AI viet de script.json cua video co san: thu muc van cu nen khong tinh
      rmSync(path.join(root, 'cuc-tri-gtln-gtnn', 'script.json'))
      writeFileSync(path.join(root, 'cuc-tri-gtln-gtnn', 'script.json'), '{"beats":[]}')
      expect(newVideoDirSince(dir, since, () => false)).toBeUndefined()
      await new Promise((r) => setTimeout(r, 200))
      mk('cuc-tri-moi')
      expect(newVideoDirSince(dir, since, () => false)).toBe('cuc-tri-moi')
      // Video mau hoac bai da co tro chuyen thi bo qua
      expect(newVideoDirSince(dir, since, (s) => s === 'cuc-tri-moi')).toBeUndefined()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const repo = 'D:\\9study-video-app\\spikes\\output\\video-repo'
  it.skipIf(!existsSync(repo))('doc that repo video thu cua Moc 0', () => {
    const vids = scanVideos(repo, new Set(['tiem-can']), new Set())
    const tiemCan = vids.find((v) => v.slug === 'tiem-can')
    expect(tiemCan?.sample).toBe(true)
    expect(tiemCan?.compositionId).toBe('tiem-can')
    // Moc 0 da xuat storyboard nhap cho tiem-can
    expect(tiemCan?.stage).toBe('duyetHinh')
    expect(vids.find((v) => v.slug === 'dao-ham-tiep-tuyen')?.stage).toBe('kichBan')
    const lessons = listLessons(repo, 'toan', 12)
    expect(lessons.length).toBeGreaterThan(3)
    expect(lessons[0].file).toMatch(/^references\/toan\/lop-12\//)
  })
})

describe('cau lenh gui AI', () => {
  const base: NewVideoInput = {
    subject: 'toan',
    lop: 12,
    loai: 'baiHoc',
    bai: 'Bài 1. Tính đơn điệu và cực trị',
    lessonFile: 'references/toan/lop-12/tap-1/bai-01-tinh-don-dieu-va-cuc-tri.md',
    voice: 'nam - c Bình',
    exams: ['THPTQG', 'TSA']
  }
  it('goi skill viet kich ban, du thong tin, khong co dong rong vo nghia', () => {
    const p = composeNewVideoPrompt(base)
    expect(p.startsWith('$viet-kich-ban\n')).toBe(true)
    expect(p).toContain('lớp 12')
    expect(p).toContain('thẻ bài học: `references/toan/lop-12/tap-1/bai-01')
    expect(p).toContain('đề xuất 2–3 góc nhìn')
    expect(p).toContain('THPTQG, TSA')
    expect(p).toContain('không sửa hay viết đè video có sẵn')
    expect(p).not.toContain('Học sinh đã học')
    expect(p).not.toContain('undefined')
  })
  it('them phan nang cao khi co dien', () => {
    const p = composeNewVideoPrompt({
      ...base,
      loai: 'hienTuong',
      bai: 'Vì sao nước sôi ở 100 độ?',
      lessonFile: undefined,
      yBanChat: 'áp suất hơi',
      moDau: 'cauDeThi',
      doDai: 'gon',
      videoTruoc: 'tiem-can'
    })
    expect(p).toContain('Câu hỏi / hiện tượng: Vì sao nước sôi')
    expect(p).toContain('Ý bản chất muốn học sinh hiểu: áp suất hơi')
    expect(p).toContain('Mở đầu bằng: một câu đề thi')
    expect(p).toContain('khoảng 2:30')
    expect(p).toContain('src/videos/tiem-can/script.json')
  })
  it('nut goi y goi dung skill', () => {
    expect(chipPrompt('duyetKichBan', 'a')).toMatch(/^\$dung-video\n/)
    expect(chipPrompt('duyetHinh', 'a')).toMatch(/^\$tao-audio\n/)
    // Xuat lai phai ra ban day du (index.html), khong phai anh rut gon --review
    expect(chipPrompt('xuatLaiStoryboard', 'a')).toMatch(/không kèm `--review` hay `--beats`/)
    expect(suggestedVoice('van')).toBe('nữ - c Nhi')
  })
})
