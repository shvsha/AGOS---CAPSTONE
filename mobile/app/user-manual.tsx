import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function UserManual() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#122A48" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Barangay User Manual</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFCFD' },
  header: { paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#122A48', textAlign: 'center' },
})