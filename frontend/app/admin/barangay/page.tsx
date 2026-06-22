"use client"

// icons
import { FaSearch } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"
import { MapPinned, CheckCircle, BadgeCheck, Map, UserRound, X, MapPinPlus, MapPin, Navigation, Check, MapPinOff } from "lucide-react";

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
import AgosMapWrapper from "@/components/Map/AgosMapWrapper";
import { SearchFilter } from "@/components/SearchFilter";

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
  is_registered: boolean
}

type DialogState = {
  open: boolean;
  barangay?: Barangay | null;
};

function getFilteredBarangay(barangays: Barangay[], search: string) {
  return barangays
    .filter(b => b.barangay_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.barangay_id - a.barangay_id)
}

// open maps redirect to google map
const openInGoogleMaps = (latitude: number, longitude: number) => {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    "_blank"
  );
};


export default function Barangay() {
  // us
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<boolean>(false)

  // filter states
  const [search, setSearch] = useState<string>('')

  // toast
  const { toasts, addToast, removeToast } = useToast()

  // view map dialog state
  const [viewMapDialog, setViewMapDialog] = useState<DialogState>({
    open: false,
    barangay: null,
  })

  // dialog states
  const [unregisterDialog, setUnregisterDialog] = useState<DialogState>({
    open: false,
    barangay: null,
  })
  const [blockedDialog, setBlockedDialog] = useState<{ open: boolean; message: string; issues: string[] }>({
    open: false,
    message: '',
    issues: [],
  })

  // barangay form state (register only)
  const [barangayFormDialog, setBarangayFormDialog] = useState<{ open: boolean }>({
    open: false,
  })

  // barangay dialog confirmation states
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean }>({
    open: false,
  })
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean }>({
    open: false,
  })
  const [loadingDialog, setLoadingDialog] = useState<{ open: boolean }>({
    open: false,
  })

  const addedBarangayNames = new Set(barangays.map(b => b.barangay_name))

  // form us
  const [barangay, setBarangay] = useState<string>('')
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])

  const fetchBarangay = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const token = getAccessToken()
      const [registered, all] = await Promise.all([
        api.get('/api/barangays/', token ?? undefined),
        api.get('/api/barangays/all/', token ?? undefined),
        new Promise(resolve => setTimeout(resolve, 800))
      ])
      setBarangays((registered.results ?? registered).filter((b: Barangay) => b.barangay_name !== 'Admin'))
      setAllBarangays((all.results ?? all).filter((b: Barangay) => b.barangay_name !== 'Admin'))
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBarangay()
  }, [])

  useEffect(() => {
    if (!barangayFormDialog.open) {
      setBarangay('')
      setLatitude('')
      setLongitude('')
      setFieldErrors({})
    }
  }, [barangayFormDialog.open])

  const filteredBarangay = getFilteredBarangay(barangays, search)

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filteredBarangay, 4)

  // summary cards
  const total = allBarangays.length
  const registered = allBarangays.filter(b => b.is_registered).length
  const unregistered = allBarangays.filter(b => !b.is_registered).length

  // handlers
  const handleUnregisterClick = async (b: Barangay) => {
    try {
      const token = getAccessToken()
      const result = await api.get(`/api/barangays/${b.barangay_id}/check/`, token ?? undefined)
      if (!result.can_unregister) {
        setBlockedDialog({ open: true, message: result.detail, issues: result.issues ?? [] })
      } else {
        setUnregisterDialog({ open: true, barangay: b })
      }
    } catch {
      addToast('Failed to check barangay status.', 'error')
    }
  }

  const handleUnregister = async () => {
    const b = unregisterDialog.barangay
    if (!b) return
    setUnregisterDialog({ open: false, barangay: null })
    try {
      const token = getAccessToken()
      await api.patch(`/api/barangays/${b.barangay_id}/unregister/`, {}, token ?? undefined)
      setBarangays(prev => prev.filter(u => u.barangay_id !== b.barangay_id))
      addToast(`${b.barangay_name} has been unregistered.`, 'success')
    } catch (err: any) {
      addToast(err?.detail ?? 'Failed to unregister barangay.', 'error')
    }
  }

  // handlers for form
  const handleConfirmationDialog = () => {
    const errors: Record<string, string> = {}
    if (!barangay.trim()) errors.barangay = 'This field is required.'
    if (!latitude.trim()) errors.latitude = 'This field is required.'
    if (!longitude.trim()) errors.longitude = 'This field is required.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setConfirmDialog({ open: true })
  }

  const handleCancel = () => {
    setCancelDialog({ open: false })
    setBarangayFormDialog({ open: false })
    setBarangay('')
    setLatitude('')
    setLongitude('')
    setFieldErrors({})
  }

  const handleSubmit = async () => {
    setConfirmDialog({ open: false })

    try {
      const token = getAccessToken()
      const payload = {
        barangay_name: barangay,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      }

      const created = await api.post('/api/barangays/', payload, token ?? undefined)
      setBarangays(prev => [created, ...prev])

      setBarangayFormDialog({ open: false })
      addToast(`${barangay} has been registered.`, 'success')

    } catch (err: any) {
      if (err && typeof err === 'object') {
        const backendErrors: Record<string, string> = {}
        for (const key in err) {
          backendErrors[key] = Array.isArray(err[key]) ? err[key][0] : err[key]
        }
        setFieldErrors(backendErrors)
      }
      addToast('Failed to register barangay.', 'error')
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
            <SearchFilter value={search} onChange={setSearch} placeholder='Search Barangay...' width="w-50" height="h-11" />

            {/* register barangay */}
            <Button
              onClick={() => setBarangayFormDialog({ open: true })}
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Register Barangay
            </Button>

          </div>
        </div>

        {/* total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {[
            { icon: <MapPinned size={20} color="#1565BC" />, bg: "bg-[#CDE3DE]", count: total, label: "Total Barangay" },
            { icon: <CheckCircle size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: registered, label: "All Registered" },
            { icon: <MapPinOff size={20} color="#FF0101" />, bg: "bg-[#FFE5E5]", count: unregistered, label: "All Unregistered" },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-95 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[#122A48] leading-tight">{card.count}</span>
                <p className="text-sm text-[#122A48]">{card.label}</p>
              </div>
            </div>
          ))}
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
                        No barangay have been registered yet. <br /> Click the button below to start register barangay.
                      </p>
                      <Button
                        onClick={() => setBarangayFormDialog({ open: true })}
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
                      <Button
                        onClick={() => setViewMapDialog({ open: true, barangay: barangay })}
                        className="rounded-lg text-[#2C7B3C] border border-[#C6C6C8] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] py-4.5 px-3"
                      >
                        <Map size={16} />
                        View on map
                      </Button>
                    </TableCell>

                    <TableCell className="text-[#122A48] flex gap-3 justify-center items-center h-18">
                      <Button
                        onClick={() => handleUnregisterClick(barangay)}
                        className="flex gap-2 text-[#122A48] rounded-lg bg-[#DACDE3] hover:bg-purple-200 cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                      >
                        <MapPinOff size={16} />
                        Unregister
                      </Button>
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
            onClick={() => setBarangayFormDialog({ open: true })}
            className="p-5 py-5 rounded-lg cursor-pointer bg-[#1565BC] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
          >
            <FaPlus color="white" /> Register Barangay
          </Button>
        </div>

        <div className="flex gap-2 justify-between mt-3">
          <div className="flex items-center bg-[#FAFCFD] border-1 border-[#C6C6C8] rounded-lg px-3 h-8">
            <FaSearch size={13} className="text-[#C6C6C8]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Barangay..."
              className="text-xs bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-73.5"
            />
          </div>
        </div>

        {/* Cards */}
        <div className="flex gap-2 w-full text-[#122A48] mt-3">
          <div className="rounded-lg border border-[#C6C6C8] h-18 flex-1 flex items-center p-2 gap-2 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            <div className="bg-[#CDE3DE] rounded-lg p-1.5"><MapPinned size={16} color="#1565BC" /></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">{total}</span>
              <p className="text-[11px]">Total</p>
            </div>
          </div>
          <div className="rounded-lg border border-[#C6C6C8] h-18 flex-1 flex items-center p-2 gap-2 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            <div className="bg-[#B2FBC1] rounded-lg p-1.5"><BadgeCheck size={16} color="#2C7B3C" /></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">{registered}</span>
              <p className="text-[11px]">Registered</p>
            </div>
          </div>
          <div className="rounded-lg border border-[#C6C6C8] h-18 flex-1 flex items-center p-2 gap-2 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            <div className="bg-[#FFE5E5] rounded-lg p-1.5"><MapPinOff size={16} color="#FF0101" /></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">{unregistered}</span>
              <p className="text-[11px]">Unregistered</p>
            </div>
          </div>
        </div>

        {/* Barangay Cards */}
        <div className="rounded-lg h-150 mt-3">
          <p className="font-semibold text-sm mb-3">Barangay List</p>

          {/* fetch error state */}
          {fetchError ? (
            <div className="flex flex-col justify-center items-center text-center gap-3 py-25">
              <p className="text-[#D81010] font-semibold text-xs">Failed to load barangay. <br /> Please try again later.</p>
              <Button onClick={fetchBarangay} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
            </div>

            // empty
          ) : filteredBarangay.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-18">
              <div className="rounded-full bg-[#E5E5E6] p-3">
                <MapPinned size={28} color="#727272" />
              </div>
              <p className="text-[#122A48] font-bold text-sm">No barangay found</p>
              <p className="text-[#727272] text-xs text-center">
                No barangay have been Register yet.
              </p>
              <Button
                onClick={() => setBarangayFormDialog({ open: true })}
                className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] text-xs px-3 py-2 hover:bg-gray-100"
              >
                + Register Barangay
              </Button>
            </div>

            // not empty
          ) : (
            <div className="flex flex-col">
              {filteredBarangay.map(barangay => (
                <div key={barangay.barangay_id} className="flex gap-3 mb-3">
                  <div className="p-2 rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full">
                    <div className="flex justify-between w-full border-b border-[#C6C6C8] pb-2 pt-1">
                      <div className="flex gap-2">
                        <div className="p-1 px-1.5 bg-[#1565BC29] rounded-lg">
                          <p className="text-[10px]">#{barangay.barangay_id}</p>
                        </div>
                        <p className="font-medium text-[13px]">{barangay.barangay_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3">
                      <Button
                        onClick={() => setViewMapDialog({ open: true, barangay: barangay })}
                        className="rounded-lg text-[#2C7B3C] border border-[#73b780] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] h-11 w-25 text-xs"
                      >
                        <Map size={16} /> View on <br /> map
                      </Button>
                      <Button
                        onClick={() => handleUnregisterClick(barangay)}
                        className="flex gap-2 text-[#582579] rounded-lg bg-[#DACDE3] hover:bg-purple-200 cursor-pointer border border-[#b294c6] h-11 w-23 text-xs"
                      >
                        <MapPinOff size={16} /> Unregister
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}

        </div>

      </div>

      {/* Dialog */}

      {/* View on Map Dialog */}
      <Dialog open={viewMapDialog.open}>
        <DialogContent className="[&>button]:hidden p-4 md:p-6 text-[#122A48] rounded-lg border border-[#C6C6C8] min-w-80 md:min-w-150">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <p className="font-bold text-base md:text-lg">Brgy. {viewMapDialog.barangay?.barangay_name}</p>
              </div>
              <button className="cursor-pointer" onClick={() => setViewMapDialog({ open: false, barangay: null })}>
                <X size={18} />
              </button>
            </div>
          </DialogHeader>
          <div className="h-100 md:h-[380px] rounded-b-lg w-70 md:w-140 overflow-hidden">
            <AgosMapWrapper
              latitude={viewMapDialog.barangay?.latitude}
              longitude={viewMapDialog.barangay?.longitude}
              label={viewMapDialog.barangay?.barangay_name}
              zoom={16}
            />
          </div>
          <div className="border-t border-[#C6C6C8] flex justify-between py-3 -mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <p className="text-xs md:text-sm">{viewMapDialog.barangay?.latitude}</p>
              <p className="text-xs md:text-sm">{viewMapDialog.barangay?.longitude}</p>
            </div>
            <Button
              disabled={
                viewMapDialog.barangay?.latitude == null ||
                viewMapDialog.barangay?.longitude == null
              }
              onClick={() => {
                const barangay = viewMapDialog.barangay;
                if (!barangay) return;

                openInGoogleMaps(
                  barangay.latitude,
                  barangay.longitude
                );
              }}
              className="cursor-pointer rounded-lg border border-[#C6C6C8] bg-[#FAFCFD] hover:bg-[#d6e4eb] px-3 py-2 md:px-4 md:py-3 text-[#727272]"
            >
              <Map />
              Open in Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogModal
        open={unregisterDialog.open}
        onClose={() => setUnregisterDialog({ open: false, barangay: null })}
        onConfirm={handleUnregister}
        color={DIALOG_COLOR.lightred}
        icon={MapPinOff}
        iconColor={DIALOG_COLOR.red}
        title="Unregister Barangay"
        description={
          <div className="text-justify">
            Are you sure you want to unregister{" "}
            <strong>{unregisterDialog.barangay?.barangay_name}</strong>? Make sure all sensor nodes and barangay users are decommissioned first.
          </div>
        }
        cancelLabel="Cancel"
        confirmLabel="Unregister"
      />

      <DialogModal
        open={blockedDialog.open}
        onClose={() => setBlockedDialog({ open: false, message: '', issues: [] })}
        onConfirm={() => setBlockedDialog({ open: false, message: '', issues: [] })}
        color={DIALOG_COLOR.lightorange}
        icon={MapPinOff}
        iconColor={DIALOG_COLOR.orange}
        title="Cannot Unregister Barangay"
        description={
          <span className="text-justify block">
            {blockedDialog.message}
            {blockedDialog.issues.length > 0 && (
              <ul className="mt-2 list-disc list-inside">
                {blockedDialog.issues.map((issue, i) => (
                  <li key={i}><strong>{issue}</strong></li>
                ))}
              </ul>
            )}
          </span>
        }
        cancelLabel="Close"
        confirmLabel="Okay"
      />


      {/* Barangay Form Dialog (Register only) */}
      <Dialog open={barangayFormDialog.open}>
        <DialogContent className="overflow-y-auto [&>button]:hidden p-0 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] min-w-80 md:min-w-180 max-h-150">
          <DialogHeader>
            <div className="flex gap-3 p-4 py-3 md:p-5 md:py-5">
              <div className="flex-shrink-0 self-start rounded-lg p-2 md:p-2.5 text-white bg-[#1565BC] mt-1.5 md:mt-0.5">
                <MapPinPlus className="md:h-7.5 md:w-7.5" />
              </div>
              <div className="flex flex-col ">
                <p className="font-bold text-base md:text-lg">Add Barangay</p>
                <p className="text-[10px] md:text-sm">
                  Register a new Barangay under AGOS <br className="md:hidden" /> monitoring coverage
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
                    <MapPin className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5" />
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
                        const found = allBarangays.find(b => b.barangay_name === value)
                        if (found) {
                          setLatitude(String(found.latitude))
                          setLongitude(String(found.longitude))
                        }
                        if (fieldErrors.barangay) setFieldErrors(prev => ({ ...prev, barangay: '' }))
                      }}
                    >
                      <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.barangay ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                        <SelectValue placeholder="Select Barangay..." />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                        {[...allBarangays]
                          .sort((a, b) => a.barangay_name.localeCompare(b.barangay_name))
                          .map(b => {
                            const isAdded = addedBarangayNames.has(b.barangay_name)
                            return (
                              <SelectItem
                                key={b.barangay_id}
                                value={b.barangay_name}
                                disabled={isAdded}
                                className={`p-1 md:p-2 ${isAdded ? 'opacity-40 cursor-not-allowed text-[#727272]' : 'text-[#122A48]'}`}
                              >
                                {b.barangay_name} {isAdded ? '— already registered' : ''}
                              </SelectItem>
                            )
                          })}
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
                    <Navigation className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xs md:text-base">Geographic Location</p>
                    <p className="text-[10px] md:text-xs text-[#727272]">Exact location is automatically filled in once a barangay is selected.</p>
                  </div>
                </div>

                {/* latitude & longitude — read-only display */}
                <div className="border-t border-[#C6C6C8] p-2.5 md:p-4">
                  <div className="flex gap-3 w-full -mt-3">
                    <div className="mt-3 flex-1">
                      <Field className="flex gap-1.5 flex-col">
                        <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LATITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                        <Input
                          type="text"
                          name="latitude"
                          value={latitude}
                          readOnly
                          placeholder="Auto-filled on selection"
                          className={`text-[#122A48] rounded-lg text-xs bg-[#F0F0F0] cursor-not-allowed !font-normal h- md:h-9 ${
                            fieldErrors.latitude ? 'border-[#FF0000]' : 'border-[#727272]'
                          }`}
                        />
                        <div className="flex justify-between items-center">
                          <FieldError className="text-xs">{fieldErrors.latitude}</FieldError>
                        </div>
                      </Field>
                    </div>
                    <div className="mt-3 flex-1">
                      <Field className="flex gap-1.5 flex-col">
                        <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LONGITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                        <Input
                          type="text"
                          name="longitude"
                          value={longitude}
                          readOnly
                          placeholder="Auto-filled on selection"
                          className={`text-[#122A48] rounded-lg text-xs bg-[#F0F0F0] cursor-not-allowed !font-normal h- md:h-9 ${
                            fieldErrors.longitude ? 'border-[#FF0000]' : 'border-[#727272]'
                          }`}
                        />
                        <div className="flex justify-between items-center">
                          <FieldError className="text-xs">{fieldErrors.longitude}</FieldError>
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Map preview - view only */}
                <div className="p-2.5 md:p-3 -mt-4">
                  <div className="rounded-lg bg-[#726D7814] border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                    <div className="p-2.5 md:p-3">
                      <p className="font-semibold text-xs md:text-sm">Map Preview</p>
                      <p className="text-[10px] text-[#727272] mt-0.5">
                        Shows the location of the selected barangay.
                      </p>
                    </div>
                    <div className="h-70 md:h-110 border-t border-[#C6C6C8] rounded-b-lg overflow-hidden">
                      <AgosMapWrapper
                        latitude={latitude ? parseFloat(latitude) : undefined}
                        longitude={longitude ? parseFloat(longitude) : undefined}
                        label={barangay}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* buttons */}
            <div className="flex gap-3 justify-end p-4 -mt-5">
              <Button
                type="button"
                onClick={() => setCancelDialog({ open: true })}
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
                Add Barangay
              </Button>

            </div>
          </form>

        </DialogContent>
      </Dialog>

      {/* Dialog for form */}

      {/* cancel dialog */}
      <DialogModal
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false })}
        onConfirm={handleCancel}
        color={DIALOG_COLOR.lightred}
        icon={X}
        iconColor={DIALOG_COLOR.red}
        title="Cancel Adding Barangay"
        description="Are you sure you want to cancel register barangay?"
        cancelLabel='Keep Editing'
        confirmLabel='Yes, Cancel'
      />

      {/* confirm dialog */}
      <DialogModal
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        onConfirm={handleSubmit}
        color={DIALOG_COLOR.lightgreen}
        icon={MapPinPlus}
        iconColor={DIALOG_COLOR.green}
        title='Confirm Adding Barangay'
        description={
          <>
            Are you sure you want to register this new barangay?
          </>
        }
        cancelLabel='Keep Editing'
        confirmLabel='Add Barangay'
      />

      {/* loading state */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title="Saving Barangay"
        description="Processing barangay details. Please wait."
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}