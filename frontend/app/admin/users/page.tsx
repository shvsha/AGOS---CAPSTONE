"use client"

// icons
import { FaSearch } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"
import { FaUsers } from "react-icons/fa";
import { BadgeCheck, CircleOff, ShieldCheck, UserRound, SquarePen, UserMinus, UserPlus, User, SlidersHorizontal, X, MoreHorizontal  } from "lucide-react";

// react
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// toast
import { useToast } from "@/components/hooks/useToast";
import { Toast } from "@/components/Toast";

// component
import { SpinnerIcon } from "@/components/SpinnerIcon"
import { DialogModal } from "@/components/DialogModal";

// constant
import { DIALOG_COLOR } from "@/lib/constant";

// shadcn
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

// type for states
type User = {
  user_id: number;
  fname: string;
  lname: string;
  email: string;
  role: string;
  status: string;
}

type DialogState = {
  open: boolean;
  user: User | null;
};

const getAvatarColor = (role: string) => {
  if (role === "MENRO Officer") return "#2C7B3C"
  if (role === "Barangay Personnel") return "#1565BC"
  return "#122A48"
}

function getFilteredUsers(users: User[], role: string, status: string, search: string) {
  return users
    .filter(u => role === "All" || u.role === role)
    .filter(u => status === "All" || u.status === status)
    .filter(u => `${u.fname} ${u.lname}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.user_id - a.user_id)
}

export default function Users() {
  const router = useRouter()

  // us
  const [search, setSearch] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('All')
  const [userStatus, setUserStatus] = useState<string>('Active')

  // mobile us
  const [tempRole, setTempRole] = useState<string>(userRole)
  const [tempStatus, setTempStatus] = useState<string>(userStatus)
  const [filterOpen, setFilterOpen] = useState<boolean>(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  // toast
  const {toasts, addToast, removeToast } = useToast()

  // table states
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // reactivate and deactivate dialogs
  const [reactivateDialog, setReactivateDialog] = useState<DialogState>({
    open: false,
    user: null,
  })
  const [deactivateDialog, setDeactivateDialog] = useState<DialogState>({
    open: false,
    user: null,
  })

  useEffect(() => {
    setLoading(true)
    // TODO: replace with api.get('/api/users/')
    setTimeout(() => {
      setUsers([
        { user_id: 1, fname: 'Juan',  lname: 'Dela Cruz', email: 'juan@example.com',  role: 'MENRO Officer',    status: 'Active'   },
        { user_id: 2, fname: 'Maria', lname: 'Santos',    email: 'maria@example.com', role: 'MENRO Officer',    status: 'Active'   },
        { user_id: 3, fname: 'Pedro', lname: 'Reyes',     email: 'pedro@example.com', role: 'Barangay Personnel',    status: 'Inactive' },
        { user_id: 4, fname: 'Ana',   lname: 'Cruz',      email: 'ana@example.com',   role: 'Barangay Personnel', status: 'Active'   },
      ])
      setLoading(false)
    }, 1200)
  }, [])

  const filteredUsers = getFilteredUsers(users, userRole, userStatus, search)

  // for the cards
  const total    = users.length
  const active   = users.filter(u => u.status === 'Active').length
  const inactive = users.filter(u => u.status === 'Inactive').length
  const admins   = users.filter(u => u.role === 'Admin').length

  // handlers (reactivate and deactivate)
  const handleReactivate = () => {
    setReactivateDialog({open: false, user: null})
    addToast(`${reactivateDialog.user?.fname} has been activated.`)
  }
  const handlerDeactivate = () => {
    setDeactivateDialog({open: false, user: null})
    addToast(`${deactivateDialog.user?.fname} has been deactivated.`)
  }

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* title and filter container */}
        <div className="flex justify-between w-full mb-4">
          <div className="font-bold text-[#122A48] flex justify-center items-center text-lg">
            <p>System Users</p>
          </div>

          <div className="flex gap-3">

            {/* search filter */}
            <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-11">
              <FaSearch size={18} className="text-[#C6C6C8]" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Users..."
                className="bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-[200px]"
              />
            </div>

            {/* user role filter */}
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger className="w-27 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-27 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All">All Users</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="MENRO">MENRO</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Barangay">Barangay</SelectItem>
              </SelectContent>
            </Select>

            {/* user status filter */}
            <Select value={userStatus} onValueChange={setUserStatus}>
              <SelectTrigger className="w-27 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-27 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="Active">Active</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* add user */}
            <Button
              onClick={() => router.push('/admin/users/form')}
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Add User
            </Button>

          </div>

        </div>

        {/* header total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {/* total users */}
          <div className="rounded-lg border-2 border-[#C6C6C8] h-20 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
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
          <div className="rounded-lg border-2 border-[#C6C6C8] h-20 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
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
          <div className="rounded-lg border-2 border-[#C6C6C8] h-20 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
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
          <div className="rounded-lg border-2 border-[#C6C6C8] h-20 w-85 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
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
        <div className="bg-[#FAFCFD] rounded-lg border-2 border-[#C6C6C8] mt-5 pt-4 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
          <p className="text-[#122A48] font-bold mx-3 mb-2">User Accounts</p>

          <div className="h-95">
            <Table>
              <TableHeader className="bg-[#e8eef1b4] border-[#727272]">
                <TableRow>
                  <TableHead className="text-[#727272] text-center font-semibold">ID</TableHead>
                  <TableHead className="text-[#727272] text-center font-semibold">User</TableHead>
                  <TableHead className="text-[#727272] text-center font-semibold">Role</TableHead>
                  <TableHead className="text-[#727272] text-center font-semibold">Status</TableHead>
                  <TableHead className="text-[#727272] text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                
                {/* loading state */}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-31">
                      <div className="flex flex-col items-center gap-3 text-[#122A48]">
                        <SpinnerIcon size={32} color="#122A48" />
                        <span className="text-sm font-medium">Loading Users...</span>
                      </div>
                    </TableCell>
                  </TableRow>

                  // no user state
                  ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-15">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <UserRound size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No users found</p>
                        <p className="text-[#727272] text-sm">
                          No user have been added yet. <br/> Click the button below to start adding users.
                        </p>
                        <Button
                          onClick={() => router.push('/admin/users/form')}
                          className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                        >
                          + Add User
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  // with user state
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.user_id} className="border-b border-[#C6C6C8]">
                        <TableCell className="text-[#122A48] text-center h-18">{user.user_id}</TableCell>

                        <TableCell className="text-[#122A48] text-center font-medium h-18">
                          <div className="flex gap-3 justify-center">
                            <div
                              className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                              style={{ backgroundColor: getAvatarColor(user.role) }}
                            >
                              {user.fname.charAt(0)}{user.lname.charAt(0)}
                            </div>
                            <div className="flex flex-col text-left">
                              <p className="font-semibold">{user.fname} {user.lname}</p>
                              <p className="underline text-[13px]">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-[#122A48] text-center h-18">{user.role}</TableCell>
                        
                        <TableCell className="text-center h-18">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${
                            user.status === 'Active'
                              ? 'bg-[#B2FBC173] text-[#2C7B3C]'
                              : 'bg-[#FFE5E5] text-[#D81010]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'Active' ? 'bg-[#1D8104]' : 'bg-[#BB2325]'
                            }`}/>
                            {user.status}
                          </span>
                        </TableCell>

                        <TableCell className="text-[#122A48] flex gap-3 justify-center items-center h-18">
                          <Button 
                            onClick={() => router.push(`/admin/users/form?id=${user.user_id}`)}
                            className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] py-4.5 px-3"
                          >
                            <SquarePen size={16} />
                            Edit
                          </Button>

                          {user.status === 'Active' ? (
                            <Button 
                              onClick={() => setDeactivateDialog({ open: true, user: user})}
                              className="flex gap-2 text-[#D81010] rounded-lg bg-[#FFE5E5] hover:bg-red-200 cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                            >
                              <UserMinus size={16} />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setReactivateDialog({ open: true, user: user })}
                              className="flex gap-2 text-[#2C7B3C] rounded-lg bg-[#CDE3DE] hover:bg-green-200 cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                            >
                              <UserPlus size={16} />
                              Activate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  
              </TableBody>
            </Table>
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------------------------------------- */}

      {/* for mobile */}
      <div className="md:hidden text-[#122A48]">

        {/* filters */}
        <div className="flex justify-between items-center">
          <p className="font-bold">System users</p>
          <Button
            onClick={() => router.push('/admin/users/form')}
            className="p-5 py-5 rounded-lg cursor-pointer bg-[#1565BC] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
          >
            <FaPlus color="white" /> Add User
          </Button>
        </div>

        <div className="flex gap-2 justify-between mt-3">
          <div className="flex items-center bg-[#FAFCFD] border-1 border-[#C6C6C8] rounded-lg px-3 gap-2 h-8">
            <FaSearch size={13} className="text-[#C6C6C8]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Users..."
              className="text-xs bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-50"
            />
          </div>
          <Button
            onClick={() => {
              setTempRole(userRole)
              setTempStatus(userStatus)
              setFilterOpen(true)
            }}
            className="bg-[#FAFAFA] text-[#122A48] !border border-[#C6C6C8] text-[12px]"
          >
            <SlidersHorizontal /> Filter
          </Button>
        </div>

        <div className="flex flex-col gap-3 w-full text-[#122A48] mt-3">
          <div className="flex gap-2">
            {/* total users */}
            <div className="rounded-lg border border-[#C6C6C8] h-18 w-40 flex items-center p-3 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className="bg-[#CDE3DE] rounded-lg p-2">
                <FaUsers size={20} color={"#1565BC"} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#122A48] leading-tight">6</span>
                <p className="text-xs text-[#122A48]">Total Users</p>
              </div>
            </div>

            {/* total active */}
            <div className="rounded-lg border border-[#C6C6C8] h-18 w-40 flex items-center p-3 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className="bg-[#B2FBC1] rounded-lg p-2">
                <BadgeCheck size={20} color={"#2C7B3C"} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#122A48] leading-tight">6</span>
                <p className="text-xs text-[#122A48]">Active</p>
              </div>
            </div>

          </div>

          <div className="flex gap-2">
          {/* total inactive */}
          <div className="rounded-lg border border-[#C6C6C8] h-18 w-85 flex items-center p-3 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#FFE5E5] rounded-lg p-2">
              <CircleOff size={20} color={"#FF0101"} />
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#122A48] leading-tight">6</span>
              <p className="text-xs text-[#122A48]">Inactive</p>
            </div>
          </div>

          {/* total ??? */}
          <div className="rounded-lg border border-[#C6C6C8] h-18 w-85 flex items-center p-3 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#DACDE3] rounded-lg p-2">
              <ShieldCheck size={20} color={"#582579"} />
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#122A48] leading-tight">6</span>
              <p className="text-xs text-[#122A48]">???</p>
            </div>
          </div>

          </div>
        </div>

        {/* users table */}
        <div className="rounded-lg bg-[#FAFAFA] overflow-y-auto h-90 mt-3 border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
          <p className="font-semibold text-sm p-3">User Accounts</p>
          <hr />

          {/* loading */}
          {loading ? (
            <div className="flex flex-col justify-center items-center gap-2 py-30 text-[#122A48]">
              <SpinnerIcon size={24} color="#122A48" />
              <span className="text-xs font-medium">Loading Users...</span>
            </div>

          /* empty */
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-18">
              <div className="rounded-full bg-[#E5E5E6] p-3">
                <UserRound size={28} color="#727272" />
              </div>
              <p className="text-[#122A48] font-bold text-sm">No users found</p>
              <p className="text-[#727272] text-xs text-center">
                No users have been added yet.
              </p>
              <Button
                onClick={() => router.push('/admin/users/form')}
                className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] text-xs px-3 py-2 hover:bg-gray-100"
              >
                + Add User
              </Button>
            </div>

          /* user cards */
          ) : (
            <div className="flex flex-col divide-y divide-[#C6C6C8]">
              {filteredUsers.map(user => (
                <div key={user.user_id} className="flex items-center gap-3 px-3 py-3">

                  {/* avatar */}
                  <div
                    className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(user.role) }}
                  >
                    {user.fname.charAt(0)}{user.lname.charAt(0)}
                  </div>

                  {/* info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#122A48] truncate">
                      {user.fname} {user.lname}
                    </p>
                    <p className="text-xs text-[#727272] truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* role badge */}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#CDE3DE] text-[#122A48]">
                        {user.role === "MENRO Officer" ? "MENRO" : "Barangay"}
                      </span>
                      {/* status badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        user.status === 'Active'
                          ? 'bg-[#B2FBC173] text-[#2C7B3C]'
                          : 'bg-[#FFE5E5] text-[#D81010]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-[#1D8104]' : 'bg-[#BB2325]'
                        }`} />
                        {user.status}
                      </span>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === user.user_id ? null : user.user_id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#C6C6C8] bg-white"
                    >
                      <MoreHorizontal size={16} className="text-[#122A48]" />
                    </button>

                    {/* dropdown */}
                    {openMenuId === user.user_id && (
                      <>
                        {/* backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />

                        <div className="absolute right-0 top-9 z-50 bg-white border border-[#C6C6C8] rounded-lg shadow-md w-36 overflow-hidden">
                          <button
                            onClick={() => { router.push(`/admin/users/form?id=${user.user_id}`); setOpenMenuId(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-[#122A48] hover:bg-[#eaedf2]"
                          >
                            <SquarePen size={13} /> Edit
                          </button>

                          {user.status === 'Active' ? (
                            <button
                              onClick={() => { setDeactivateDialog({ open: true, user }); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-[#D81010] hover:bg-[#FFE5E5]"
                            >
                              <UserMinus size={13} /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => { setReactivateDialog({ open: true, user }); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-[#2C7B3C] hover:bg-[#CDE3DE]"
                            >
                              <UserPlus size={13} /> Activate
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* for filter dropdown */}
        {filterOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setFilterOpen(false)}
          />
        )}

        {/* sheet */}
        <div className={`
          fixed bottom-0 left-0 right-0 z-50 bg-[#FAFCFD] rounded-t-2xl shadow-xl
          transition-transform duration-300 ease-in-out
          ${filterOpen ? 'translate-y-0' : 'translate-y-full'}
        `}>
          {/* handle */}
          <div className="w-10 h-1 rounded-full bg-[#C6C6C8] mx-auto mt-3" />

          <div className="px-5 pt-4 pb-6">
            <div className="flex justify-between items-center mb-5">
              <p className="font-semibold text-[14px] text-[#122A48]">Filters</p>
              <button onClick={() => setFilterOpen(false)}>
                <X size={18} className="text-[#122A48]" />
              </button>
            </div>

            {/* Role */}
            <p className="text-[11px] font-medium text-[#6B7A90] uppercase tracking-wide mb-2">Role</p>
            <div className="flex gap-2 flex-wrap mb-5">
              {["All", "MENRO Officer", "Barangay Personnel"].map(role => (
                <button
                  key={role}
                  onClick={() => setTempRole(role)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors
                    ${tempRole === role
                      ? 'bg-[#122A48] text-white border-[#122A48]'
                      : 'bg-white text-[#122A48] border-[#C6C6C8]'
                    }`}
                >
                  {role === "MENRO Officer" ? "MENRO" : role === "Barangay Personnel" ? "Barangay" : role}
                </button>
              ))}
            </div>

            {/* Status */}
            <p className="text-[11px] font-medium text-[#6B7A90] uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-2 flex-wrap mb-6">
              {["All", "Active", "Inactive"].map(status => (
                <button
                  key={status}
                  onClick={() => setTempStatus(status)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors
                    ${tempStatus === status
                      ? 'bg-[#122A48] text-white border-[#122A48]'
                      : 'bg-white text-[#122A48] border-[#C6C6C8]'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => { setTempRole("All"); setTempStatus("All") }}
                className="flex-1 bg-white text-[#122A48] border border-[#C6C6C8] text-[13px]"
              >
                Clear
              </Button>
              <Button
                  onClick={() => {
                    setUserRole(tempRole)
                    setUserStatus(tempStatus)
                    setFilterOpen(false)
                  }}
                className="flex-1 bg-[#122A48] text-white text-[13px]"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Dialog */}
      {/* Reactivate Dialog */}
      <DialogModal
        open={reactivateDialog.open}
        onClose={() => setReactivateDialog({open: false, user: null})}
        onConfirm={handleReactivate}
        color={DIALOG_COLOR.lightgreen}
        icon={UserPlus}
        iconColor={DIALOG_COLOR.green}
        title="Reactivate User"
        description={
          <>
            Are you sure you want to activate{" "}
            <strong>{reactivateDialog.user?.fname} {reactivateDialog.user?.lname}</strong>?
          </>
        }
        cancelLabel='Cancel'
        confirmLabel='Activate User'
      />

      {/* Deactivate dialog */}
      <DialogModal
        open={deactivateDialog.open}
        onClose={() => setDeactivateDialog({open: false, user: null})}
        onConfirm={handlerDeactivate}
        color={DIALOG_COLOR.lightred}
        icon={UserMinus}
        iconColor={DIALOG_COLOR.red}
        title="Deactivate User"
        description={
          <>
            Are you sure you want to deactivate{" "}
            <strong>{deactivateDialog.user?.fname} {deactivateDialog.user?.lname}</strong>?
          </>
        }
        cancelLabel='Cancel'
        confirmLabel='Deactivate User'
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}

