// react
import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, } from 'react-native'
import { useRouter } from 'expo-router'

// icons
import { Ionicons } from '@expo/vector-icons'

// lib
import { api } from '../lib/api'

type Step = 'email' | 'otp' | 'reset' | 'success'

const RESEND_COOLDOWNS = [0, 60, 180, 3600]
const RESEND_LIMIT = RESEND_COOLDOWNS.length


export default function ForgotPassword() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')

  // email step
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoadingEmail, setIsLoadingEmail] = useState(false)

  // otp step 
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [codeError, setCodeError] = useState('')
  const [isLoadingCode, setIsLoadingCode] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [resendError, setResendError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isLoadingResend, setIsLoadingResend] = useState(false)
  const otpRefs = useRef<(TextInput | null)[]>([])
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // reset step
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState(false)
  const [isLoadingReset, setIsLoadingReset] = useState(false)
  const [resetError, setResetError] = useState('')

  const handleSendEmail = async () => {
    setEmailError('')

    if (!email.trim()) {
      setEmailError('Please enter your email.')
      return
    }

    setIsLoadingEmail(true)
    try {
      await api.post('/api/auth/forgot-password/', { email: email.trim() })
      setStep('otp')
    } catch (err: any) {
      setEmailError(err?.email ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoadingEmail(false)
    }
  }

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
    }
  }, [])

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds)
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setCodeError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyCode = async () => {
  setCodeError('')
  const code = otp.join('')

  if (code.length < 6) {
    setCodeError('Please enter the full 6-digit code.')
    return
  }

  setIsLoadingCode(true)
  try {
    await api.post('/api/auth/verify-code/', { email: email.trim(), code })
    setStep('reset')
  } catch (err: any) {
    setCodeError(err?.code ?? 'That code is incorrect. Please try again.')
  } finally {
    setIsLoadingCode(false)
  }
}

  const handleResendCode = async () => {
    if (cooldownSeconds > 0 || resendCount >= RESEND_LIMIT || isLoadingResend) return

    setIsLoadingResend(true)
    setResendError('')
    try {
      await api.post('/api/auth/forgot-password/', { email: email.trim() })
      setOtp(Array(6).fill(''))
      setCodeError('')
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 3000)
      otpRefs.current[0]?.focus()

      const nextCount = resendCount + 1
      setResendCount(nextCount)
      if (RESEND_COOLDOWNS[nextCount] > 0) startCooldown(RESEND_COOLDOWNS[nextCount])
    } catch {
      setResendError('Failed to resend code. Please try again.')
    } finally {
      setIsLoadingResend(false)
    }
  }

  const passwordRequirements = [
    { label: 'Must be at least 8 characters', valid: newPassword.length >= 8 },
    { label: 'Must contain one special character', valid: /[^a-zA-Z0-9]/.test(newPassword) },
    { label: 'Passwords must match', valid: newPassword === confirmPassword && confirmPassword !== '' },
  ]

  const handleResetPassword = async () => {
    setResetError('')
    const allValid = passwordRequirements.every(r => r.valid)

    if (!allValid) {
      setValidationError(true)
      return
    }

    setIsLoadingReset(true)
    try {
      await api.post('/api/auth/reset-password/', {
        email: email.trim(),
        password: newPassword,
      })
      setStep('success')
    } catch (err: any) {
      setResetError(err?.error ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoadingReset(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#FAFCFD]"
    >
      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[360px] bg-[#FFFAFA] rounded-2xl p-6 items-center shadow-lg">
          <Pressable
            className="self-start mb-2"
            onPress={() => (step === 'email' ? router.back() : setStep('email'))}
          >
            <Ionicons name="chevron-back" size={20} color="#122A48" />
          </Pressable>

          <View className="w-16 h-16 rounded-full bg-[#CDE3DE] items-center justify-center mb-2">
            <Ionicons name="lock-closed-outline" size={26} color="#122A48" />
          </View>

          {step === 'email' && (
            <>
              <Text className="text-[17px] font-bold text-[#122A48] text-center">
                Forgot Password?
              </Text>
              <Text className="text-[12px] text-[#122A48] text-center mt-1 mb-5 px-2">
                Enter your email address and a code will be sent to help reset your password.
              </Text>

              <View className="w-full mb-4">
                <Text className="text-[13px] text-[#122A48] mb-1.5 font-medium">Email</Text>
                <TextInput
                  className={`bg-[#CDE3DEB0] rounded-lg px-3 py-2.5 text-[15px] text-[#122A48] border ${
                    emailError ? 'border-[#D81010]' : 'border-transparent'
                  }`}
                  value={email}
                  onChangeText={t => { setEmail(t); setEmailError('') }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="e.g. abcd*****@email.com"
                  placeholderTextColor="#122A4870"
                />
                {emailError ? (
                  <Text className="text-[#D81010] text-xs mt-1">{emailError}</Text>
                ) : null}
              </View>

              <Pressable
                className={`w-full bg-[#122A48] rounded-lg py-3.5 items-center ${
                  isLoadingEmail ? 'opacity-70' : ''
                }`}
                onPress={handleSendEmail}
                disabled={isLoadingEmail}
              >
                {isLoadingEmail ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white text-[15px] font-semibold">Sending...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-[15px] font-semibold">Reset Password</Text>
                )}
              </Pressable>
            </>
          )}

          {/* otp step */}
          {step === 'otp' && (
            <>
              <Text className="text-[17px] font-bold text-[#122A48] text-center">
                Check your Email
              </Text>
              <Text className="text-[12px] text-[#122A48] text-center mt-1 mb-5 px-2">
                Input the code that was sent to <Text className="font-semibold">{email}</Text>.
              </Text>

              <View className="flex-row justify-center gap-2 mb-4">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={el => { otpRefs.current[index] = el }}
                    className={`w-10 h-11 text-center text-lg font-bold rounded-lg border-2 text-[#122A48] ${
                      codeError ? 'bg-white border-[#D81010]' : 'bg-[#CDE3DEB0] border-transparent'
                    }`}
                    value={digit}
                    onChangeText={t => handleOtpChange(index, t)}
                    onKeyPress={e => handleOtpKeyPress(index, e.nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>

              {codeError ? (
                <Text className="text-[#D81010] text-xs text-center mb-3">{codeError}</Text>
              ) : null}

              <Pressable
                className={`w-full bg-[#122A48] rounded-lg py-3.5 items-center ${
                  isLoadingCode ? 'opacity-70' : ''
                }`}
                onPress={handleVerifyCode}
                disabled={isLoadingCode}
              >
                {isLoadingCode ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-[15px] font-semibold">Next</Text>
                )}
              </Pressable>

              <View className="mt-4 items-center">
                {resendCount >= RESEND_LIMIT ? (
                  <Text className="text-[#D81010] text-xs font-medium text-center">
                    Too many attempts. Please try again later.
                  </Text>
                ) : cooldownSeconds > 0 ? (
                  <Text className="text-gray-400 text-xs text-center">
                    Resend available in{' '}
                    <Text className="text-[#122A48] font-semibold">
                      {formatCooldown(cooldownSeconds)}
                    </Text>
                  </Text>
                ) : resendSuccess ? (
                  <Text className="text-green-600 text-xs font-medium text-center">
                    A new code has been sent to your email.
                  </Text>
                ) : isLoadingResend ? (
                  <View className="flex-row items-center gap-1.5">
                    <ActivityIndicator size="small" color="#122A48" />
                    <Text className="text-[#122A48] text-xs">Sending new code...</Text>
                  </View>
                ) : (
                  <View className="items-center gap-1">
                    {resendError ? (
                      <Text className="text-[#D81010] text-xs">{resendError}</Text>
                    ) : null}
                    <Text className="text-black text-xs text-center">
                      Didn&apos;t get any code?{' '}
                      <Text className="text-[#122A48] underline" onPress={handleResendCode}>
                        Click to resend
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          
          {/* reset step */}
          {step === 'reset' && (
            <>
              <Text className="text-[17px] font-bold text-[#122A48] text-center">
                Set a new password
              </Text>
              <Text className="text-[12px] text-[#122A48] text-center mt-1 mb-5 px-2">
                Your new password must be different from previously used passwords.
              </Text>

              <View className="w-full mb-3">
                <Text className="text-[13px] text-[#122A48] mb-1.5 font-medium">New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    className="bg-[#CDE3DEB0] rounded-lg px-3 py-2.5 pr-10 text-[15px] text-[#122A48] border border-transparent"
                    value={newPassword}
                    onChangeText={t => { setNewPassword(t); setValidationError(false) }}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    placeholder="••••••••"
                  />
                  <Pressable
                    className="absolute right-3"
                    onPress={() => setShowNewPassword(v => !v)}
                  >
                    <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={18} color="#122A48BA" />
                  </Pressable>
                </View>
              </View>

              <View className="w-full mb-3">
                <Text className="text-[13px] text-[#122A48] mb-1.5 font-medium">Confirm New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    className="bg-[#CDE3DEB0] rounded-lg px-3 py-2.5 pr-10 text-[15px] text-[#122A48] border border-transparent"
                    value={confirmPassword}
                    onChangeText={t => { setConfirmPassword(t); setValidationError(false) }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    placeholder="••••••••"
                  />
                  <Pressable
                    className="absolute right-3"
                    onPress={() => setShowConfirmPassword(v => !v)}
                  >
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#122A48BA" />
                  </Pressable>
                </View>
              </View>

              <View className="w-full gap-1.5 mb-4">
                {validationError && (
                  <Text className="text-[#D81010] text-xs mb-1">
                    Please satisfy all requirements before proceeding.
                  </Text>
                )}
                {passwordRequirements.map(({ label, valid }) => (
                  <View key={label} className="flex-row items-center gap-2">
                    <View
                      className={`w-4 h-4 rounded-full items-center justify-center ${
                        valid ? 'bg-green-500' : validationError ? 'bg-red-400' : 'bg-gray-300'
                      }`}
                    >
                      {valid && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    <Text
                      className={`text-xs ${
                        valid ? 'text-green-500' : validationError ? 'text-[#D81010]' : 'text-gray-400'
                      }`}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {resetError ? (
                <Text className="text-[#D81010] text-xs text-center mb-2">{resetError}</Text>
              ) : null}

              <Pressable
                className={`w-full bg-[#122A48] rounded-lg py-3.5 items-center ${
                  isLoadingReset ? 'opacity-70' : ''
                }`}
                onPress={handleResetPassword}
                disabled={isLoadingReset}
              >
                {isLoadingReset ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-[15px] font-semibold">Reset Password</Text>
                )}
              </Pressable>
            </>
          )}

          {step === 'success' && (
            <>
              <Ionicons name="checkmark-circle" size={40} color="#1F9D55" />
              <Text className="text-[17px] font-bold text-[#122A48] text-center mt-2">
                Password Reset!
              </Text>
              <Text className="text-[12px] text-[#122A48] text-center mt-1 mb-5 px-2">
                You&apos;ve successfully created a new password. Click below to log in.
              </Text>
              <Pressable
                className="w-full bg-[#122A48] rounded-lg py-3.5 items-center"
                onPress={() => router.replace('/login')}
              >
                <Text className="text-white text-[15px] font-semibold">Login</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}