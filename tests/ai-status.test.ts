import { describe, expect, it } from 'vitest'
import { aiStatusOf, type ChatItem } from '../src/shared/video'

const user: ChatItem = { kind: 'user', id: 'u', text: 'chào' }
const err: ChatItem = { kind: 'error', id: 'e', code: 'mang' }
const ask = (state: 'pending' | 'accepted'): ChatItem => ({
  kind: 'approval',
  id: 'a',
  title: 'taoGiong',
  costly: true,
  state
})

describe('aiStatusOf', () => {
  it('dang chay khi AI dang lam', () => {
    expect(aiStatusOf([user], true)).toBe('dang')
  })
  it('cho ban duyet khi co the xin quyen chua tra loi, ke ca luc dang chay', () => {
    expect(aiStatusOf([user, ask('pending')], true)).toBe('cho')
    expect(aiStatusOf([user, ask('accepted')], false)).toBe('dung')
  })
  it('gap loi khi dong cuoi la loi va khong chay', () => {
    expect(aiStatusOf([user, err], false)).toBe('loi')
    expect(aiStatusOf([user, err, user], false)).toBe('dung')
  })
  it('da dung khi chua co gi', () => {
    expect(aiStatusOf([], false)).toBe('dung')
  })
})
