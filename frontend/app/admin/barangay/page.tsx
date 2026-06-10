"use client"

// icons
import { FaSearch } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"
import { MapPinned, CheckCircle, Archive, BadgeCheck, CircleOff, Map, UserRound, SquarePen, UserMinus, UserPlus, SlidersHorizontal, X, MapPinPlus, MapPin, Navigation, MapPinPen, Check   } from "lucide-react";

// shadcn
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"

// component
import { DialogModal } from "@/components/DialogModal";
import { SpinnerIcon } from "@/components/SpinnerIcon";
import { BarangaySkeleton } from "@/components/Skeleton/BarangaySkeleton"

// react
import { useState, useEffect } from "react"

// toast
import { useToast } from "@/components/hooks/useToast";
import { Toast } from "@/components/Toast";

// table pagination
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// lib
import { DIALOG_COLOR } from "@/lib/constant";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Barangay = {
  barangay_id: number
  barangay_name: string
  latitude: number
  longitude: number
  status: string
}

type DialogState = {
  open: boolean;
  barangay?: Barangay | null;
};

function getFilteredBarangay(barangays: Barangay[], status: string, search: string) {
  return barangays
    .filter(b => status === "All" || b.status === status)
    .filter(b => b.barangay_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.barangay_id - a.barangay_id)
}


