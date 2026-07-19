import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../lib/AuthContext'
import { useRouter } from 'expo-router'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCredentials = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value)
    else setPassword(value)
    setFieldError('')
    setLoginError('')
  }

  const handleLogin = async () => {
    setFieldError('')
    setLoginError('')

    if (!email.trim() || !password.trim()) {
      setFieldError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      if (user.must_change_password) {
        router.replace('/change-password')
      } else {
        router.replace('/(tabs)')
      }
    } catch (err: any) {
      setLoginError(err?.error ?? 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const hasError = !!(fieldError || loginError)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>AGOS</Text>
          </View>

          <Text style={styles.brand}>AGOS</Text>
          <Text style={styles.title}>
            Automated Geospatial Canal Obstruction Sensing System
          </Text>

          {/* email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#122A48BA" style={styles.leftIcon} />
              <TextInput
                style={[styles.input, hasError ? styles.inputError : null]}
                value={email}
                onChangeText={t => handleCredentials('email', t)}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@rosario.gov.ph"
                placeholderTextColor="#122A4870"
              />
            </View>
          </View>

          {/* password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color="#122A48BA" style={styles.leftIcon} />
              <TextInput
                style={[styles.input, styles.inputWithBothIcons, hasError ? styles.inputError : null]}
                value={password}
                onChangeText={t => handleCredentials('password', t)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="••••••••"
                placeholderTextColor="#122A4870"
              />
              <Pressable style={styles.rightIcon} onPress={() => setShowPassword(v => !v)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={16} color="#122A48BA" />
              </Pressable>
            </View>
          </View>

          {fieldError ? (
            <View style={styles.errorRow}>
              <Text style={styles.errorDot}>⊙</Text>
              <Text style={styles.error}>{fieldError}</Text>
            </View>
          ) : null}
          {loginError ? (
            <View style={styles.errorRow}>
              <Text style={styles.errorDot}>⊙</Text>
              <Text style={styles.error}>{loginError}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>

          {/* forgot password — stub for now, wire up once the OTP flow exists on mobile */}
          <Pressable onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </Pressable>

          <View style={styles.divider} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFCFD' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFAFA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#CDE3DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { color: '#122A48', fontWeight: '700', fontSize: 14 },
  brand: { fontSize: 12, color: '#000', textAlign: 'center' },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565BC',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  field: { width: '100%', marginBottom: 12 },
  label: { fontSize: 13, color: '#122A48', marginBottom: 6, fontWeight: '500' },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  leftIcon: { position: 'absolute', left: 12, zIndex: 1 },
  rightIcon: { position: 'absolute', right: 12, padding: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#CDE3DEB0',
    color: '#122A48',
  },
  inputWithBothIcons: { paddingRight: 36 },
  inputError: { borderColor: '#D81010' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '100%', marginTop: -4, marginBottom: 8 },
  errorDot: { color: '#D81010', fontSize: 12 },
  error: { color: '#D81010', fontSize: 12 },
  button: {
    width: '100%',
    backgroundColor: '#122A48',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  forgotLink: {
    color: '#1565BC',
    fontSize: 13,
    textDecorationLine: 'underline',
    marginBottom: 12,
    marginTop: 4,
  },
  divider: { width: '100%', height: 1, backgroundColor: '#1565BC', marginTop: 8 },
})