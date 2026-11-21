import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  importedNames,
  isSafeSlug,
  unregisterVideo,
  videoPaths
} from '../src/main/services/remove-video'
import type { ScriptData } from '../src/shared/video'

const ROOT = `import React from "react";
import { MyComposition } from "./Composition";
import { DonDieuComposition } from "./videos/don-dieu/Video";
import { TinhDonDieuComposition } from "./videos/tinh-don-dieu-va-cuc-tri/Video";
import { DonDieuMoiComposition } from "./videos/don-dieu-moi/Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <DonDieuComposition />
      <TinhDonDieuComposition />
      <DonDieuMoiComposition />
    </>
  );
};
`

describe('go video khoi Root.tsx', () => {
  it('bo import va the cua dung bai, giu bai cung tien to', () => {
    const out = unregisterVideo(ROOT, 'don-dieu')!
    expect(out).not.toContain('videos/don-dieu/')
    expect(out).not.toMatch(/<DonDieuComposition \/>/)
    expect(out).toContain('<DonDieuMoiComposition />')
    expect(out).toContain('./videos/don-dieu-moi/Video')
    expect(out).toContain('<TinhDonDieuComposition />')
    expect(out.split('\n').length).toBe(ROOT.split('\n').length - 2)
  })

  it('giu xuong dong CRLF', () => {
    const crlf = ROOT.replace(/\n/g, '\r\n')
    const out = unregisterVideo(crlf, 'tinh-don-dieu-va-cuc-tri')!
    expect(out).not.toContain('TinhDonDieu')
    expect(out.replace(/\r\n/g, '')).not.toContain('\n')
  })

  it('bai chua dang ky thi giu nguyen', () => {
    expect(unregisterVideo(ROOT, 'bai-moi')).toBe(ROOT)
  })

  it('the Composition nhieu dong dung component cua bai', () => {
    const src = `import { Composition } from "remotion";
import { Scene as BaiA } from "./videos/bai-a/Video";
export const R = () => (
  <>
    <Composition
      id="bai-a"
      component={BaiA}
      width={1920}
      height={1080}
    />
    <Composition id="khac" component={Khac} />
  </>
);
`
    const out = unregisterVideo(src, 'bai-a')!
    expect(out).not.toContain('BaiA')
    expect(out).not.toContain('bai-a')
    expect(out).toContain('<Composition id="khac" component={Khac} />')
  })

  it('con cho nhac toi bai ma khong go sach duoc thi khong sua', () => {
    const src = `import { A } from "./videos/bai-a/Video";
export const R = () => <>{show && <A />}</>;
`
    expect(unregisterVideo(src, 'bai-a')).toBeNull()
  })

  it('ten bien cua cau import', () => {
    expect(importedNames('{ A, B as C }')).toEqual(['A', 'C'])
    expect(importedNames('D, { E }')).toEqual(['E', 'D'])
    expect(importedNames('* as F')).toEqual(['F'])
  })

  it('slug chi la ten thu muc', () => {
    expect(isSafeSlug('tinh-don-dieu')).toBe(true)
    expect(isSafeSlug('..')).toBe(false)
    expect(isSafeSlug('a/b')).toBe(false)
    expect(isSafeSlug('a\\b')).toBe(false)
    expect(isSafeSlug('')).toBe(false)
  })
})

describe('file cua mot video', () => {
  it('liet ke thu muc bai, giong doc, anh soat va file thanh pham cua dung bai', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'xoa-video-'))
    try {
      const mk = (...p: string[]): string => {
        const f = path.join(dir, ...p)
        mkdirSync(path.dirname(f), { recursive: true })
        writeFileSync(f, 'x')
        return f
      }
      mk('src', 'videos', 'cuc-tri', 'script.json')
      mk('public', 'audio', 'cuc-tri', 'manifest.json')
      mk('public', 'audio', 'cuc-tri-xien', 'manifest.json')
      mk('out', '_lam-viec', 'CucTri', 'storyboard', 'index.html')
      const lesson = ['out', 'Toán', 'Lớp 12', 'Chương 1', 'Bài 1']
      const mp4 = mk(...lesson, 'CucTri.mp4')
      const srt = mk(...lesson, 'CucTri.srt')
      const other = mk(...lesson, 'Khac.mp4')
      const s = { subject: 'toan', lop: 12, chuong: 'Chương 1', bai: 'Bài 1' } as ScriptData
      const got = videoPaths(dir, 'cuc-tri', 'CucTri', s)
      expect(got.sort()).toEqual(
        [
          path.join(dir, 'src', 'videos', 'cuc-tri'),
          path.join(dir, 'public', 'audio', 'cuc-tri'),
          path.join(dir, 'out', '_lam-viec', 'CucTri'),
          mp4,
          srt
        ].sort()
      )
      expect(got).not.toContain(other)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