export default function Barangay() {
  // us
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<boolean>(false)

  // filter states
  const [search, setSearch] = useState<string>('')
  const [barangayStatus, setBarangayStatus] = useState<string>('Active')

  // mobile filters
  const [tempStatus, setTempStatus] = useState<string>(barangayStatus)
  const [filterOpen, setFilterOpen] = useState<boolean>(false)

  // toast
  const {toasts, addToast, removeToast } = useToast()

  // dialog states
  const [restoreDialog, setRestoreDialog] = useState<DialogState>({
    open: false,
    barangay: null,
  })
  const [archiveDialog, setArchiveDialog] = useState<DialogState>({
    open: false,
    barangay: null,
  })

  // barangay form state
  const [barangayFormDialog, setBarangayFormDialog] = useState<DialogState>({
    open: false,
    barangay: null
  })

  // barangay dialog confirmation states
  const [cancelDialog, setCancelDialog] = useState<DialogState>({
    open: false,
  })
  const [confirmDialog, setConfirmDialog] = useState<DialogState>({
    open: false,
  })
  const [loadingDialog, setLoadingDialog] = useState<DialogState>({
    open: false,
  })


  const isEdit = !!barangayFormDialog.barangay

  // form us
  const [barangay, setBarangay] = useState<string>('')
  const [latitude, setLatitude] = useState<string>('')
  const [longtitude, setLongtitude] = useState<string>('')
  const [mapLoading, setMapLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const fetchBarangay = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const token = getAccessToken()
      const [data] = await Promise.all([
        api.get('/api/barangays/', token ?? undefined),
        new Promise(resolve => setTimeout(resolve, 800)) // minimum 800ms
      ])
      setBarangays((data.results as Barangay[]).filter(u => u.barangay_name !== 'Admin'))
    } catch (err) {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBarangay()
  }, [])

  useEffect(() => {
    if (barangayFormDialog.barangay) {
      setBarangay(barangayFormDialog.barangay.barangay_name)
      setLatitude(String(barangayFormDialog.barangay.latitude))
      setLongtitude(String(barangayFormDialog.barangay.longitude))
    } else {
      setBarangay('')
      setLatitude('')
      setLongtitude('')
      setFieldErrors({})
    }
  }, [barangayFormDialog.open])

  const filteredBarangay = getFilteredBarangay(barangays, barangayStatus, search)

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filteredBarangay, 4)

  // summary cards
  const total    = barangays.length
  const active = barangays.filter(u => u.status === 'Active').length
  const archived   = barangays.filter(u => u.status === 'Archived').length

  // handlers
  const handleArchive = async () => {
    const barangay = archiveDialog.barangay
    if (!barangay) return
    setArchiveDialog({ open: false, barangay: null})
    try {
      const token = getAccessToken()
      await api.patch(`/api/barangays/${barangay.barangay_id}/`, { status: 'Archived'}, token ?? undefined)
      addToast(`${barangay.barangay_name} has been archived.`)
      setBarangays(prev =>
        prev.map(u =>
          u.barangay_id === barangay.barangay_id
            ? { ...u, status: "Archived" }
            : u
        )
      )
    } catch (err) {
      console.log(err)
      addToast('Failed to archive barangay', 'error')
    }
  }

  const handleRestore = async () => {
    const barangay = restoreDialog.barangay
    if (!barangay) return
    setRestoreDialog({ open: false, barangay: null})
    try {
      const token = getAccessToken()
      await api.patch(`/api/barangays/${barangay.barangay_id}/`, { status: 'Active'}, token ?? undefined)
      addToast(`${barangay.barangay_name} has been restored.`)
      setBarangays(prev =>
        prev.map(u =>
          u.barangay_id === barangay.barangay_id
            ? { ...u, status: "Active" }
            : u
        )
      )
    } catch (err) {
      console.log(err)
      addToast('Fialed to restore barangay.', 'error')
    }
  }

  // handlers for form
  const handleConfirmationDialog = () => {
    const errors: Record<string, string> = {}
    if (!barangay.trim())        errors.barangay         = 'This field is required.'
    if (!latitude.trim())        errors.latitude         = 'This field is required.'
    if (!longtitude.trim())     errors.longtitude      = 'This field is required.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setConfirmDialog({ open: true })
  }

  const handleCancel = () => {
    setCancelDialog({ open: false})
    setBarangayFormDialog({ open: false, barangay: null})
    setBarangay('')
    setLatitude('')
    setLongtitude('')
    setFieldErrors({})
  }

  const handleSubmit = async () => {
    setConfirmDialog({ open: false })
    setLoadingDialog({ open: true })

    try {
      const token = getAccessToken()
      const payload = {
        barangay_name: barangay,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longtitude),
      }

      if (isEdit) {
        const id = barangayFormDialog.barangay!.barangay_id
        await api.patch(`/api/barangays/${id}/`, payload, token ?? undefined)
      } else {
        await api.post('/api/barangays/', payload, token ?? undefined)
      }

      setLoadingDialog({ open: false })
      setBarangayFormDialog({ open: false, barangay: null })
      addToast(isEdit ? `${barangay} has been updated.` : `${barangay} has been added.`, 'success')
      fetchBarangay()

    } catch (err: any) {
      setLoadingDialog({ open: false })

      if (err && typeof err === 'object') {
        const backendErrors: Record<string, string> = {}
        for (const key in err) {
          backendErrors[key] = Array.isArray(err[key]) ? err[key][0] : err[key]
        }
        setFieldErrors(backendErrors)
      }

      addToast(isEdit ? 'Failed to save changes.' : 'Failed to add barangay.', 'error')
    }
  }

  if (loading) return <BarangaySkeleton />

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* title and filter container */}
        <div className="flex justify-between w-full mb-4">
          <div className="font-bold text-[#122A48] flex justify-center items-center text-lg">
            <p>Barangay</p>
          </div>

          <div className="flex gap-3">
            {/* search filter */}
            <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-11">
              <FaSearch size={18} className="text-[#C6C6C8]" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Barangay..."
                className="bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-[200px]"
              />
            </div>

            {/* barangay status filter */}
            <Select value={barangayStatus} onValueChange={setBarangayStatus}>
              <SelectTrigger className="w-30 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-30 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All">All Status</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Active">Active</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* add barangay */}
            <Button
              onClick={() => setBarangayFormDialog({ open: true, barangay: null})}
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Add Barangay
            </Button>

          </div>
        </div>

        {/* total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {/* total barangay */}
          <div className="rounded-lg border-2 border-[#C6C6C8] h-20 w-105 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#CDE3DE] rounded-lg p-2">
              <MapPinned  size={20} color={"#1565BC"} />
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#122A48] leading-tight">{total}</span>
              <p className="text-sm text-[#122A48]">Total Barangay</p>
            </div>
          </div>

          {/* total active barangay */}
          <div className="rounded-lg border-2 border-[#C6C6C8] h-20 w-105 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#B2FBC1] rounded-lg p-2">
              <CheckCircle  size={20} color={"#2C7B3C"} />
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#122A48] leading-tight">{active}</span>
              <p className="text-sm text-[#122A48]">Active</p>
            </div>
          </div>

          {/* total archived barangay */}
            <div className="rounded-lg border-2 border-[#C6C6C8] h-20 w-105 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            {/* icon */}
            <div className="bg-[#FFE5E5] rounded-lg p-2">
              <Archive size={20} color={"#FF0101"} />
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#122A48] leading-tight">{archived}</span>
              <p className="text-sm text-[#122A48]">Archived</p>
            </div>
          </div>

        </div>

        {/* table */}
        <div className="bg-[#FAFCFD] rounded-lg border-2 border-[#C6C6C8] mt-5 pt-4 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] flex flex-col h-[435px]">
          <p className="text-[#122A48] font-bold mx-3 mb-2">Barangay List</p>

          <Table>
            <TableHeader className="bg-[#e8eef1b4] border-[#727272]">
              <TableRow>
                <TableHead className="text-[#727272] text-center font-semibold w-16">ID</TableHead>
                <TableHead className="text-[#727272] text-center font-semibold w-1/3">BARANGAY</TableHead>
                <TableHead className="text-[#727272] text-center font-semibold w-1/4">LOCATION</TableHead>
                <TableHead className="text-[#727272] text-center font-semibold w-1/4">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {/* fetch error state */}
              {fetchError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-15">
                    <div className="flex flex-col justify-center items-center gap-3 py-20">
                      <p className="text-[#D81010] font-semibold text-base">Failed to load barangay. Please try again later.</p>
                      <Button onClick={fetchBarangay} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                    </div>
                  </TableCell>
                </TableRow>
              
              // no barangay state
                ) : filteredBarangay.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-15">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-[#E5E5E6] p-4">
                        <UserRound size={36} color="#727272" />
                      </div>
                      <p className="text-[#122A48] font-bold">No barangay found</p>
                      <p className="text-[#727272] text-sm">
                        No barangay have been added yet. <br/> Click the button below to start adding barangay.
                      </p>
                      <Button
                        onClick={() => setBarangayFormDialog({ open: true, barangay: null})}
                        className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                      >
                        + Add Barangay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                // with barangay state
                ) : (
                  paginated.map(barangay => (
                    <TableRow key={barangay.barangay_id} className="border-b border-[#C6C6C8]">
                      <TableCell className="text-[#122A48] text-center h-18">{barangay.barangay_id}</TableCell>

                      <TableCell className="text-[#122A48] text-center h-18">{barangay.barangay_name}</TableCell>

                      <TableCell className="text-[#122A48] text-center h-18">
                        <Button className="rounded-lg text-[#2C7B3C] border border-[#C6C6C8] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] py-4.5 px-3">
                          <Map size={16}/>
                          View on map
                        </Button>
                      </TableCell>

                      <TableCell className="text-[#122A48] flex gap-3 justify-center items-center h-18">
                        <Button 
                          onClick={() => setBarangayFormDialog({ open: true, barangay: barangay })}
                          className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] py-4.5 px-3"
                        >
                          <SquarePen size={16} />
                          Edit
                        </Button>

                        {barangay.status === 'Active' ? (
                          <Button 
                            onClick={() => setArchiveDialog({ open: true, barangay: barangay})}
                            className="flex gap-2 text-[#D81010] rounded-lg bg-[#FFE5E5] hover:bg-red-200 cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                          >
                            <UserMinus size={16} />
                            Archived
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setRestoreDialog({ open: true, barangay: barangay })}
                            className="flex gap-2 text-[#2C7B3C] rounded-lg bg-[#CDE3DE] hover:bg-green-200 cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                          >
                            <UserPlus size={16} />
                            Restore
                          </Button>
                        )}
                      </TableCell>
                      
                    </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
          <div className="mt-auto">
            <TablePagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>



      </div>

      {/* -------------------------------------------------------------------------------------- */}

      {/* for mobile */}
      <div className="md:hidden text-[#122A48]">
        {/* filter */}
        <div className="flex justify-between items-center">
          <p className="font-bold">Barangay</p>
          <Button
            onClick={() => setBarangayFormDialog({ open: true, barangay: null})}
            className="p-5 py-5 rounded-lg cursor-pointer bg-[#1565BC] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
          >
            <FaPlus color="white" /> Add Barngay
          </Button>
        </div>

        <div className="flex gap-2 justify-between mt-3">
          <div className="flex items-center bg-[#FAFCFD] border-1 border-[#C6C6C8] rounded-lg px-3 gap-2 h-8">
            <FaSearch size={13} className="text-[#C6C6C8]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Barangay..."
              className="text-xs bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-50"
            />
          </div>
          <Button
            onClick={() => {
              setTempStatus(barangayStatus)
              setFilterOpen(true)
            }}
            className="bg-[#FAFAFA] text-[#122A48] !border border-[#C6C6C8] text-[12px]"
          >
            <SlidersHorizontal /> Filter
          </Button>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 w-full text-[#122A48] mt-3">
          <div className="flex gap-2">
            {/* total users */}
            <div className="rounded-lg border border-[#C6C6C8] h-18 w-26 flex items-center p-2 gap-2 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className="bg-[#CDE3DE] rounded-lg p-1.5">
                <MapPinned size={16} color={"#1565BC"} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#122A48] leading-tight">{total}</span>
                <p className="text-[11px] text-[#122A48]">Total</p>
              </div>
            </div>

            {/* total active */}
            <div className="rounded-lg border border-[#C6C6C8] h-18 w-26 flex items-center p-2 gap-2 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className="bg-[#B2FBC1] rounded-lg p-1.5">
                <BadgeCheck size={16} color={"#2C7B3C"} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#122A48] leading-tight">{active}</span>
                <p className="text-[11px] text-[#122A48]">Active</p>
              </div>
            </div>

            {/* total archived */}
            <div className="rounded-lg border border-[#C6C6C8] h-18 w-26 flex items-center p-2 gap-2 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              {/* icon */}
              <div className="bg-[#FFE5E5] rounded-lg p-1.5">
                <CircleOff size={16} color={"#FF0101"} />
              </div>

              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#122A48] leading-tight">{archived}</span>
                <p className="text-[11px] text-[#122A48]">Archived</p>
              </div>
            </div>

          </div>
        </div>       

        {/* Barangay Cards */}
        <div className="rounded-lg h-150 mt-3">
          <p className="font-semibold text-sm mb-3">Barangay List</p>

          {/* fetch error state */}
          {fetchError ? (
            <div className="flex flex-col justify-center items-center text-center gap-3 py-25">
              <p className="text-[#D81010] font-semibold text-xs">Failed to load barangay. <br/> Please try again later.</p>
              <Button onClick={fetchBarangay} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
            </div>

          // empty
          ) :filteredBarangay.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-18">
              <div className="rounded-full bg-[#E5E5E6] p-3">
                <MapPinned size={28} color="#727272" />
              </div>
              <p className="text-[#122A48] font-bold text-sm">No barangay found</p>
              <p className="text-[#727272] text-xs text-center">
                No barangay have been added yet.
              </p>
              <Button
                onClick={() => setBarangayFormDialog({ open: true, barangay: null})}
                className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] text-xs px-3 py-2 hover:bg-gray-100"
              >
                + Add Barangay
              </Button>
            </div>

          // not empty
          ) : (
            <div className="flex flex-col">
              {filteredBarangay.map(barangay => (
                <div key={barangay.barangay_id} className="flex gap-3 mb-3">

                  <div className="p-2 rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between w-77 border-b border-[#C6C6C8[">

                      <div className="flex gap-2 pb-2 pt-1">
                        <div className="p-1 px-1.5 bg-[#1565BC29] rounded-lg">
                          <p className="text-[10px]">#{barangay.barangay_id}</p>
                        </div>
                        <p className="font-medium text-[13px]">{barangay.barangay_name}</p>
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          barangay.status === 'Active'
                            ? 'bg-[#B2FBC173] text-[#2C7B3C]'
                            : 'bg-[#FFE5E5] text-[#D81010]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            barangay.status === 'Active' ? 'bg-[#1D8104]' : 'bg-[#BB2325]'
                          }`} />
                          {barangay.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-3">
                      <Button className="rounded-lg text-[#2C7B3C] border border-[#C6C6C8] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] h-11 w-25 text-xs">
                          <Map size={16}/>
                          View on <br /> map
                        </Button>
                        <Button 
                          onClick={() => setBarangayFormDialog({ open: true, barangay: barangay })}
                          className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] h-11 w-23 text-xs"
                        >
                          <SquarePen size={16} />
                          Edit
                        </Button>
                        {barangay.status === 'Active' ? (
                          <Button 
                            onClick={() => setArchiveDialog({ open: true, barangay: barangay})}
                            className="flex gap-2 text-[#D81010] rounded-lg bg-[#FFE5E5] hover:bg-red-200 cursor-pointer border border-[#C6C6C8] h-11 w-23 text-xs"
                          >
                            <UserMinus size={16} />
                            Archived
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setRestoreDialog({ open: true, barangay: barangay })}
                            className="flex gap-2 text-[#2C7B3C] rounded-lg bg-[#CDE3DE] hover:bg-green-200 cursor-pointer border border-[#C6C6C8] h-11 w-23 text-xs"
                          >
                            <UserPlus size={16} />
                            Restore
                          </Button>
                        )}
                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* filter backdrop */}
        {filterOpen && (
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setFilterOpen(false)} />
        )}

        {/* filter bottom sheet */}
        <div className={`
          fixed bottom-0 left-0 right-0 z-50 bg-[#FAFCFD] rounded-t-2xl shadow-xl
          transition-transform duration-300 ease-in-out
          ${filterOpen ? 'translate-y-0' : 'translate-y-full'}
        `}>
          <div className="w-10 h-1 rounded-full bg-[#C6C6C8] mx-auto mt-3" />
          <div className="px-5 pt-4 pb-6">
            <div className="flex justify-between items-center mb-5">
              <p className="font-semibold text-[14px] text-[#122A48]">Filters</p>
              <button onClick={() => setFilterOpen(false)}>
                <X size={18} className="text-[#122A48]" />
              </button>
            </div>

            {/* Status */}
            <p className="text-[11px] font-medium text-[#6B7A90] uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-2 flex-wrap mb-6">
              {["All", "Active", "Archived"].map(status => (
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

            <div className="flex gap-3">
              <Button
                onClick={() => setTempStatus("All")}
                className="flex-1 bg-white text-[#122A48] border border-[#C6C6C8] text-[13px]"
              >
                Clear
              </Button>
              <Button
                onClick={() => {
                  setBarangayStatus(tempStatus)
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

      {/* Restore Dialog */}
      <DialogModal
        open={restoreDialog.open}
        onClose={() => setRestoreDialog({open: false, barangay: null})}
        onConfirm={handleRestore}
        color={DIALOG_COLOR.lightgreen}
        icon={MapPinned}
        iconColor={DIALOG_COLOR.green}
        title="Reactivate Barangay"
        description={
          <>
            Are you sure you want to activate{" "}
            <strong>{restoreDialog.barangay?.barangay_name}</strong>?
          </>
        }
        cancelLabel='Cancel'
        confirmLabel='Activate Barangay'
      />

      {/* Archived dialog */}
      <DialogModal
        open={archiveDialog.open}
        onClose={() => setArchiveDialog({open: false, barangay: null})}
        onConfirm={handleArchive}
        color={DIALOG_COLOR.lightred}
        icon={Archive}
        iconColor={DIALOG_COLOR.red}
        title="Deactivate Barangay"
        description={
          <>
            Are you sure you want to deactivate{" "}
            <strong>{archiveDialog.barangay?.barangay_name} </strong>?
          </>
        }
        cancelLabel='Cancel'
        confirmLabel='Deactivate Barangay'
      />


      {/* Brangay Form Dialog */}
      <Dialog open={barangayFormDialog.open}>
        <DialogContent className="[&>button]:hidden p-0 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] min-w-80 md:min-w-180">
          <DialogHeader>
            <div className="flex gap-3 p-4 py-3 md:p-5 md:py-5">
              <div className={`flex-shrink-0 self-start rounded-lg p-2 md:p-2.5 text-white ${isEdit ? 'bg-[#FF9705] mt-0.5' : 'bg-[#1565BC] mt-1.5 md:mt-0.5'}`}>
                {isEdit ? <MapPinPen className="md:h-7.5 md:w-7.5" /> : <MapPinPlus className="md:h-7.5 md:w-7.5" />}
              </div>
              <div className="flex flex-col ">
                <p className="font-bold text-base md:text-lg">{isEdit ? barangayFormDialog.barangay?.barangay_name ?? 'Edit Barangay' : 'Add Barangay'}</p>
                <p className="text-[10px] md:text-sm">
                  {isEdit ? (
                    'Rosario, La Union'
                  ) : (
                    <>
                      Register a new Barangay under AGOS <br className="md:hidden" /> monitoring coverage
                    </>
                  )}
                </p>
              </div>
            </div>
            
          </DialogHeader>
            {/* form container */}
            <form>
              <div className="border-t border-[#C6C6C8] p-4 md:p-5 -mt-3">
                <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                  <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                    <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2">
                      <MapPin className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5"/>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-xs md:text-base">Barangay Information</p>
                      <p className="text-[10px] md:text-xs text-[#727272]">Basic identity detail of the Barangay</p>
                    </div>
                  </div>

                  {/* Barangay Select */}
                  <div className="border-t border-[#C6C6C8] p-2.5 md:p-4">
                    <Field className="flex gap-1.5 flex-col w-[274px] md:w-[400px]">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">BARANGAY <span className="text-[#FF0000]">*</span></FieldLabel>
                          <Select
                            value={barangay}
                            onValueChange={(value) => {
                              setBarangay(value)
                              if (fieldErrors.barangay) setFieldErrors(prev => ({ ...prev, role: '' }))
                            }}
                          >
                          <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.barangay ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                            <SelectValue placeholder="Select Barangay..." />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem className="text-[#122A48] p-1 md:p-2" value="Udiao">Udiao</SelectItem>
                            <SelectItem className="text-[#122A48] p-1 md:p-2" value="Tay-ac">Tay-ac</SelectItem>
                            <SelectItem className="text-[#122A48] p-1 md:p-2" value="Subusub">Subusub</SelectItem>
                            <SelectItem className="text-[#122A48] p-1 md:p-2" value="Nangcamotian">Nangcamotian</SelectItem>
                            <SelectItem className="text-[#122A48] p-1 md:p-2" value="Poblacion East">Poblacion East</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError className="text-xs">{fieldErrors.barangay}</FieldError>
                    </Field>
                  </div>
                </div>
              </div>

              {/* geographic location */}
              <div className="p-4 md:p-5 -mt-5 md:-mt-7">
                <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                  <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                    <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2 flex justify-center items-center h-full mt-1.5 md:mt-0">
                      <Navigation className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5"/>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-xs md:text-base">Geographic Location</p>
                      <p className="text-[10px] md:text-xs text-[#727272]">Enter the latitude and longitude coordinates of the barangay hall.</p>
                    </div>
                  </div>

                  {/* latitude & longtitude inputs */}
                  <div className="border-t border-[#C6C6C8] p-2.5 md:p-4">
                    <div className="flex gap-3 w-full -mt-3">
                      <div className="mt-3 flex-1">
                        {/* latitude */}
                        <Field className="flex gap-1.5 flex-col">
                          <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LATITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                            <Input
                              type="number"
                              name="latitude"
                              value={latitude}
                              onChange={(e) => {
                                setLatitude(e.target.value)
                              }}
                              placeholder="e.g. 10.000000000000000"
                              className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h- md:h-9 bg-[#1565BC05] ${
                                fieldErrors.latitude ? 'border-[#FF0000]' : 'border-[#727272]'
                              }`}
                            />
                            <div className="flex justify-between items-center">
                            <FieldError className="text-xs">{fieldErrors.latitude}</FieldError>
                          </div>
                        </Field>
                      </div>
                      <div className="mt-3 flex-1">
                        {/* latitude */}
                        <Field className="flex gap-1.5 flex-col">
                          <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LONGTITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                            <Input
                              type="number"
                              name="longtitude"
                              value={longtitude}
                              onChange={(e) => {
                                setLongtitude(e.target.value)
                              }}
                              placeholder="e.g. 10.000000000000000"
                              className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h- md:h-9 bg-[#1565BC05] ${
                                fieldErrors.longtitude ? 'border-[#FF0000]' : 'border-[#727272]'
                              }`}
                            />
                            <div className="flex justify-between items-center">
                            <FieldError className="text-xs">{fieldErrors.longtitude}</FieldError>
                          </div>
                        </Field>
                      </div>
                    </div>
                  </div>
                  
                  {/* Map preview */}
                  <div className="p-2.5 md:p-3 -mt-4">
                    <div className="rounded-lg bg-[#726D7814] border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                      <div className="p-2.5 md:p-3 ">
                        <p className="font-semibold text-xs md:text-sm">Map Preview</p>
                      </div>
                      {/* here the map later on */}
                      <div className="p-3 border-t border-[#C6C6C8]">

                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* buttons */}
              <div className="flex gap-3 justify-end p-4 -mt-5">
                <Button
                  type="button"
                  onClick={() => setCancelDialog({ open: true})}
                  className="cursor-pointer hover:bg-[#e3ecf0] bg-[#FAFCFD] border border-[#C6C6C8] text-xs md:text-sm rounded-lg px-5 py-4 text-[#727272]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmationDialog}
                  className="cursor-pointer hover:bg-[#12569f] rounded-lg text-xs md:text-sm px-4 py-4 bg-[#1565BC]"
                >
                  <Check />
                  {isEdit ? 'Save Changes' : 'Add Barangay'}
                </Button>

              </div>
            </form>

        </DialogContent>
      </Dialog>

      {/* Dialog for form */}
      
      {/* cancel dialog */}
      <DialogModal
        open={cancelDialog.open}
        onClose={() => setCancelDialog({open: false})}
        onConfirm={handleCancel}
        color={isEdit ? DIALOG_COLOR.lightyellow : DIALOG_COLOR.lightred}
        icon={isEdit ? SquarePen : X}
        iconColor={isEdit ? DIALOG_COLOR.yellow : DIALOG_COLOR.red}
        title={isEdit ? "Cancel Changes" : "Cancel Adding Barangay"}
        description={isEdit ? 'You have unsaved changes that will be lost if you cancel.' : 'Are you sure you want to cancel adding barangay?'}
        cancelLabel='Keep Editing'
        confirmLabel='Yes, Cancel'
      />

      {/* confirm dialog */}
      <DialogModal
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({open: false})}
        onConfirm={handleSubmit}
        color={DIALOG_COLOR.lightgreen}
        icon={isEdit? MapPinPen : MapPinPlus}
        iconColor={DIALOG_COLOR.green}
        title={isEdit ? 'Confirm Changes' : 'Confirm Adding Barangay'}
        description={isEdit ?
          <>
            Are you sure you want to change barangay <strong>{barangay}</strong> information?
          </>
          :
          <>
            Are you sure you want to add this new barangay?
          </>
        }
        cancelLabel='Keep Editing'
        confirmLabel={isEdit ? 'Confirm Changes' : 'Add Barangay'}
      />

      {/* loading state */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title={isEdit? "Saving Changes" : "Saving Barangay"}
        description={isEdit ? 
          <>
            Processing barangay detail changes for barangay <strong>{barangay}</strong>. Please wait.
          </>
          : 
          <>
            Proccessing barangay details. Please wait.
          </>
        }
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}
