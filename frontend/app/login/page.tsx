"use client" 

// shadcn
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// icons
import { User, Lock, Eye, EyeOff, LockKeyhole, KeyRound, BadgeCheck } from "lucide-react"

// react
import { useState, useRef } from "react"

export default function Login() {
  // united states

  // login
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [fieldError, setFieldError] = useState<string>("");

  // modal states
  const [changePasswordOpen, setChangePasswordOpen] = useState<boolean>(false);
  const [checkEmailOpen, setCheckEmailOpen] = useState<boolean>(false);
  const [newPasswordOpen, setNewPasswordOpen] = useState<boolean>(false);
  const [successChangePasswordOpen, setSuccessChangePasswordOpen] = useState<boolean>(false);

  // forgot password states
  const [resetEmail, setResetEmail] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false);
  const [resetPasswordError, setResetPasswordError] = useState<string>('')

  // otp states
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [resendError, setResendError] = useState<string>('')
  const [codeError, setCodeError] = useState<string>('')
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // resend otp states
  const [resendCount, setResendCount] = useState<number>(0)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)
  const [cooldownInterval, setCooldownInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // new password states
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<boolean>(false)
  const [isLoadingReset, setIsLoadingReset] = useState<boolean>(false)
  const [resendSuccess, setResendSuccess] = useState<boolean>(false)
  const [isLoadingResend, setIsLoadingResend] = useState<boolean>(false)

  // error states
  interface ErrorDialogState {
    open: boolean;
    message: string;
  }
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({
    open: false,
    message: '',
  });
  const showError = (message: string) => {
    setErrorDialog({ open: true, message });
  };

  // handlers (fucntions)

  // store credentials
  const handleCredentials = (e) => {
    const { name, value } = e.target
    if (name === "username") setUsername(value)
    if (name === "password") setPassword(value)
  }

  // handle login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setFieldError('')

    if (username === "" || password === "") {
      setFieldError('Please fill in all fields.')
      return
    }

    setIsLoadingLogin(true)
    // try {
    //   const response = await api.post('/api/auth/login/', { username, password })
    //   sessionStorage.setItem('access_token', response.data.access)
    //   sessionStorage.setItem('refresh_token', response.data.refresh)
    //   sessionStorage.setItem('user', JSON.stringify(response.data.user))
    //   const userLevel = response.data.user.user_level
    //   if (userLevel === "Admin") {
    //     navigate("/admin/dashboard", { replace: true })
    //   } else if (userLevel === "Warehouse Supervisor") {
    //     navigate("/whse/management", { replace: true })
    //   } else if (userLevel === "Signatory") {
    //     navigate("/signa/evaluation", { replace: true })
    //   } else {
    //     setLoginError('Unknown user level.')
    //   }
      
    //   await api.post('/audit/log-login/')
    // } catch (err) {
    //   // const error = err.response?.data
    //   if (error) {
    //     const msg = Object.values(error)[0]
    //     setLoginError(Array.isArray(msg) ? msg[0] : msg)
    //   } else {
    //     setLoginError('Login faild. Please try again.')
    //   }
    // } finally {
    //   setIsLoadingLogin(false)
    // }
  }
      


  return(
    <div className="w-screen h-screen flex items-center justify-center">
      <Card className="w-full max-w-100 p-10 py-18 bg-[#FFFAFA] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
        <CardHeader className="items-center justify-center">
          <img src="" alt="AGOS Logo" className='w-25 h-25 mx-auto mb-2 -mt-3 bg-[#CDE3DE] rounded-full' />
          <CardTitle className='text-black text-sm text-center'>AGOS</CardTitle>
          <CardTitle className='text-[#1565BC] font-bold text-lg text-center'>Automated Geo-Based <br/>Obstruction Sensing System</CardTitle>
        </CardHeader>
        <CardContent className='text-center'>
          <FieldGroup>
            <Field className='gap-0.5'>
              <FieldLabel className='text-[#122A48]' htmlFor='username'>Username</FieldLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4  text-[#122A48BA]" />
                <Input
                  name="username"
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => { handleCredentials(e); setFieldError(''); setLoginError('') }}
                  className={`border focus:ring-0 bg-[#CDE3DEB0] h-8.5 pl-10 ${
                    fieldError || loginError ? 'border-red-500' : 'border-none'
                  }`}
                />
              </div>
            </Field>

            <Field className='gap-0.5 -mt-2'>
              <FieldLabel className='text-[#122A48]' htmlFor='password'>Password</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4  text-[#122A48BA]" />
                <Input
                  name="password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="off"
                  onChange={e => { handleCredentials(e); setFieldError(''); setLoginError('') }}
                  className={`border focus:ring-0 bg-[#CDE3DEB0] h-8.5 pl-10 pr-10 ${
                    fieldError || loginError ? 'border-red-500' : 'border-none'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#122A48BA] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            
            {/* inline error mssges */}
            {fieldError && (
              <p className="text-red-500 text-xs -mt-3 flex items-center gap-1">
                <span>⊙</span> {fieldError}
              </p>
            )}
            {loginError && (
              <p className="text-red-500 text-xs -mt-3 flex items-center gap-1">
                <span>⊙</span> {loginError}
              </p>
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className='justify-center py-0 pb-4 flex-col bg-transparent border-none'>
          <Button
            className='w-full bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4.5 mb-2.5 cursor-pointer font-semibold'
            onClick={handleLogin}
            disabled={isLoadingLogin}
          >
            {isLoadingLogin ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </div>
            ) : 'Login'}
          </Button>
          <a onClick={() => { setChangePasswordOpen(true); setEmailError(''); setResetEmail('') }} className='text-[#1565BC] text-[13px] underline mb-6 cursor-pointer'>Forgot Password?</a>

          <hr className="border-t border-[#1565BC] w-full py-6" />
        </CardFooter>
      </Card>
    </div>
  )
}