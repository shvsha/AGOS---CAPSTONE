"use client"

// react
import { useSearchParams, useRouter, } from "next/navigation"
import { useState, useEffect } from "react"

// icons
import { UserPlus, SquarePen, MapPin, UserRound, ClipboardCheck, UserCheck } from "lucide-react";

// shadcn
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Form() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')

  const isEdit = !!id

  // us
  const [fname, setFname] = useState<string>('')
  const [lname, setLname] = useState<string>('')

  const [position, setPosition] = useState<string>('')

  const [role, setRole] = useState<string>('MENRO Officer')
  const [email, setEmail] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  // extract later on the office/barangay of the user from the database (office if MENRO the role, barangay if barangay personnel role)
  const [officeBarangay, setOfficeBarangay] = useState<string>('MENRO Office')

  // pati toh from database later on
  const [username, setUsername] = useState<string>('')

  // form us
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEdit) return

    // change with api later on
    const mockUsers = [
      { user_id: 1, fname: 'Juan', lname: 'Dela Cruz', role: 'Admin', status: 'Active', email: 'juan@example.com' },
    ]
    const user = mockUsers.find(u => u.user_id === Number(id))
    if (user) {
      setFname(user.fname)
      setLname(user.lname)
      setRole(user.role)
      setEmail(user.email)
      setStatus(user.status)
    }
  }, [id])

  // handlers
  const validateField = (name: string, value: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [name]: value.trim() === '' ? 'This field is required.' : ''
    }))
  }

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
              <p className="text-[13px]">{isEdit ? `Modifying account for ${fname} ${lname} | ${role}` : 'Create a new system account for AGOS'}</p>
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
            <p className="text-center text-[#122A48] text-sm">{isEdit ? `${role}` : '---'}</p>

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
                <span className="font-semibold text-[#122A48]">{isEdit ? role : '---'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#122A48] font-medium">Email</span>
                <span className="font-semibold text-[#122A48]">{isEdit ? email : '---'}</span>
              </div>
            </div>

            <hr className="mx-4 my-7" />

            <div className={`rounded-full flex gap-2 bg-[#1565BC29] text-[#1565BC] py-1.5 justify-center items-center ${isEdit ? 'mx-20' : 'mx-15'} `}>
              <MapPin size={21}/>
              <p className="text-center text-sm">{isEdit ? `${officeBarangay}` : 'Office/Barangay'}</p>
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
                          validateField('fname', e.target.value)
                        }}
                        onBlur={(e) => validateField('fname', e.target.value)}
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
                          validateField('lname', e.target.value)
                        }}
                        onBlur={(e) => validateField('lname', e.target.value)}
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
                        onChange={(e) => {
                          setPosition(e.target.value)
                          validateField('position', e.target.value)
                        }}
                        onBlur={(e) => validateField('position', e.target.value)}
                        placeholder="e.g. Barangay Sanitary Inspector"
                        className={`text-[#122A48] rounded-lg text-sm bg-white !font-normal h-10 bg-[#1565BC05] ${
                          fieldErrors.position ? 'border-[#FF0000]' : 'border-[#727272]'
                        }`}
                      />
                      <FieldError className="text-xs">{fieldErrors.lnapositionme}</FieldError>
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
                            validateField('role', value)
                          }}
                        >
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-[20px] rounded-lg ${fieldErrors.dept ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem className="text-[#122A48] p-2" value="MENRO Officer">MENRO Officer</SelectItem>
                          <SelectItem className="text-[#122A48] p-2" value="Barangay">Barangay Personnel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError className="text-xs">{fieldErrors.role}</FieldError>
                  </Field>
                  
                  {/* office/barangay */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">OFFICE/BARANGAY <span className="text-[#FF0000]">*</span></FieldLabel>
                        <Select
                          value={officeBarangay}
                          onValueChange={(value) => {
                            setOfficeBarangay(value)
                            validateField('role', value)
                          }}
                        >
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-[20px] rounded-lg ${fieldErrors.dept ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem className="text-[#122A48] p-2" value="MENRO Office">MENRO Office</SelectItem>
                          <SelectItem className="text-[#122A48] p-2" value="Barangay 1">Barangay 1</SelectItem>
                          <SelectItem className="text-[#122A48] p-2" value="Barangay 2">Barangay 2</SelectItem>
                          <SelectItem className="text-[#122A48] p-2" value="Barangay 3">Barangay 3</SelectItem>
                          <SelectItem className="text-[#122A48] p-2" value="Barangay 4">Barangay 4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError className="text-xs">{fieldErrors.role}</FieldError>
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
                        onChange={(e) => {
                          setUsername(e.target.value)
                          validateField('fname', e.target.value)
                        }}
                        onBlur={(e) => validateField('username', e.target.value)}
                        placeholder="e.g. patquinto"
                        className={`text-[#122A48] rounded-lg text-sm bg-white !font-normal h-10 bg-[#1565BC05] ${
                          fieldErrors.username ? 'border-[#FF0000]' : 'border-[#727272]'
                        }`}
                      />
                      <FieldError className="text-xs">{fieldErrors.username}</FieldError>
                  </Field>
                  
                  {/* email */}
                  <Field className="flex gap-1.5 flex-col w-[400px]">
                    <FieldLabel className="text-[#122A48] text-sm">EMAIL <span className="text-[#FF0000]">*</span></FieldLabel>
                      <Input
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          validateField('email', e.target.value)
                        }}
                        onBlur={(e) => validateField('email', e.target.value)}
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
              <Button className="cursor-pointer border border-[#C6C6C8] text-[#727272] rounded-lg bg-[#FAFCFD] hover:text-[#525050] hover:bg-[#adbac1] px-7 py-4.5">Cancel</Button>
              <Button className="cursor-pointer rounded-lg bg-[#1565BC] hover:bg-[#13569e] px-5 py-4.5">✅ {isEdit ? 'Save Changes' : 'Create User Account'}</Button>
            </div>

          </form>

        </div>

      </div>
    </>
  )
}
