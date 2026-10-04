const norm = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim())

export const sameText = (a: unknown, b: unknown) => norm(a) === norm(b)

// "5" vs 5 vs "5.0" count as the same number; empty only equals empty
export const sameNum = (a: unknown, b: unknown) => {
  const x = norm(a), y = norm(b)
  if (!x || !y) return x ===y
  return Number(x) === Number(y)
}