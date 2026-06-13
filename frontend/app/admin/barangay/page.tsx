"use client"

// icons
import { FaSearch } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"
import { MapPinned, CheckCircle, BadgeCheck, Map, UserRound, SquarePen, X, MapPinPlus, MapPin, Navigation, MapPinPen, Check, MapPinOff  } from "lucide-react";

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

const ROSARIO_BARANGAYS: Record<string, { latitude: number; longitude: number }> = {
  "Alipang":          { latitude: 16.237563348508555, longitude: 120.48637936638994 },
  "Ambangonan":       { latitude: 16.292460715471893, longitude: 120.47254696630522 },
  "Amlang":           { latitude: 16.232497453085085, longitude: 120.43466542161482 },
  "Bacani":           { latitude: 16.227960590897286, longitude: 120.45908781096342 },
  "Bangar":           { latitude: 16.233168462097932, longitude: 120.50676904750539 },
  "Bani":             { latitude: 16.228692313942197, longitude: 120.40806646632088 },
  "Barangay 33":      { latitude: 16.244843676617254, longitude: 120.5047149069639  },
  "Benteng-Sapilang": { latitude: 16.21819520751035,  longitude: 120.43736327943758 },
  "Cadumanian":       { latitude: 16.26039269741374,  longitude: 120.46787713615653 },
  "Camp One":         { latitude: 16.22577927235166,  longitude: 120.50505399696874 },
  "Carunuan East":    { latitude: 16.255406250860535, longitude: 120.45979379191249 },
  "Carunuan West":    { latitude: 16.24926800248152,  longitude: 120.4470866964297  },
  "Casilagan":        { latitude: 16.246289176295925, longitude: 120.48937441464953 },
  "Cataguingtingan":  { latitude: 16.218856437099763, longitude: 120.45488956809203 },
  "Concepcion":       { latitude: 16.223520531758066, longitude: 120.47094021121745 },
  "Damortis":         { latitude: 16.235333285005968, longitude: 120.40821970123413 },
  "Gumot-Nagcolaran": { latitude: 16.20972828736014,  longitude: 120.44126290490958 },
  "Inabaan Norte":    { latitude: 16.27935310104418,  longitude: 120.46937538164347 },
  "Inabaan Sur":      { latitude: 16.261125995284832, longitude: 120.48248267944999 },
  "Macabiag":         { latitude: 16.22500368189042,  longitude: 120.42614432607613 },
  "Nagtagaan":        { latitude: 16.231960515743467, longitude: 120.42077254190475 },
  "Nangcamotian":     { latitude: 16.21566034042685,  longitude: 120.49918352512054 },
  "Parasapas":        { latitude: 16.282538433938228, longitude: 120.44915952159705 },
  "Poblacion East":   { latitude: 16.23031273833657,  longitude: 120.48632076236241 },
  "Poblacion West":   { latitude: 16.227638647861806, longitude: 120.48095231205696 },
  "Puzon":            { latitude: 16.20926183980217,  longitude: 120.48274297369922 },
  "Rabon":            { latitude: 16.210217097047543, longitude: 120.4230186691575  },
  "San Jose":         { latitude: 16.277599265755292, longitude: 120.48246615780911 },
  "Subusub":          { latitude: 16.22859926246851,  longitude: 120.49339297539025 },
  "Tabtabungao":      { latitude: 16.21304287483186,  longitude: 120.46884813326288 },
  "Tay-ac":           { latitude: 16.219891888227306, longitude: 120.4916033586235  },
  "Udiao":            { latitude: 16.217334096835422, longitude: 120.50315253374364 },
  "Vila":             { latitude: 16.242923828018533, longitude: 120.46385169704709 },
}

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
  const {toasts, addToast, removeToast } = useToast()

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

  const addedBarangayNames = new Set(barangays.map(b => b.barangay_name))

  const isEdit = !!barangayFormDialog.barangay

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
      console.log('all barangays:', all)
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
    if (barangayFormDialog.barangay) {
      setBarangay(barangayFormDialog.barangay.barangay_name)
      setLatitude(String(barangayFormDialog.barangay.latitude))
      setLongitude(String(barangayFormDialog.barangay.longitude))
    } else {
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
  const registered   = allBarangays.filter(b => b.is_registered).length
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
    if (!barangay.trim())        errors.barangay         = 'This field is required.'
    if (!latitude.trim())        errors.latitude         = 'This field is required.'
    if (!longitude.trim())     errors.longitude      = 'This field is required.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setConfirmDialog({ open: true })
  }

  const handleCancel = () => {
    setCancelDialog({ open: false})
    setBarangayFormDialog({ open: false, barangay: null})
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

      if (isEdit) {
        const id = barangayFormDialog.barangay!.barangay_id
        const updated = await api.patch(`/api/barangays/${id}/`, payload, token ?? undefined)
        setBarangays(prev =>
          prev.map(b => b.barangay_id === id ? { ...b, ...updated } : b)
        )
      } else {
        const created = await api.post('/api/barangays/', payload, token ?? undefined)
        setBarangays(prev => [created, ...prev])
      }

      setBarangayFormDialog({ open: false, barangay: null })
      addToast(isEdit ? `${barangay} has been updated.` : `${barangay} has been added.`, 'success')

    } catch (err: any) {
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

            {/* register barangay */}
            <Button
              onClick={() => setBarangayFormDialog({ open: true, barangay: null})}
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Register Barangay
            </Button>

          </div>
        </div>

        {/* total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {[
            { icon: <MapPinned size={20} color="#1565BC" />, bg: "bg-[#CDE3DE]", count: total, label: "Total Barangay"   },
            { icon: <CheckCircle size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: registered,   label: "All Registered"     },
            { icon: <MapPinOff size={20} color="#FF0101" />,  bg: "bg-[#FFE5E5]", count: unregistered, label: "All Unregistered"   },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-105 flex items-center p-6 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
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
                        <Button
                          onClick={() => setViewMapDialog({ open: true, barangay: barangay })}
                          className="rounded-lg text-[#2C7B3C] border border-[#C6C6C8] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] py-4.5 px-3"
                        >
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
            onClick={() => setBarangayFormDialog({ open: true, barangay: null })}
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
                        <Map size={16}/> View on <br /> map
                      </Button>
                      <Button
                        onClick={() => setBarangayFormDialog({ open: true, barangay: barangay })}
                        className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] h-11 w-23 text-xs"
                      >
                        <SquarePen size={16} /> Edit
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


      {/* Brangay Form Dialog */}
      <Dialog open={barangayFormDialog.open}>
        <DialogContent className="overflow-y-auto [&>button]:hidden p-0 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] min-w-80 md:min-w-180 max-h-150">
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
                                const isCurrentlyEditing = isEdit && barangayFormDialog.barangay?.barangay_name === b.barangay_name
                                const disabled = isAdded && !isCurrentlyEditing
                                return (
                                  <SelectItem
                                    key={b.barangay_id}
                                    value={b.barangay_name}
                                    disabled={disabled}
                                    className={`p-1 md:p-2 ${disabled ? 'opacity-40 cursor-not-allowed text-[#727272]' : 'text-[#122A48]'}`}
                                  >
                                    {b.barangay_name} {disabled ? '— already added' : ''}
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
                      <Navigation className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5"/>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-xs md:text-base">Geographic Location</p>
                      <p className="text-[10px] md:text-xs text-[#727272]">Enter the latitude and longitude coordinates of the barangay hall.</p>
                    </div>
                  </div>

                  {/* latitude & longitude inputs */}
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
                          <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LONGITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                            <Input
                              type="number"
                              name="longitude"
                              value={longitude}
                              onChange={(e) => {
                                setLongitude(e.target.value)
                              }}
                              placeholder="e.g. 10.000000000000000"
                              className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h- md:h-9 bg-[#1565BC05] ${
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
                  
                  {/* Map preview */}
                  <div className="p-2.5 md:p-3 -mt-4">
                    <div className="rounded-lg bg-[#726D7814] border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                      <div className="p-2.5 md:p-3">
                        <p className="font-semibold text-xs md:text-sm">Map Preview</p>
                        <p className="text-[10px] text-[#727272] mt-0.5">
                          Click anywhere on the map to set coordinates.
                        </p>
                      </div>
                      <div className="h-70 md:h-110 border-t border-[#C6C6C8] rounded-b-lg overflow-hidden">
                        <AgosMapWrapper
                          latitude={latitude ? parseFloat(latitude) : undefined}
                          longitude={longitude ? parseFloat(longitude) : undefined}
                          label={barangay}
                          onMapClick={(lat, lng) => {
                            setLatitude(lat.toFixed(15))
                            setLongitude(lng.toFixed(15))
                          }}
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
