"use client"

// react
import { useSearchParams, useRouter, } from "next/navigation"
import { useState, useEffect } from "react"

// constant
import { DIALOG_COLOR } from "@/lib/constant";

// components
import { DialogModal } from "@/components/DialogModal";
import { Toast } from "@/components/Toast";
import { SpinnerIcon } from "@/components/SpinnerIcon"

// hooks
import { useToast } from "@/components/hooks/useToast";

// icons
import { UserPlus, SquarePen, MapPin, UserRound, ClipboardCheck, UserCheck, Check, User } from "lucide-react";

// shadcn
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// api + auth
import { api } from "@/lib/api"
import { getAccessToken } from "@/lib/auth";

type DialogState = {
  open: boolean;
};

type Barangay = { 
  barangay_id: number; 
  barangay_name: string 
}

const MENRO_OFFICE = "MENRO Office"

const ROLE_DISPLAY: Record<string, string> = {
  'MENRO': 'MENRO Officer',
  'Barangay': 'Barangay Personnel',
  'Admin': 'Admin',
}

export default function Form() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')

  const isEdit = !!id

  // us
  const [fname, setFname] = useState<string>('')
  const [lname, setLname] = useState<string>('')
  const [position, setPosition] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [barangayId, setBarangayId] = useState<number | null>(null)
  const [username, setUsername] = useState<string>('')

  // form us
  const [formLoading, setFormLoading] = useState<boolean>(isEdit)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // dialog us
  const [cancelDialog, setCancelDialog] = useState<DialogState>({
    open: false,
  })
  const [confirmDialog, setConfirmDialog] = useState<DialogState>({
    open: false,
  })
  const [loadingDialog, setLoadingDialog] = useState<DialogState>({
    open: false,
  })

  // toast
  const {toasts, addToast, removeToast } = useToast()

  // get barangay
  useEffect(() => {
    const loadBarangays = async () => {
      try {
        const token = getAccessToken()
        const data = await api.get('/api/barangays/', token ?? undefined)
        setBarangays(data.results ?? data)
      } catch {
        addToast('Failed to load barangays.', 'error')
      }
    }
    loadBarangays()
  }, [])

  useEffect(() => {
    if (!isEdit) return

    const loadUser = async () => {
      try {
        const token = getAccessToken()
        const data = await api.get(`/api/users/${id}/`, token ?? undefined)
        setFname(data.first_name)
        setLname(data.last_name)
        setRole(data.user_role)
        setEmail(data.email)
        setStatus(data.status)
        setUsername(data.username)
        setPosition(data.position ?? '')
        setBarangayId(data.barangay_id ?? null)
      } catch {
        addToast('Failed to load user data.', 'error')
      } finally {
        setFormLoading(false)
      }
    }
    loadUser()
  }, [id])

  const selectedBarangay = barangays.find(b => b.barangay_id === barangayId)
  const officeDisplay = role === 'MENRO' ? MENRO_OFFICE : selectedBarangay?.barangay_name ?? 'Office/Barangay'

  // handlers
  const handleCancelDialog = () => {
    setCancelDialog({ open: true })
  }
  const handleCancelConfirm = () => {
    setCancelDialog({ open: false})
    router.push('/admin/users')
  }

  const handleConfirmationDialog = () => {
    const errors: Record<string, string> = {}
    if (!fname.trim())        errors.fname         = 'This field is required.'
    if (!lname.trim())        errors.lname         = 'This field is required.'
    if (!position.trim())     errors.position      = 'This field is required.'
    if (!role) errors.role = 'This field is required.'
    if (role !== 'MENRO' && !barangayId) errors.barangayId = 'This field is required.'
    if (!username.trim())     errors.username      = 'This field is required.'
    if (!email.trim())        errors.email         = 'This field is required.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setConfirmDialog({ open: true })
  }
  
  const handleSubmit = async () => {
    setConfirmDialog({ open: false })
    setLoadingDialog({ open: true })

    try {
      // await new Promise(resolve => setTimeout(resolve, 1500))
      const token = getAccessToken()
      const payload = {
        first_name: fname,
        last_name: lname,
        email,
        username,
        user_role: role,
        position,
        barangay_id: role === 'MENRO' ? null : barangayId,
      }

      if (isEdit) {
        await api.patch(`/api/users/${id}/`, payload, token ?? undefined)
      } else {
        await api.post('/api/users/', payload, token ?? undefined)
      }

      setLoadingDialog({ open: false })
      addToast(isEdit ? `${fname} ${lname}'s \naccount has been updated.` : `${fname} ${lname} \nhas been added.`, 'success')
      await new Promise(resolve => setTimeout(resolve, 3000))
      router.push('/admin/users')

    } catch (err: any) {
      setLoadingDialog({ open: false })
      
      if (err && typeof err === 'object') {
        const backendErrors: Record<string, string> = {}
        for (const key in err) {
          backendErrors[key] = Array.isArray(err[key]) ? err[key][0] : err[key]
        }
        setFieldErrors(backendErrors)
      }

      addToast(isEdit ? 'Failed to save changes. Please try again.' : 'Failed to create user. Please try again.', 'error')
    }
  }

  if (isEdit && formLoading) return (
    <div className="flex flex-col gap-3 justify-center items-center h-full">
      <SpinnerIcon size={32} color="#122A48" />
      <p>Loading...</p>
    </div>
  )

  return (
    <>

      <div className="hidden md:flex flex-col">
        
        {/* header */}
        <div className="flex justify-between w-full">
          {/* left side */}
          <div className="flex gap-3">
            <div className={`rounded-lg py-3 px-3 text-white ${isEdit ? 'bg-[#FF9705]' : 'bg-[#1565BC]'}`}>
              {isEdit ? <SquarePen size={24} /> : <UserPlus size={24} />}
            </div>

            <div className="flex flex-col text-[#122A48] justify-center">
              <p className="font-bold">{isEdit ? 'Edit User Account' : 'Add User Account'}</p>
              <p className="text-[13px]">
                {isEdit ? `Modifying account for ${fname} ${lname} | ${ROLE_DISPLAY[role] ?? role}` : '...'}
              </p>
            </div>
          </div>

          {/* right side */}
            <Button
              onClick={() => router.push('/admin/users')}
              className="rounded-lg bg-[#FAFCFD] hover:bg-[#bdcfd7] px-9 py-5 text-[#122A48] border border-[#C6C6C8] cursor-pointer"
            >
              Back
            </Button>
        </div>

        {/* bottom part */}
        <div className="flex gap-5 mt-5">
          {/* profile container */}
          <div className="flex flex-col justify-center bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg p-3 w-110 h-105 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
            <div className={`bg-[#2C7B3C] rounded-full w-25 h-25 mx-auto flex items-center justify-center text-white font-bold ${isEdit ? 'text-[43px]' : 'text-[40px] '}`}>
              {isEdit ? `${fname.charAt(0)}${lname.charAt(0)}` : '?'}
            </div>

            <p className="text-center text-[#122A48] mt-3 font-bold">{isEdit ? `${fname} ${lname}` : 'Full Name'}</p>
            <p className="text-center text-[#122A48] text-sm">
              {isEdit ? ROLE_DISPLAY[role] ?? role : '---'}
            </p>

            {/* status */}
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium justify-center mx-auto mt-1.5 ${
              (isEdit ? status : 'Active') === 'Active'
                ? 'bg-[#B2FBC173] text-[#2C7B3C]'
                : 'bg-[#FFE5E5] text-[#D81010]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                (isEdit ? status : 'Active') === 'Active' ? 'bg-[#1D8104]' : 'bg-[#BB2325]'
              }`}/>
              {isEdit ? status : 'Active'}
            </span>

            <div className="flex flex-col gap-1 mt-7 px-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#122A48] font-medium">Role</span>
                <span className="font-semibold text-[#122A48]">
                  {isEdit ? ROLE_DISPLAY[role] ?? role : '---'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#122A48] font-medium">Email</span>
                <span className="font-semibold text-[#122A48]">{isEdit ? email : '---'}</span>
              </div>
            </div>

            <hr className="mx-4 my-7" />

            <div className={`rounded-full flex gap-2 bg-[#1565BC29] text-[#1565BC] py-1.5 justify-center items-center ${isEdit ? 'mx-17' : 'mx-17'} `}>
              <MapPin size={21}/>
              <p className="text-center text-sm">{officeDisplay}</p>
            </div>
          </div>

          {/* form container */}
          <form className="flex flex-col gap-3 w-full">
            
            {/* personal information */}
            <div className="text-[#122A48] bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg p-2 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
              {/* header */}
              <div className="flex gap-3 p-4 w-238">
                <div className="rounded-lg p-3 text-[#1565BC] bg-[#CDE3DE]">
                  <UserRound size={25}/>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-bold">Personal Information</p>
                  <p className="text-[13px] text-[#727272]">Basic identity details of the user</p>
                </div>
              </div>

              <hr />

              {/* inputs for PI */}
              <div className="p-3">
                <div className="flex gap-5 w-full">
                  {/* fname */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">FIRST NAME <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Input
                        name="fname"
                        value={fname}
                        onChange={(e) => {
                          setFname(e.target.value)
                        }}
                        placeholder="e.g. Patricia"
                        className={`text-[#122A48] rounded-lg text-sm bg-white !font-normal h-10 bg-[#1565BC05] ${
                          fieldErrors.fname ? 'border-[#FF0000]' : 'border-[#727272]'
                        }`}
                      />
                      <FieldError className="text-xs">{fieldErrors.fname}</FieldError>
                  </Field>
                  
                  {/* lname */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">LAST NAME <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Input
                        name="lname"
                        value={lname}
                        onChange={(e) => {
                          setLname(e.target.value)
                        }}
                        placeholder="e.g. Quinto"
                        className={`text-[#122A48] rounded-lg text-sm bg-white !font-normal h-10 bg-[#1565BC05] ${
                          fieldErrors.lname ? 'border-[#FF0000]' : 'border-[#727272]'
                        }`}
                      />
                      <FieldError className="text-xs">{fieldErrors.lname}</FieldError>
                  </Field>
                </div>

                <div className="mt-3">
                  {/* position/designation */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">POSITION/DESIGNATION <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Input
                        name="position"
                        value={position}
                        maxLength={50}
                        onChange={(e) => {
                          setPosition(e.target.value)
                        }}
                        placeholder="e.g. Barangay Sanitary Inspector"
                        className={`text-[#122A48] rounded-lg text-sm bg-white !font-normal h-10 bg-[#1565BC05] ${
                          fieldErrors.position ? 'border-[#FF0000]' : 'border-[#727272]'
                        }`}
                      />
                      <div className="flex justify-between items-center">
                      <FieldError className="text-xs">{fieldErrors.position}</FieldError>
                      <span className={`text-xs ml-auto ${position.length >= 50 ? 'text-red-500' : 'text-gray-400'}`}>
                        {position.length}/50
                      </span>
                    </div>
                  </Field>
                </div>
              </div>

            </div>

            {/* role and assignment */}
            <div className="text-[#122A48] bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg p-2 mt-3 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
              {/* header */}
              <div className="flex gap-3 p-4 w-238">
                <div className="rounded-lg p-3 text-[#1565BC] bg-[#CDE3DE]">
                  <ClipboardCheck size={25}/>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-bold">Role & Assignment</p>
                  <p className="text-[13px] text-[#727272]">Access level and barangay coverage</p>
                </div>
              </div>

              <hr />

              {/* inputs for R&A */}
              <div className="p-3">
                <div className="flex gap-5 w-full">
                  {/* role */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">ROLE <span className="text-[#FF0000]">*</span></FieldLabel>
                        <Select
                          value={role}
                          onValueChange={(value) => {
                            setRole(value)
                            if (value === 'MENRO Officer') {
                              setBarangayId(null)
                            }
                            if (fieldErrors.role) setFieldErrors(prev => ({ ...prev, role: '' }))
                          }}
                        >
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-[20px] rounded-lg ${fieldErrors.role ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                          <SelectValue placeholder="Select Role..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem className="text-[#122A48] p-2" value="MENRO">MENRO Officer</SelectItem>
                          <SelectItem className="text-[#122A48] p-2" value="Barangay">Barangay Personnel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError className="text-xs">{fieldErrors.role}</FieldError>
                  </Field>
                  
                  {/* office/barangay */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">OFFICE/BARANGAY <span className="text-[#FF0000]">*</span></FieldLabel>
                        <Select
                          value={role === 'MENRO' ? MENRO_OFFICE : barangayId ? String(barangayId) : ''}
                          onValueChange={(value) => {
                            setBarangayId(Number(value))
                            if (fieldErrors.barangayId) setFieldErrors(prev => ({ ...prev, barangayId: '' }))
                          }}
                          disabled={role === 'MENRO'}
                        >
                          <SelectTrigger className={`!font-normal bg-[#1565BC05] py-[20px] rounded-lg ${fieldErrors.barangayId ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {barangays.map(b => (
                              <SelectItem key={b.barangay_id} value={String(b.barangay_id)}>
                                {b.barangay_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <FieldError className="text-xs">{fieldErrors.barangayId }</FieldError>
                  </Field>
                </div>
              </div>

            </div>

            {/* acct credentials */}
            <div className="text-[#122A48] bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg p-2 mt-3 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
              {/* header */}
              <div className="flex gap-3 p-4 w-238">
                <div className="rounded-lg p-3 text-[#1565BC] bg-[#CDE3DE]">
                  <UserCheck size={25}/>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-bold">Account Credentials</p>
                  <p className="text-[13px] text-[#727272]">Login username and email</p>
                </div>
              </div>

              <hr />

              {/* inputs for PI */}
              <div className="p-3">
                <div className="flex gap-5 w-full">
                  {/* username */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">USERNAME <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Input
                        name="username"
                        value={username}
                        maxLength={20}
                        onChange={(e) => {
                          setUsername(e.target.value)
                        }}
                        placeholder="e.g. patquinto"
                        className={`text-[#122A48] rounded-lg text-sm bg-white !font-normal h-10 bg-[#1565BC05] ${
                          fieldErrors.username ? 'border-[#FF0000]' : 'border-[#727272]'
                        }`}
                      />
                      <div className="flex justify-between items-center">
                      <FieldError className="text-xs">{fieldErrors.username}</FieldError>
                      <span className={`text-xs ml-auto ${username.length >= 20 ? 'text-[#FF0000]' : 'text-[#72727280]'}`}>
                        {username.length}/20
                      </span>
                    </div>
                  </Field>
                  
                  {/* email */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">EMAIL <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Input
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                        }}
                        placeholder="e.g. patpobeast@rosario.gov.ph"
                        className={`text-[#122A48] rounded-lg text-sm bg-white !font-normal h-10 bg-[#1565BC05] ${
                          fieldErrors.email ? 'border-[#FF0000]' : 'border-[#727272]'
                        }`}
                      />
                      <FieldError className="text-xs">{fieldErrors.email}</FieldError>
                  </Field>
                </div>
              </div>

            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                onClick={handleCancelDialog}
                className="cursor-pointer border border-[#C6C6C8] text-[#727272] rounded-lg bg-[#FAFCFD] hover:text-[#525050] hover:bg-[#adbac1] px-7 py-4.5">
                  Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmationDialog}
                className="cursor-pointer rounded-lg bg-[#1565BC] hover:bg-[#13569e] px-5 pl-4 py-4.5"> <Check/> {isEdit ? 'Save Changes' : 'Create User Account'}
              </Button>
            </div>

          </form>

        </div>

      </div>

      {/* --------------------------------------------------------------- */}

      {/* for mobile */}
      <div className="md:hidden">

        {/* profile container */}
        <div className="flex items-center gap-3 bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg p-3 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
          
          {/* avatar */}
          <div className={`bg-[#2C7B3C] rounded-full w-14 h-14 flex-shrink-0 flex items-center justify-center text-white font-bold ${isEdit ? 'text-[22px]' : 'text-[27px]'}`}>
            {isEdit ? `${fname.charAt(0)}${lname.charAt(0)}` : '?'}
          </div>

          {/* info */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            
            {/* row 1 - full name */}
            <p className="text-[#122A48] font-semibold text-sm truncate">
              {isEdit ? `${fname} ${lname}` : 'Full Name'}
            </p>

            {/* row 2 - role and email */}
            <div className="flex gap-3">
              <p className="text-xs text-[#122A48] truncate">
                <span className="font-medium">Role:</span> {isEdit ? ROLE_DISPLAY[role] ?? role : '---'}
              </p>
              <p className="text-xs text-[#122A48] truncate"><span className="font-medium">Email:</span> {isEdit ? email : '---'}</p>
            </div>

            {/* row 3 - status and office/barangay */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                (isEdit ? status : 'Active') === 'Active'
                  ? 'bg-[#B2FBC173] text-[#2C7B3C]'
                  : 'bg-[#FFE5E5] text-[#D81010]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (isEdit ? status : 'Active') === 'Active' ? 'bg-[#1D8104]' : 'bg-[#BB2325]'
                }`}/>
                {isEdit ? status : 'Active'}
              </span>

              <div className="flex items-center gap-1 rounded-full bg-[#1565BC29] text-[#1565BC] px-2.5 py-0.5 text-[10px] min-w-0">
                <MapPin size={11} className="flex-shrink-0" />
                <p className="truncate">{selectedBarangay?.barangay_name ?? 'Office/Barangay'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* form */}
        <form action="">

          {/* personal information */}
          <div className="mt-3 text-[#122A48] bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* header */}
            <div className="flex gap-3 p-3">
              <div className="rounded-lg p-2 text-[#1565BC] bg-[#CDE3DE]">
                <UserRound size={21}/>
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-sm">Personal Information</p>
                <p className="text-[11px] text-[#727272] ">Basic identity details of the user</p>
              </div>
            </div>

            <hr />

            {/* inputs for PI */}
            <div className="p-3">
              <div className="flex gap-5 w-full">
                {/* fname */}
                <Field className="flex gap-1.5 flex-col w-[400px]">
                  <FieldLabel className="text-[#122A48] text-xs">FIRST NAME <span className="text-[#FF0000]">*</span></FieldLabel>
                    <Input
                      name="fname"
                      value={fname}
                      onChange={(e) => {
                        setFname(e.target.value)
                      }}
                      placeholder="e.g. Patricia"
                      className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h-9 bg-[#1565BC05] ${
                        fieldErrors.fname ? 'border-[#FF0000]' : 'border-[#727272]'
                      }`}
                    />
                    <FieldError className="text-xs">{fieldErrors.fname}</FieldError>
                </Field>
                
                {/* lname */}
                <Field className="flex gap-1.5 flex-col w-[400px]">
                  <FieldLabel className="text-[#122A48] text-xs">LAST NAME <span className="text-[#FF0000]">*</span></FieldLabel>
                    <Input
                      name="lname"
                      value={lname}
                      onChange={(e) => {
                        setLname(e.target.value)
                      }}
                      placeholder="e.g. Quinto"
                      className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h-9 bg-[#1565BC05] ${
                        fieldErrors.lname ? 'border-[#FF0000]' : 'border-[#727272]'
                      }`}
                    />
                    <FieldError className="text-xs">{fieldErrors.lname}</FieldError>
                </Field>
              </div>

              <div className="mt-3">
                {/* position/designation */}
                <Field className="flex gap-1.5 flex-col">
                  <FieldLabel className="text-[#122A48] text-xs">POSITION/DESIGNATION <span className="text-[#FF0000]">*</span></FieldLabel>
                    <Input
                      name="position"
                      value={position}
                      maxLength={50}
                      onChange={(e) => {
                        setPosition(e.target.value)
                      }}
                      placeholder="e.g. Barangay Sanitary Inspector"
                      className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h-9 bg-[#1565BC05] ${
                        fieldErrors.position ? 'border-[#FF0000]' : 'border-[#727272]'
                      }`}
                    />
                    <div className="flex justify-between items-center">
                    <FieldError className="text-xs">{fieldErrors.position}</FieldError>
                    <span className={`text-xs ml-auto ${position.length >= 50 ? 'text-red-500' : 'text-gray-400'}`}>
                      {position.length}/50
                    </span>
                  </div>
                </Field>
              </div>
            </div>

          </div>

          {/* role and assignment */}
          <div className="text-[#122A48] bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg mt-3 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* header */}
            <div className="flex gap-3 p-3 w-238">
              <div className="rounded-lg p-2 text-[#1565BC] bg-[#CDE3DE]">
                <ClipboardCheck size={21}/>
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-sm">Role & Assignment</p>
                <p className="text-[11px] text-[#727272]">Access level and barangay coverage</p>
              </div>
            </div>

            <hr />

            {/* inputs for R&A */}
            <div className="p-3">
              <div className="flex flex-col gap-5 w-full">
                {/* role */}
                <Field className="flex gap-1.5 flex-col">
                  <FieldLabel className="text-[#122A48] text-xs">ROLE <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Select
                        value={role}
                        onValueChange={(value) => {
                          setRole(value)
                          if (value === 'MENRO Officer') {
                            setBarangayId(null)
                          }
                          if (fieldErrors.role) setFieldErrors(prev => ({ ...prev, role: '' }))
                        }}
                      >
                      <SelectTrigger className={`text-xs !font-normal bg-[#1565BC05] py-[17px] rounded-lg ${fieldErrors.role ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                        <SelectValue placeholder="Select Role..." />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom">
                        <SelectItem className="text-[#122A48] p-2 text-xs" value="MENRO">MENRO Officer</SelectItem>
                        <SelectItem className="text-[#122A48] p-2 text-xs" value="Barangay">Barangay Personnel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError className="text-xs">{fieldErrors.role}</FieldError>
                </Field>
                
                {/* office/barangay */}
                <Field className="flex gap-1.5 flex-col">
                  <FieldLabel className="text-[#122A48] text-xs">OFFICE/BARANGAY <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Select
                        value={role === 'MENRO' ? MENRO_OFFICE : barangayId ? String(barangayId) : ''}
                        onValueChange={(value) => {
                          setBarangayId(Number(value))
                          if (fieldErrors.barangayId) setFieldErrors(prev => ({ ...prev, barangayId: '' }))
                        }}
                        disabled={role === 'MENRO'}
                      >
                      <SelectTrigger className={`text-xs !font-normal bg-[#1565BC05] py-[17px] rounded-lg ${fieldErrors.officeBarangay ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom">
                        {barangays.map(b => (
                          <SelectItem key={b.barangay_id} value={String(b.barangay_id)}>
                            {b.barangay_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError className="text-xs">{fieldErrors.barangayId }</FieldError>
                </Field>
              </div>
            </div>

          </div>

          {/* acct credentials */}
          <div className="text-[#122A48] bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg mt-3 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* header */}
            <div className="flex gap-3 p-3 w-238">
              <div className="rounded-lg p-2 text-[#1565BC] bg-[#CDE3DE]">
                <UserCheck size={21}/>
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-xs">Account Credentials</p>
                <p className="text-[11px] text-[#727272]">Login username and email</p>
              </div>
            </div>

            <hr />

            {/* inputs for PI */}
            <div className="p-3">
              <div className="flex flex-col gap-3 w-full">
                {/* username */}
                <Field className="flex gap-1.5 flex-col">
                  <FieldLabel className="text-[#122A48] text-xs">USERNAME <span className="text-[#FF0000]">*</span></FieldLabel>
                    <Input
                      name="username"
                      value={username}
                      maxLength={20}
                      onChange={(e) => {
                        setUsername(e.target.value)
                      }}
                      placeholder="e.g. patquinto"
                      className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h-9 bg-[#1565BC05] ${
                        fieldErrors.username ? 'border-[#FF0000]' : 'border-[#727272]'
                      }`}
                    />
                    <div className="flex justify-between items-center">
                    <FieldError className="text-xs">{fieldErrors.username}</FieldError>
                    <span className={`text-xs ml-auto ${username.length >= 20 ? 'text-[#FF0000]' : 'text-[#72727280]'}`}>
                      {username.length}/20
                    </span>
                  </div>
                </Field>
                
                {/* email */}
                <Field className="flex gap-1.5 flex-col">
                  <FieldLabel className="text-[#122A48] text-xs">EMAIL <span className="text-[#FF0000]">*</span></FieldLabel>
                    <Input
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                      }}
                      placeholder="e.g. patpobeast@rosario.gov.ph"
                      className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h-9 bg-[#1565BC05] ${
                        fieldErrors.email ? 'border-[#FF0000]' : 'border-[#727272]'
                      }`}
                    />
                    <FieldError className="text-xs">{fieldErrors.email}</FieldError>
                </Field>
              </div>
            </div>

          </div>

          {/* button */}
          <div className="flex gap-3 justify-end mt-3">
            <Button
              type="button"
              onClick={handleCancelDialog}
              className="cursor-pointer border border-[#C6C6C8] text-[#727272] rounded-lg bg-[#FAFCFD] hover:text-[#525050] hover:bg-[#adbac1] px-7 py-4.5">
                Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmationDialog}
              className="cursor-pointer rounded-lg bg-[#1565BC] hover:bg-[#13569e] px-5 pl-4 py-4.5"> <Check/> {isEdit ? 'Save Changes' : 'Create User Account'}
            </Button>
          </div>
        </form>


        



      </div>

      {/* Dialog */}

      {/* Cancel dialog */}
      <DialogModal
        open={cancelDialog.open}
        onClose={() => setCancelDialog({open: false})}
        onConfirm={handleCancelConfirm}
        color={isEdit ? DIALOG_COLOR.lightyellow : DIALOG_COLOR.lightred}
        icon={isEdit ? SquarePen : UserPlus}
        iconColor={isEdit ? DIALOG_COLOR.yellow : DIALOG_COLOR.red}
        title={isEdit? "Cancel Changes" : "Cancel Adding User"}
        description={isEdit ? "You have unsaved changes that will be lost if you cancel." : "Are you sure you want to cancel? This user account has not been created yet."}
        cancelLabel="Keep Editing"
        confirmLabel='Yes, Cancel'
      />

      {/* Confirmation Dialog */}
      <DialogModal
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({open: false})}
        onConfirm={handleSubmit}
        color={DIALOG_COLOR.lightgreen}
        icon={isEdit ? SquarePen : UserPlus}
        iconColor={DIALOG_COLOR.green}
        title={isEdit? "Confirm Changes" : "Confirm Adding User"}
        description={isEdit ?
          <>
            Are you sure you want to change <strong>{fname} {lname}</strong> information?
          </>
          :
          <>
            Are you sure you want to add this new user?
          </>
        }
        cancelLabel="Keep Editing"
        confirmLabel={isEdit ? 'Confirm Changes' : 'Add User'}
      />

      {/* Loading Dialog */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title={isEdit? "Saving Changes" : "Saving User Account"}
        description={isEdit ? 
          <>
            Processing account detail changes for <strong>{fname} {lname}</strong>. Please wait.
          </>
          : 
          <>
            Proccessing account details. Please wait.
          </>
        }
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}
