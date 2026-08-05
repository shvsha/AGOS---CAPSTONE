import { Modal, Pressable, Text, View, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/AuthContext'

interface Props {
  visible: boolean
  onClose: () => void
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2.5 border-b border-slate-100">
      <Text className="text-[12px] text-slate-500">{label}</Text>
      <Text className="text-[13px] font-semibold text-slate-800">{value}</Text>
    </View>
  )
}

export default function ProfileSheet({ visible, onClose }: Props) {
  const { user, logout } = useAuth()
  if (!user) return null

  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { onClose(); logout() } },
    ])
  }

  const handleUserManual = () => {
    Alert.alert('Coming soon', 'The user manual will be available in a future update.')
  }

  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable className="flex-1 bg-black/35 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-3xl p-5" onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="person-circle-outline" size={18} color="#122A48" />
              <Text className="ml-2 text-[15px] font-bold text-slate-800">Profile</Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Avatar + name */}
          <View className="items-center mb-5">
            <View className="w-16 h-16 rounded-full bg-[#122A48] items-center justify-center mb-2">
              <Text className="text-white text-lg font-bold">{initials}</Text>
            </View>
            <Text className="text-[16px] font-bold text-slate-800">
              {user.first_name} {user.last_name}
            </Text>
            <Text className="text-[12px] text-slate-500">{user.position ?? user.user_role}</Text>
          </View>

          {/* Credentials */}
          <CredentialRow label="Email" value={user.email} />
          <CredentialRow label="Role" value={user.user_role} />
          {user.barangay_details && (
            <CredentialRow label="Barangay" value={user.barangay_details.barangay_name} />
          )}
          <CredentialRow label="Status" value={user.status} />

          {/* Actions */}
          <Pressable
            className="w-full border border-slate-300 rounded-lg py-3.5 items-center mt-5 flex-row justify-center gap-2"
            onPress={handleUserManual}
          >
            <Ionicons name="book-outline" size={16} color="#334155" />
            <Text className="text-slate-700 text-[14px] font-semibold">User Manual</Text>
          </Pressable>

          <Pressable
            className="w-full bg-[#D81010] rounded-lg py-3.5 items-center mt-3 flex-row justify-center gap-2"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={16} color="white" />
            <Text className="text-white text-[14px] font-semibold">Log Out</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}