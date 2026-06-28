"use client"

// shadcn
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// icons
import { User, Lock, Eye, EyeOff, LockKeyhole, KeyRound, BadgeCheck } from "lucide-react"
import { MdOutlineMarkEmailUnread } from "react-icons/md"

// react
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

// lib
import { api } from "@/lib/api"
import { setTokens, setUser } from "@/lib/auth"
import { formatCooldown, getErrorMessage } from "@/lib/utils"

const RESEND_COOLDOWNS = [0, 60, 180, 3600]
const RESEND_LIMIT = RESEND_COOLDOWNS.length

interface ErrorDialogState {
  open: boolean
  message: string
}

export default function Login() {
  const router = useRouter()

  // login states
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false)
  const [loginError, setLoginError] = useState<string>("")
  const [fieldError, setFieldError] = useState<string>("")

  // modal states
  const [changePasswordOpen, setChangePasswordOpen] = useState<boolean>(false)
  const [checkEmailOpen, setCheckEmailOpen] = useState<boolean>(false)
  const [newPasswordOpen, setNewPasswordOpen] = useState<boolean>(false)
  const [successChangePasswordOpen, setSuccessChangePasswordOpen] = useState<boolean>(false)

  // forgot password states
  const [resetEmail, setResetEmail] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false)
  const [resetPasswordError, setResetPasswordError] = useState<string>("")

  // otp states
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [resendError, setResendError] = useState<string>("")
  const [codeError, setCodeError] = useState<string>("")
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // resend otp states
  const [resendCount, setResendCount] = useState<number>(0)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)
  const [cooldownInterval, setCooldownInterval] = useState<ReturnType<typeof setInterval> | null>(null)

  // new password states
  const [newPassword, setNewPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<boolean>(false)
  const [isLoadingReset, setIsLoadingReset] = useState<boolean>(false)
  const [resendSuccess, setResendSuccess] = useState<boolean>(false)
  const [isLoadingResend, setIsLoadingResend] = useState<boolean>(false)

  // error dialog state
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({ open: false, message: "" })
  const showError = (message: string) => setErrorDialog({ open: true, message })

  // check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const user = localStorage.getItem("user")
    if (token && user) {
      const parsed = JSON.parse(user)
      if (parsed.must_change_password) {
        router.replace("/change-password")
        return
      }
      if (parsed.user_role === "Admin") router.replace("/admin/dashboard")
      else if (parsed.user_role === "MENRO") router.replace("/menro/map")
      else if (parsed.user_role === "Barangay") router.replace("/barangay/map")
    }
  }, [])

  // handlers
  const handleCredentials = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "email") setEmail(value)
    if (name === "password") setPassword(value)
  }

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoginError("")
    setFieldError("")

    if (email === "" || password === "") {
      setFieldError("Please fill in all fields.")
      return
    }

    setIsLoadingLogin(true)
    try {
      const data = await api.post("/api/auth/login/", { email, password })
      setTokens(data.access)
      setUser(data.user)

      if (data.user.must_change_password) {
        router.replace("/change-password")
        return
      }

      const userRole = data.user.user_role
      if (userRole === "Admin") router.replace("/admin/dashboard")
      else if (userRole === "MENRO") router.replace("/menro/map")
      else if (userRole === "Barangay") router.replace("/barangay/map")
      else setLoginError("Unknown user role.")
    } catch (err) {
      setLoginError(getErrorMessage(err))
    } finally {
      setIsLoadingLogin(false)
    }
  }

  // submit email for forgot password
  const handleCheckEmailOpen = async () => {
    setEmailError("")
    setIsLoadingEmail(true)
    try {
      await api.post("/api/auth/forgot-password/", { email: resetEmail })
      setChangePasswordOpen(false)
      setCheckEmailOpen(true)
      setOtp(Array(6).fill(""))
      setCodeError("")
      setResendCount(0)
      setCooldownSeconds(0)
      if (cooldownInterval) clearInterval(cooldownInterval)
    } catch (err: unknown) {
      const error = err as Record<string, unknown>
      setEmailError(error.email as string || "Something went wrong.")
    } finally {
      setIsLoadingEmail(false)
    }
  }

  // otp handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setCodeError("")
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").slice(0, 6)
    if (!/^\d+$/.test(paste)) return
    const newOtp = paste.split("")
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")])
    inputRefs.current[Math.min(paste.length, 5)]?.focus()
  }

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds)
    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    setCooldownInterval(interval)
  }

  const handleCloseOtpDialog = () => {
    if (cooldownInterval) clearInterval(cooldownInterval)
    setCooldownSeconds(0)
    setCheckEmailOpen(false)
  }

  // verify otp
  const handleNewPasswordOpen = async () => {
    setCodeError("")
    setIsLoadingCode(true)
    const code = otp.join("")
    try {
      await api.post("/api/auth/verify-code/", { email: resetEmail, code })
      setCheckEmailOpen(false)
      setNewPasswordOpen(true)
      setValidationError(false)
    } catch (err: unknown) {
      const error = err as Record<string, unknown>
      setCodeError(error.code as string || "That code is incorrect. Please try again.")
    } finally {
      setIsLoadingCode(false)
    }
  }

  // reset password
  const handleSuccessChangePasswordOpen = async () => {
    const allValid =
      newPassword.length >= 8 &&
      /[^a-zA-Z0-9]/.test(newPassword) &&
      newPassword === confirmPassword &&
      confirmPassword !== ""

    if (!allValid) { setValidationError(true); return }

    setIsLoadingReset(true)
    try {
      await api.post("/api/auth/reset-password/", { email: resetEmail, password: newPassword })

      setValidationError(false)
      setNewPasswordOpen(false)
      setSuccessChangePasswordOpen(true)
      setNewPassword("")
      setConfirmPassword("")
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setOtp(Array(6).fill(""))
      setResetEmail("")
    } catch {
      showError("Something went wrong. Please try again.")
    } finally {
      setIsLoadingReset(false)
    }
  }

  // resend otp
  const handleResendCode = async () => {
    if (cooldownSeconds > 0 || resendCount >= RESEND_LIMIT) return
    setIsLoadingResend(true)
    try {
      await api.post("/api/auth/forgot-password/", { email: resetEmail })
      setOtp(Array(6).fill(""))
      setCodeError("")
      setResendSuccess(true)
      setResendError("")
      setTimeout(() => setResendSuccess(false), 3000)
      inputRefs.current[0]?.focus()

      const nextCount = resendCount + 1
      setResendCount(nextCount)
      if (RESEND_COOLDOWNS[nextCount] > 0) startCooldown(RESEND_COOLDOWNS[nextCount])
    } catch {
      setResendError("Failed to resend code. Please try again.")
    } finally {
      setIsLoadingResend(false)
    }
  }

  return (
    <>
      <div className="w-screen h-screen flex items-center justify-center">

        {/* login form */}
        <Card className="w-full max-w-[80vw] sm:max-w-100 p-4 py-6 sm:p-10 sm:py-12 bg-[#FFFAFA] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
          <CardHeader className="items-center justify-center">
            <img className='w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-1 bg-[#CDE3DE] rounded-full' />
            <CardTitle className='text-black text-xs sm:text-sm text-center'>AGOS</CardTitle>
            <CardTitle className='text-[#1565BC] font-bold text-sm sm:text-lg text-center'>Automated Geospatial Canal Obstruction Sensing System</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <FieldGroup>
              <Field className='gap-0.5'>
                <FieldLabel className='text-[#122A48] text-xs sm:text-sm' htmlFor='username'>Email</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#122A48BA]" />
                  <Input
                    name="email"
                    id="email"
                    type="text"
                    value={email}
                    onChange={e => { handleCredentials(e); setFieldError(""); setLoginError("") }}
                    className={`border focus:ring-0 bg-[#CDE3DEB0] h-7.5 sm:h-8.5 pl-10 text-xs sm:text-base ${fieldError || loginError ? "border-red-500" : "border-none"}`}
                  />
                </div>
              </Field>

              <Field className='gap-0.5 -mt-2'>
                <FieldLabel className='text-[#122A48] text-xs sm:text-sm' htmlFor='password'>Password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#122A48BA]" />
                  <Input
                    name="password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="off"
                    onChange={e => { handleCredentials(e); setFieldError(""); setLoginError("") }}
                    className={`border focus:ring-0 bg-[#CDE3DEB0] h-7.5 sm:h-8.5 pl-10 text-xs sm:text-base pr-10 ${fieldError || loginError ? "border-red-500" : "border-none"}`}
                  />

                  <button suppressHydrationWarning type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#122A48BA] cursor-pointer">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                </div>
              </Field>

              {fieldError && <p className="text-red-500 text-xs -mt-3 flex items-center gap-1"><span>⊙</span>{fieldError}</p>}
              {loginError && <p className="text-red-500 text-xs -mt-3 flex items-center gap-1"><span>⊙</span>{loginError}</p>}
            </FieldGroup>
          </CardContent>
          <CardFooter className='justify-center py-0 pb-2 flex-col bg-transparent border-none'>
            <Button
              className='w-full bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4 sm:py-4.5 mb-2.5 cursor-pointer font-semibold text-[13px] sm:text-[16px]'
              onClick={handleLogin}
              disabled={isLoadingLogin}
            >
              {isLoadingLogin ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </div>
              ) : "Login"}
            </Button>
            <a 
              onClick={() => { setChangePasswordOpen(true); setEmailError(""); setResetEmail("") }} 
              className='text-[#1565BC] text-[11px] sm:text-[14px] underline mb-3 mt-2 cursor-pointer'
            >
              Forgot Password?
            </a>
            <hr className="border-t border-[#1565BC] w-full py-2 sm:py-4 mt-2" />
          </CardFooter>
        </Card>
      </div>

      {/* forgot password / email */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="[&>button]:hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] py-6 !max-w-[80vw] sm:!max-w-[370px] px-1 sm:px-4">
          <div className="flex justify-center py-4 px-4 sm:py-6 sm:px-6 rounded-full bg-[#CDE3DE] mx-auto w-fit mt-2">
            <LockKeyhole className="w-8 h-8 sm:w-12 sm:h-12" color={"#122A48"} />
          </div>
          <DialogHeader>
            <div className="text-center -mb-1.5">
              <p className="text-[#122A48] font-semibold text-[17px] sm:text-[23px] mb-3 -mt-1">Forgot Password?</p>
              <p className="text-[#122A48] px-5 text-[12px] sm:text-[14px] -mt-2">Enter your email address and a code will be sent to help reset your password.</p>
            </div>
            <DialogDescription className="flex flex-col gap-5">
              <Field className='px-6'>
                <FieldLabel className='text-[#122A48] -mb-1 mt-3' htmlFor="input-field-email">Email</FieldLabel>
                <Input
                  className={`bg-[#CDE3DEB0] rounded-md h-7.5 sm:h-8.5 text-xs sm:text-base !font-normal text-[#122A48] py-4.5 ${emailError ? "border-red-500" : "border-[#ccc]"}`}
                  id="input-field-email"
                  type="email"
                  placeholder="e.g. abcd*****@email.com"
                  value={resetEmail}
                  onChange={e => { setResetEmail(e.target.value); setEmailError("") }}
                />
                {emailError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⊙</span>{emailError}</p>}
              </Field>
              <Button
                className='!rounded-md mx-6 bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4.5 mb-5 -mt-2 cursor-pointer font-semibold text-xs sm:text-sm'
                onClick={handleCheckEmailOpen}
                disabled={isLoadingEmail}
              >
                {isLoadingEmail ? "Sending..." : "Reset Password"}
              </Button>
              <div className="flex items-center gap-3 px-10 -mt-5 -mb-1">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
              <div className='flex justify-center'>
                <a onClick={() => setChangePasswordOpen(false)} className='text-[#122A48] text-xs sm:text-sm no-underline decoration-transparent cursor-pointer'>&lt; Back to Login</a>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* check email / otp */}
      <Dialog open={checkEmailOpen} onOpenChange={handleCloseOtpDialog}>
        <DialogContent className="[&>button]:hidden py-7 px-0 !max-w-[80vw] sm:!max-w-[410px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
          <div className="flex justify-center py-4 px-4 sm:py-6 sm:px-6 rounded-full bg-[#CDE3DE] mx-auto w-fit mt-3">
            <MdOutlineMarkEmailUnread className="w-8 h-8 sm:w-12 sm:h-12" color={"#122A48"} />
          </div>
          <DialogHeader>
            <div className="text-center">
              <p className="text-[#122A48] font-semibold text-[17px] sm:text-[23px]">Check your Email</p>
              <p className="text-[#122A48] px-5 mt-1 mb-3 text-[12px] sm:text-[14px]">Input the code that was sent to <span className="font-semibold">{resetEmail}</span>.</p>
            </div>
            <DialogDescription className="flex flex-col gap-5">
              <div className='flex justify-center gap-2 sm:gap-3 px-4 sm:px-10'>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-9 h-9 sm:w-11 sm:h-11 text-center text-lg font-bold rounded-lg border-2 outline-none focus:ring-2 focus:ring-[#122A48] text-[#122A48] ${codeError ? "bg-white border-red-500" : "bg-[#CDE3DEB0] border-transparent"}`}
                  />
                ))}
              </div>

              {codeError && (
                <p className="text-red-500 text-[11px] sm:text-xs text-center -mt-3 -mb-2 flex items-center justify-center gap-1">
                  <span>⊙</span>{codeError}
                </p>
              )}

              <Button
                className='!rounded-md mx-10 bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4 sm:py-4.5 cursor-pointer font-semibold text-xs sm:text-sm'
                onClick={handleNewPasswordOpen}
                disabled={isLoadingCode}
              >
                {isLoadingCode ? "Verifying..." : "Next"}
              </Button>

              <div className='text-center -mt-1'>
                {resendCount >= RESEND_LIMIT ? (
                  <p className='text-red-500 text-[11px] sm:text-xs font-medium text-center'>Too many attempts. Please try again later.</p>
                ) : cooldownSeconds > 0 ? (
                  <p className='text-gray-400 text-[11px] sm:text-xs text-center'>Resend available in <span className='text-[#122A48] font-semibold'>{formatCooldown(cooldownSeconds)}</span></p>
                ) : resendSuccess ? (
                  <p className='text-green-600 text-[11px] sm:text-xs font-medium text-center'>A new code has been sent to your email.</p>
                ) : isLoadingResend ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-[#122A48] border-t-transparent rounded-full animate-spin" />
                    <p className='text-[#122A48] text-[11px] sm:text-xs'>Sending new code...</p>
                  </div>
                ) : (
                  <div className='flex flex-col items-center gap-1'>
                    {resendError && <p className='text-red-500 flex items-center justify-center gap-1'><span>⊙</span>{resendError}</p>}
                    <p className='text-black text-[11px] sm:text-xs text-center -mt-1'>
                      Didn't get any code?{" "}
                      <a onClick={handleResendCode} className='text-[#122A48] text-[11px] sm:text-xs cursor-pointer underline'>Click to resend</a>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-10 -mt-3">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
              <div className='flex justify-center'>
                <a onClick={handleCloseOtpDialog} className='text-[#122A48] text-xs sm:text-sm -mt-1 no-underline decoration-transparent cursor-pointer'>&lt; Back to Login</a>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* set new password */}
      <Dialog open={newPasswordOpen} onOpenChange={setNewPasswordOpen}>
        <DialogContent className="[&>button]:hidden py-5 px-0 !max-w-[80vw] sm:!max-w-[410px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
          {isLoadingReset ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-10 gap-3 sm:gap-5">
              <div className='bg-[#CDE3DE] py-5 px-5 sm:py-7 sm:px-7 rounded-2xl flex justify-center mb-1 sm:mb-3'>
                <div className="w-10 h-10 sm:w-13 sm:h-13 border-4 border-[#122A48] border-t-transparent rounded-full animate-spin" />
              </div>
              <div className='text-center'>
                <p className='text-[#122A48] font-bold text-base sm:text-xl'>Updating Password</p>
                <p className='text-[11px] sm:text-xs mx-5 mt-2 sm:mt-4 text-gray-500'>Please wait while we securely update your password.</p>
              </div>
              <div className="flex gap-2 mt-3 sm:mt-6">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#122A48] rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#122A48] rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#122A48] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center py-4 px-4 sm:py-6 sm:px-6 rounded-full bg-[#CDE3DE] mx-auto w-fit mt-3">
                <KeyRound className="w-8 h-8 sm:w-12 sm:h-12" color={"#122A48"} />
              </div>
              <DialogHeader>
                <div className='text-center'>
                  <p className='text-[#122A48] font-semibold text-[17px] sm:text-[23px] mb-1'>Set a new password</p>
                  <p className='text-[#122A48] px-5 text-[12px] sm:text-[14px]'>Your new password must be different from previously used passwords.</p>
                </div>
                <DialogDescription className='flex flex-col gap-5'>
                  <Field className='px-10 -mb-3'>
                    <FieldLabel className='text-[#122A48] text-xs sm:text-sm -mb-1 mt-3' htmlFor="new-password">New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        className="bg-[#CDE3DEB0] rounded-md border-[#ccc] h-7 sm:h-8.5 text-xs sm:text-base !font-normal text-[#122A48] py-4.5 pr-10"
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="*****"
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setResetPasswordError("") }}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#122A48] cursor-pointer">
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field className='px-10'>
                    <FieldLabel className='text-[#122A48] text-xs sm:text-sm -mb-1' htmlFor="confirm-password">Confirm New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        className="bg-[#CDE3DEB0] rounded-md border-[#ccc] h-7 sm:h-8.5 text-xs sm:text-base !font-normal text-[#122A48] py-4.5 pr-10"
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="*****"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#122A48] cursor-pointer">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className='flex flex-col gap-1 mt-2'>
                      {validationError && <p className='text-red-500 text-[11px] sm:text-xs mb-1 -mt-2'>Please satisfy all requirements before proceeding.</p>}
                      {[
                        { label: "Must be at least 8 characters", valid: newPassword.length >= 8 },
                        { label: "Must contain one special character", valid: /[^a-zA-Z0-9]/.test(newPassword) },
                        { label: "Passwords must match", valid: newPassword === confirmPassword && confirmPassword !== "" },
                      ].map(({ label, valid }) => (
                        <div key={label} className={`flex items-center gap-2 text-[11px] sm:text-xs ${valid ? "text-green-500" : validationError ? "text-red-500" : "text-gray-400"}`}>
                          <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center flex-shrink-0 ${valid ? "bg-green-500" : validationError ? "bg-red-400" : "bg-gray-300"}`}>
                            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          {label}
                        </div>
                      ))}
                    </div>
                  </Field>

                  <Button
                    className='!rounded-md mx-10 bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4.5 text-[11px] sm:text-[14px] cursor-pointer font-semibold'
                    onClick={handleSuccessChangePasswordOpen}
                    disabled={isLoadingReset}
                  >
                    Reset Password
                  </Button>

                  <div className="flex items-center gap-3 px-10">
                    <div className="flex-1 h-px bg-gray-300" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                  <div className='flex justify-center pb-3'>
                    <a onClick={() => setNewPasswordOpen(false)} className='text-[#122A48] text-xs sm:text-sm -mt-1 cursor-pointer'>&lt; Back to Login</a>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* success */}
      <Dialog open={successChangePasswordOpen} onOpenChange={setSuccessChangePasswordOpen}>
        <DialogContent className="[&>button]:hidden py-6 sm:py-7 px-0 !max-w-[80vw] sm:!max-w-[410px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
          <div className="flex justify-center py-4 px-4 sm:py-4.5 sm:px-6 rounded-full bg-[#CDE3DE] mx-auto w-fit mt-3">
            <BadgeCheck className="w-8 h-8 sm:w-13 sm:h-13" color={"#122A48"} />
          </div>
          <DialogHeader>
            <div className='text-center'>
              <p className='text-[#122A48] font-semibold text-[17px] sm:text-[23px] mb-1 sm:mb-2'>Password Reset!</p>
              <p className='text-[#122A48] px-5 mb-3 sm:mb-5 text-[12px] sm:text-[14px]'>You've successfully created a new password, click below to login.</p>
            </div>
            <DialogDescription className='flex flex-col gap-5'>
              <Button
                className='!rounded-md mx-6 sm:mx-10 bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4 sm:py-4.5 mb-3 sm:mb-5 cursor-pointer font-semibold text-xs sm:text-sm'
                onClick={() => setSuccessChangePasswordOpen(false)}
              >
                Login
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* error dialog */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="[&>button]:hidden py-6 sm:py-7 px-0 !max-w-[80vw] sm:!max-w-[410px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
          <div className='bg-[#FFE1E1] py-3 sm:py-4 px-3 sm:px-4 rounded-full flex justify-center mx-auto w-fit mb-1 sm:mb-2'>
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <DialogHeader>
            <div className='text-center px-5 sm:px-8'>
              <p className='text-red-500 font-bold text-base sm:text-lg mb-1 sm:mb-2'>Error!</p>
              <p className='text-[11px] sm:text-xs text-gray-500'>{errorDialog.message}</p>
            </div>
            <DialogDescription className='flex flex-col px-6 sm:px-10 mt-3 sm:mt-4'>
              <Button
                className='!rounded-md bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4 sm:py-4.5 cursor-pointer font-semibold text-xs sm:text-sm'
                onClick={() => setErrorDialog({ open: false, message: "" })}
              >
                Okay
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}