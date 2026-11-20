import { describe, expect, it } from 'vitest'
import { parseRange } from '../src/main/services/files-protocol'

describe('doc tung doan video (de tua duoc)', () => {
  it('hieu cac kieu Range', () => {
    expect(parseRange('bytes=0-', 1000)).toEqual([0, 999])
    expect(parseRange('bytes=100-199', 1000)).toEqual([100, 199])
    expect(parseRange('bytes=900-5000', 1000)).toEqual([900, 999])
    expect(parseRange('bytes=-100', 1000)).toEqual([900, 999])
    expect(parseRange('bytes=2000-', 1000)).toBeNull()
    expect(parseRange(null, 1000)).toBeNull()
    expect(parseRange('items=1-2', 1000)).toBeNull()
  })
})
