import { useState } from 'react'
import { View, Text, Button, StyleSheet, Pressable } from 'react-native'

import { useAuth } from '@/lib/AuthContext'

const BASE_URL = 'http://192.168.1.6:8000'

export default function TabOneScreen() {
  const { logout } = useAuth()

  const [result, setResult] = useState('Not tested yet')

  const testConnection = async () => {
    setResult('Testing...')
    try {
      const res = await fetch(`${BASE_URL}/api/auth/mobile-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ballpenandpencil619@gmail.com', password: 'yO4N9aivlL' }),
      })
      const data = await res.json()
      setResult(`Status ${res.status}: ${JSON.stringify(data)}`)
    } catch (err: any) {
      setResult(`FAILED: ${err.message}`)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{result}</Text>
      <Button title="Test Backend Connection" onPress={testConnection} />

      <Pressable onPress={logout}>
        <Text style={styles.text}>Log out (temp)</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 20, backgroundColor: 'white' },
  text: { fontSize: 16, textAlign: 'center' },
})