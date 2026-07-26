export const PRESET_SOUNDS: Record<string, string> = {
  critical: "/sounds/critical.mp3",
  warning: "/sounds/warning.mp3",
  info: "/sounds/info.mp3",
}

export function resolveSoundUrl(value: string): string {
  if (value.startsWith("preset:")) {
    const key = value.replace("preset:", "")
    return PRESET_SOUNDS[key] ?? PRESET_SOUNDS.info
  }
  return value.startsWith("http") ? value : `${process.env.NEXT_PUBLIC_API_URL}${value}`
}