import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAlertsContext } from '../../lib/AlertsContext'

export default function AlertBellButton() {
  const router = useRouter()
  const { unreadCount } = useAlertsContext()

  return (
    <Pressable onPress={() => router.push('/(tabs)/alerts')} hitSlop={10} className="relative">
      <Ionicons name="notifications-outline" size={22} color="#334155" />
      {unreadCount > 0 && (
        <View className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D81010] items-center justify-center">
          <Text className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  )
}