"use client"

// icons
import { FaSearch, FaBars, FaUserTimes } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"
import { FaUsers } from "react-icons/fa";
import { BadgeCheck, CircleOff, ShieldCheck, UserRound } from "lucide-react";

// react
import { useState, useEffect } from "react"

// shadcn
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

type User = {
  user_id: number
  fname: string
  lname: string
  email: string
  role: string
  status: string
}

function getFilteredUsers(users: User[], role: string, status: string, search: string) {
  return users
    .filter(u => u.role === role)
    .filter(u => u.status === status)
    .filter(u => `${u.fname} ${u.lname}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.user_id - a.user_id)
}

export default function Users() {
  // us
  const [search, setSearch] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('Admin')
  const [userStatus, setUserStatus] = useState<string>('Active')
  const [view, setView] = useState<string>('list')

  // table states
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    // TODO: replace with api.get('/api/users/')
    setTimeout(() => {
      // setUsers([
      //   { user_id: 1, fname: 'Juan',  lname: 'Dela Cruz', email: 'juan@example.com',  role: 'Admin',    status: 'Active'   },
      //   { user_id: 2, fname: 'Maria', lname: 'Santos',    email: 'maria@example.com', role: 'MENRO',    status: 'Active'   },
      //   { user_id: 3, fname: 'Pedro', lname: 'Reyes',     email: 'pedro@example.com', role: 'Admin',    status: 'Inactive' },
      //   { user_id: 4, fname: 'Ana',   lname: 'Cruz',      email: 'ana@example.com',   role: 'Barangay', status: 'Active'   },
      // ])
      setLoading(false)
    }, 1200)
  }, [])

  const filteredUsers = getFilteredUsers(users, userRole, userStatus, search)

  // for the cards
  const total    = users.length
  const active   = users.filter(u => u.status === 'Active').length
  const inactive = users.filter(u => u.status === 'Inactive').length
  const admins   = users.filter(u => u.role === 'Admin').length

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* title and filter container */}
        <div className="flex justify-between w-full mb-6">
          <div className="font-bold text-[#122A48] flex justify-center items-center text-lg">
            <p>System Users</p>
          </div>

          <div className="flex gap-3">

            {/* search filter */}
            <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 py-1 gap-2">
              <FaSearch size={18} className="shrink-0" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Users..."
                className="bg-transparent border-0 rounded-lg placeholder:text-black/50 focus-visible:ring-0 h-8 w-[200px]"
              />
            </div>

            {/* user role filter */}
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger className="w-27 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className='w-27 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="Admin">Admin</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="MENRO">MENRO</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Barangay">Barangay</SelectItem>
              </SelectContent>
            </Select>

            {/* user status filter */}
            <Select value={userStatus} onValueChange={setUserStatus}>
              <SelectTrigger className="w-27 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className='w-27 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="Active">Active</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* add user */}
            <Button
              onClick={() => setView('add')}
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Add User
            </Button>

          </div>

        </div>

        {/* header total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {/* total reports */}
          <div className="rounded-lg border-2 border-[#C6C6C8] h-22 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#CDE3DE] rounded-lg p-2">
              <FaUsers size={20} color={"#1565BC"} />
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#122A48] leading-tight">6</span>
              <p className="text-sm text-[#122A48]">Total Users</p>
            </div>
          </div>

          {/* total active */}
          <div className="rounded-lg border-2 border-[#C6C6C8] h-22 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#B2FBC1] rounded-lg p-2">
              <BadgeCheck size={20} color={"#2C7B3C"} />
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#122A48] leading-tight">6</span>
              <p className="text-sm text-[#122A48]">Active</p>
            </div>
          </div>

          {/* total inactive */}
          <div className="rounded-lg border-2 border-[#C6C6C8] h-22 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#FFE5E5] rounded-lg p-2">
              <CircleOff size={20} color={"#FF0101"} />
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#122A48] leading-tight">6</span>
              <p className="text-sm text-[#122A48]">Inactive</p>
            </div>
          </div>

          {/* total ??? */}
          <div className="rounded-lg border-2 border-[#C6C6C8] h-22 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#DACDE3] rounded-lg p-2">
              <ShieldCheck size={20} color={"#582579"} />
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#122A48] leading-tight">6</span>
              <p className="text-sm text-[#122A48]">???</p>
            </div>
          </div>
        </div>
        
        {/* table */}
        <div className="bg-[#FAFCFD] rounded-lg border-2 border-[#C6C6C8] mt-5 pt-5 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
          <p className="text-[#122A48] font-bold mx-3 mb-2">User Accounts</p>

          <div className="h-89">
            <Table>
              <TableHeader className="bg-[#e8eef1b4] border-[#727272]">
                <TableRow>
                  <TableHead className="text-[#727272] ">ID</TableHead>
                  <TableHead className="text-[#727272] ">User</TableHead>
                  <TableHead className="text-[#727272] ">Role</TableHead>
                  <TableHead className="text-[#727272] ">Status</TableHead>
                  <TableHead className="text-[#727272] ">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-[#122A48]">
                        <div className="w-8 h-8 border-4 border-[#727272] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Loading Users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-3">
                          <UserRound size={20} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No users found</p>
                        <p className="text-[#727272] text-sm">
                          No {userStatus.toLowerCase()} {userRole} accounts found.
                        </p>
                        <Button
                          onClick={() => setView('add')}
                          className="bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                        >
                          + Add User
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.user_id}>
                        <TableCell className="text-[#727272]">{user.user_id}</TableCell>
                        <TableCell className="text-[#727272] font-medium">{user.fname} {user.lname}</TableCell>
                        <TableCell className="text-[#727272]">{user.email}</TableCell>
                        <TableCell className="text-[#727272]">{user.role}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'Active'
                              ? 'bg-green-100 text-[#1D8104]'
                              : 'bg-red-100 text-[#BB2325]'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#727272]">
                          {/* add your edit/deactivate buttons here */}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  
              </TableBody>
            </Table>
          </div>
        </div>

      </div>
    </>
  )
}

