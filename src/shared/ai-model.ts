// Chon model va muc suy nghi (reasoning effort) cho AI lam bai.
// Danh sach lay tu Codex theo tai khoan dang dang nhap (goi Plus nhieu model hon goi Free).

/** Mot muc suy nghi model ho tro, kem mo ta Codex tra ve (tieng Anh). */
export interface AiEffortOption {
  id: string
  description: string
}

export interface AiModelOption {
  id: string
  /** Ten hien thi, vd "GPT-6.2 Sol" */
  name: string
  description: string
  /** Model Codex tu chon khi nguoi dung de "Default" */
  isDefault: boolean
  efforts: AiEffortOption[]
  defaultEffort: string
}

/** Lua chon cua nguoi dung. Bo trong mot truong = de Codex tu chon (Default). */
export interface AiChoice {
  model?: string
  effort?: string
}

/** Ten model Codex tra ve kieu "GPT-6.2-Sol"; app goc hien "GPT-6.2 Sol". */
export function modelDisplayName(name: string): string {
  return name.replace(/^(GPT-[\d.]+)-(?=[A-Za-z])/, '$1 ')
}

/**
 * Doi lua chon ra model + muc suy nghi that se gui cho Codex.
 * Model khong con trong danh sach (vd tai khoan doi goi) thi ve model mac dinh;
 * muc suy nghi model khong ho tro thi ve muc mac dinh cua model do.
 */
export function resolveAi(
  models: AiModelOption[],
  choice: AiChoice
): { model: AiModelOption; effort: string } | undefined {
  const model =
    models.find((m) => m.id === choice.model) ?? models.find((m) => m.isDefault) ?? models[0]
  if (!model) return undefined
  const effort = model.efforts.some((e) => e.id === choice.effort)
    ? (choice.effort as string)
    : model.defaultEffort
  return { model, effort }
}
