// Khong bao gio de key hay token lot vao log.
const SECRET_PATTERNS: RegExp[] = [
  /(VIVIBE_API_KEY\s*[=:]\s*)["']?[^\s"']+/gi,
  /\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, // JWT
  /\b(sk|rk|pk)-[\w-]{16,}/g,
  /("(?:access_token|refresh_token|id_token|apiKey|api_key|accessToken)"\s*:\s*")[^"]+/gi,
  /([?&](?:code|state|code_verifier|token)=)[^&\s]+/gi,
  // Email tai khoan (khong de lot vao goi bao loi)
  /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g
]

export function redact(text: string, extra: string[] = []): string {
  let out = text
  for (const re of SECRET_PATTERNS)
    out = out.replace(re, (_m, p1?: string) => `${typeof p1 === 'string' ? p1 : ''}***`)
  for (const s of extra) if (s && s.length >= 6) out = out.split(s).join('***')
  return out
}
