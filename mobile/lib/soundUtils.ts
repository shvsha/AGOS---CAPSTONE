import { BASE_URL } from './api'

export const PRESET_SOUNDS: Record<string, any> = {
  critical: require('../assets/sounds/critical.mp3'),
  warning: require('../assets/sounds/warning.mp3'),
  info: require('../assets/sounds/info.mp3'),
}

export function resolveSoundSource(value: string) {
  if (value.startsWith('preset:')) {
    const key = value.replace('preset:', '')
    return PRESET_SOUNDS[key] ?? PRESET_SOUNDS.info
  }
  return value.startsWith('http') ? { uri: value } : { uri: `${BASE_URL}${value}` }
}