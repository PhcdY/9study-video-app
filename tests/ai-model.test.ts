import { describe, expect, it } from 'vitest'
import { modelDisplayName, resolveAi, type AiModelOption } from '../src/shared/ai-model'

const efforts = (ids: string[]): AiModelOption['efforts'] =>
  ids.map((id) => ({ id, description: id }))

const models: AiModelOption[] = [
  {
    id: 'gpt-6.2-sol',
    name: 'GPT-6.2 Sol',
    description: '',
    isDefault: true,
    efforts: efforts(['low', 'medium', 'high', 'xhigh', 'max']),
    defaultEffort: 'low'
  },
  {
    id: 'gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    description: '',
    isDefault: false,
    efforts: efforts(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']),
    defaultEffort: 'medium'
  }
]

describe('resolveAi', () => {
  it('de trong thi dung model mac dinh va muc mac dinh cua model do', () => {
    const r = resolveAi(models, {})
    expect(r?.model.id).toBe('gpt-6.2-sol')
    expect(r?.effort).toBe('low')
  })
  it('giu model va muc nguoi dung chon', () => {
    const r = resolveAi(models, { model: 'gpt-5.6-terra', effort: 'ultra' })
    expect(r?.model.id).toBe('gpt-5.6-terra')
    expect(r?.effort).toBe('ultra')
  })
  it('muc model khong ho tro thi ve muc mac dinh cua model', () => {
    expect(resolveAi(models, { model: 'gpt-6.2-sol', effort: 'ultra' })?.effort).toBe('low')
  })
  it('model khong con trong danh sach (tai khoan doi goi) thi ve model mac dinh', () => {
    const r = resolveAi(models, { model: 'gpt-6.2-astra', effort: 'high' })
    expect(r?.model.id).toBe('gpt-6.2-sol')
    expect(r?.effort).toBe('high')
  })
  it('chua lay duoc danh sach thi khong chon gi', () => {
    expect(resolveAi([], { model: 'gpt-6.2-sol' })).toBeUndefined()
  })
})

describe('modelDisplayName', () => {
  it('doi ten kieu Codex sang kieu app goc', () => {
    expect(modelDisplayName('GPT-6.2-Sol')).toBe('GPT-6.2 Sol')
    expect(modelDisplayName('GPT-6-Luna')).toBe('GPT-6 Luna')
    expect(modelDisplayName('GPT-6.1 Terra')).toBe('GPT-6.1 Terra')
  })
})
