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
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { useRouter } from 'expo-router'

export default function ChangePassword() {
  const { logout } = useAuth()
  const router = useRouter()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [validationError, setValidationError] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [errorModal, setErrorModal] = useState({ open: false, message: '' })

  // same four rules as the web change-password page — enforced client-side
  // only, since the backend doesn't validate password strength itself
  const passwordRequirements = [
    { label: 'Must be at least 8 characters', valid: newPassword.length >= 8 },
    { label: 'Must contain one special character', valid: /[^a-zA-Z0-9]/.test(newPassword) },
    { label: 'Passwords must match', valid: newPassword === confirmNewPassword && confirmNewPassword !== '' },
    { label: 'Must be different from your current password', valid: newPassword !== '' && newPassword !== oldPassword },
  ]

  const handlePasswordChange = async () => {
    setFieldError('')
    setValidationError(false)

    if (!oldPassword.trim()) {
      setFieldError('Please enter your current password.')
      return
    }

    const allValid = passwordRequirements.every(r => r.valid)
    if (!allValid) {
      setValidationError(true)
      return
    }

    setIsLoading(true)
    try {
      // backend only returns {message: ...} here, no new tokens —
      // so we can't stay "logged in" past this call, same as web
      await api.post('/api/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      })

      await logout() // clears SecureStore + calls /api/auth/mobile-logout/
      setSuccessModal(true)
    } catch (err: any) {
      // backend returns {old_password: '...'} specifically for a wrong
      // current password, not a generic {error: ...}
      if (err?.old_password) {
        setFieldError(err.old_password)
      } else {
        setErrorModal({ open: true, message: err?.error ?? 'Could not change your password. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessConfirm = () => {
    setSuccessModal(false)
    router.replace('/login')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>AGOS</Text>
      <Text style={styles.subtitle}>Change Your Password</Text>
      <Text style={styles.helper}>
        For your security, you must set a new password before continuing.
      </Text>

      {/* current password */}
      <View style={styles.field}>
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, fieldError ? styles.inputError : null]}
            value={oldPassword}
            onChangeText={t => { setOldPassword(t); setFieldError('') }}
            secureTextEntry={!showOldPassword}
            placeholder="••••••••"
            autoCapitalize="none"
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowOldPassword(v => !v)}>
            <Ionicons name={showOldPassword ? 'eye-off' : 'eye'} size={18} color="#122A48BA" />
          </Pressable>
        </View>
      </View>

      {/* new password */}
      <View style={styles.field}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, validationError ? styles.inputError : null]}
            value={newPassword}
            onChangeText={t => { setNewPassword(t); setValidationError(false) }}
            secureTextEntry={!showNewPassword}
            placeholder="••••••••"
            autoCapitalize="none"
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowNewPassword(v => !v)}>
            <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={18} color="#122A48BA" />
          </Pressable>
        </View>
      </View>

      {/* confirm new password */}
      <View style={styles.field}>
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, validationError ? styles.inputError : null]}
            value={confirmNewPassword}
            onChangeText={t => { setConfirmNewPassword(t); setValidationError(false) }}
            secureTextEntry={!showConfirmPassword}
            placeholder="••••••••"
            autoCapitalize="none"
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowConfirmPassword(v => !v)}>
            <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#122A48BA" />
          </Pressable>
        </View>
      </View>

      {/* requirements checklist */}
      <View style={styles.requirements}>
        {passwordRequirements.map(({ label, valid }) => (
          <View key={label} style={styles.reqRow}>
            <View style={[
              styles.reqDot,
              valid ? styles.reqDotValid : validationError ? styles.reqDotInvalid : styles.reqDotNeutral,
            ]}>
              {valid && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
            <Text style={[
              styles.reqLabel,
              valid ? styles.reqTextValid : validationError ? styles.reqTextInvalid : styles.reqTextNeutral,
            ]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePasswordChange}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Change Password</Text>
        )}
      </Pressable>

      {/* success modal */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={40} color="#1F9D55" />
            <Text style={styles.modalTitle}>Password Changed!</Text>
            <Text style={styles.modalDesc}>
              Your password has been updated successfully. Please log in again with your new password.
            </Text>
            <Pressable style={styles.modalBtn} onPress={handleSuccessConfirm}>
              <Text style={styles.modalBtnText}>Go to Login</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* error modal */}
      <Modal visible={errorModal.open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="close-circle" size={40} color="#D81010" />
            <Text style={styles.modalTitle}>Something Went Wrong</Text>
            <Text style={styles.modalDesc}>{errorModal.message}</Text>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: '#D81010' }]}
              onPress={() => setErrorModal({ open: false, message: '' })}
            >
              <Text style={styles.modalBtnText}>Okay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FAFCFD' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#122A48', textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#1565BC', textAlign: 'center', marginTop: 4 },
  helper: { fontSize: 12, color: '#122A48', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#122A48', marginBottom: 6, fontWeight: '500' },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#CDE3DEB0',
  },
  inputError: { borderColor: '#D81010' },
  eyeBtn: { position: 'absolute', right: 10, padding: 4 },
  requirements: { marginTop: 4, marginBottom: 8, gap: 6 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reqDotValid: { backgroundColor: '#1F9D55' },
  reqDotInvalid: { backgroundColor: '#F87171' },
  reqDotNeutral: { backgroundColor: '#D1D5DB' },
  reqLabel: { fontSize: 12 },
  reqTextValid: { color: '#1F9D55' },
  reqTextInvalid: { color: '#D81010' },
  reqTextNeutral: { color: '#9CA3AF' },
  error: { color: '#D81010', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  button: {
    backgroundColor: '#122A48',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#122A48', marginTop: 10 },
  modalDesc: { fontSize: 13, color: '#727272', textAlign: 'center', marginTop: 6, marginBottom: 18 },
  modalBtn: { backgroundColor: '#1F9D55', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  modalBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
})