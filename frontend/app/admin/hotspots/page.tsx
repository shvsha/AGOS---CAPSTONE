"use client"

// icons
import { FaPlus } from "react-icons/fa"
import { Target, Map, SquarePen, Trash2, X, Check, Navigation, MapPin, MapPinPlus, MapPinPen, CircleOff, MapPinCheck  } from "lucide-react"

// react
import { useState, useEffect, useCallback, useRef } from "react"


// shadcn
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"

// components
import { SearchFilter } from "@/components/SearchFilter"
import { TablePagination } from "@/components/TablePagination"
import { usePagination } from "@/components/hooks/usePagination"
import AgosMapWrapper from "@/components/Map/AgosMapWrapper"
import { DialogModal } from "@/components/DialogModal"
import { SpinnerIcon } from "@/components/SpinnerIcon"

// toast
import { useToast } from "@/components/hooks/useToast"
import { Toast } from "@/components/Toast"

// lib
import { DIALOG_COLOR } from "@/lib/constant"
import { api } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

// turf for point-in-polygon check
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
import { point, feature } from "@turf/helpers"


type Barangay = {
  barangay_id: number
  barangay_name: string
  latitude: number
  longitude: number
}

type Hotspot = {
  hotspot_id: number
  barangay_details: { barangay_id: number; barangay_name: string } | null
  name: string
  description: string
  latitude: number
  longitude: number
  canal_width: number | null
  canal_shape: string | null
  sensor_height: number | null 
  is_occupied: boolean
  created_at: string
}

type SensorNode = {
  node_id: number
  node_name: string
  latitude: number | null
  longitude: number | null
  status: string
  condition: string | null
  hotspot_details: {
    hotspot_id: number
    name: string
    latitude: number
    longitude: number
  } | null
}

type DialogState = {
  open: boolean
  hotspot?: Hotspot | null
}


let boundaryDataCache: any = null
let boundaryDataPromise: Promise<any> | null = null

async function loadBoundaryData(): Promise<any | null> {
  if (boundaryDataCache) return boundaryDataCache
  if (boundaryDataPromise) return boundaryDataPromise

  boundaryDataPromise = fetch("/data/rosario-barangays.json")
    .then(res => {
      if (!res.ok) throw new Error()
      return res.json()
    })
    .then(data => {
      boundaryDataCache = data
      return data
    })
    .catch(() => null)

  return boundaryDataPromise
}

async function fetchBarangayBoundary(barangayName: string): Promise<any | null> {
  const data = await loadBoundaryData()
  if (!data) return null

  const feature = data.features.find(
    (f: any) => f.properties.adm4_en === barangayName
  )
  return feature ?? null
}


export default function HotspotManagement() {
  // data
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])
  const [allNodes, setAllNodes] = useState<SensorNode[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  // filters
  const [search, setSearch] = useState("")
  const [filterBarangay, setFilterBarangay] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")

  // form state
  const [barangay, setBarangay] = useState("")
  const [hotspotName, setHotspotName] = useState("")
  const [description, setDescription] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [canalWidth, setCanalWidth] = useState("")
  const [canalShape, setCanalShape] = useState("rectangular")
  const [sensorHeight, setSensorHeight] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // boundary state
  const [boundaryGeoJson, setBoundaryGeoJson] = useState<any>(null)
  const [boundaryLoading, setBoundaryLoading] = useState(false)
  const [boundaryFallback, setBoundaryFallback] = useState(false) 

  // dialogs
  const [formDialog, setFormDialog] = useState<DialogState>({ open: false, hotspot: null })
  const [viewMapDialog, setViewMapDialog] = useState<DialogState>({ open: false, hotspot: null })
  const [confirmDialog, setConfirmDialog] = useState<DialogState>({ open: false })
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean }>({ open: false })
  const [loadingDialog, setLoadingDialog] = useState<{ open: boolean }>({ open: false })
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({ open: false, hotspot: null })
  const [blockedDialog, setBlockedDialog] = useState<{ open: boolean }>({ open: false })

  const { toasts, addToast, removeToast } = useToast()

  const isEdit = !!formDialog.hotspot

  const filtered = hotspots
    .filter(h => filterBarangay === "All" || String(h.barangay_details?.barangay_id) === filterBarangay)
    .filter(h => filterStatus === "All" || (filterStatus === "Available" ? !h.is_occupied : h.is_occupied))
    .filter(h =>
      [h.name, h.barangay_details?.barangay_name, h.description]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => b.hotspot_id - a.hotspot_id)

  const barangayRef = useRef<HTMLDivElement>(null)
  const hotspotNameRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const canalWidthRef = useRef<HTMLDivElement>(null)
  const sensorHeightRef = useRef<HTMLDivElement>(null)
  const latitudeRef = useRef<HTMLDivElement>(null)

  const allHotspotMarkers = hotspots.map(h => {
    const assignedNode = allNodes.find(n => n.hotspot_details?.hotspot_id === h.hotspot_id)
    if (assignedNode) {
      return {
        latitude: h.latitude,
        longitude: h.longitude,
        label: assignedNode.node_name || `Node ${assignedNode.node_id}`,
        condition: assignedNode.condition ?? "Normal",
        sublabel: `Hotspot: ${h.name}`,
      }
    }
    return {
      latitude: h.latitude,
      longitude: h.longitude,
      label: h.name,
      condition: "default",
      sublabel: "Available hotspot",
    }
  })

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 6)

  const total = hotspots.length
  const occupied = hotspots.filter(h => h.is_occupied).length
  const available = hotspots.filter(h => !h.is_occupied).length

  // fetch data
  const fetchData = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const [hotspotRes, barangayRes, nodeRes] = await Promise.all([
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/hotspots/`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangays/`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`),
      ])
      if (!hotspotRes.ok || !barangayRes.ok || !nodeRes.ok) throw new Error()
      const [hotspotData, barangayData, nodeData] = await Promise.all([
        hotspotRes.json(), barangayRes.json(), nodeRes.json()
      ])
      setHotspots(hotspotData.results ?? hotspotData)
      setAllBarangays(barangayData.results ?? barangayData)
      setAllNodes(nodeData.results ?? nodeData)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (formDialog.open) {
      if (formDialog.hotspot) {
        // edit
        setBarangay(String(formDialog.hotspot.barangay_details?.barangay_id ?? ""))
        setHotspotName(formDialog.hotspot.name)
        setDescription(formDialog.hotspot.description ?? "")
        setLatitude(String(formDialog.hotspot.latitude))
        setLongitude(String(formDialog.hotspot.longitude))
        setCanalWidth(String(formDialog.hotspot.canal_width ?? ""))
        setCanalShape(formDialog.hotspot.canal_shape ?? "rectangular")
        setSensorHeight(String(formDialog.hotspot.sensor_height ?? ""))
        // load boundary for prefilled barangay
        if (formDialog.hotspot.barangay_details?.barangay_name) {
          loadBoundary(formDialog.hotspot.barangay_details.barangay_name)
        }
      }
    } else {
      setBarangay("")
      setHotspotName("")
      setDescription("")
      setLatitude("")
      setLongitude("")
      setCanalWidth("")
      setCanalShape("rectangular")
      setSensorHeight("")
      setFieldErrors({})
      setBoundaryGeoJson(null)
      setBoundaryFallback(false)
    }
  }, [formDialog.open])


  // Boundary fetch on barangay select
  const loadBoundary = useCallback(async (barangayName: string) => {
    setBoundaryLoading(true)
    setBoundaryGeoJson(null)
    setBoundaryFallback(false)
    const geoJson = await fetchBarangayBoundary(barangayName)
    if (geoJson) {
      setBoundaryGeoJson(geoJson)
      setBoundaryFallback(false)
    } else {
      setBoundaryFallback(true)
    }
    setBoundaryLoading(false)
  }, [])

  const nodeMarkers = allNodes
    .filter(n => n.latitude && n.longitude)
    .map(n => ({
      latitude: n.latitude!,
      longitude: n.longitude!,
      label: n.node_name || `Node ${n.node_id}`,
      condition: n.condition ?? "Normal",
    }))

  const viewMapNodeMarkers = allNodes
    .filter(n => 
      n.latitude && 
      n.longitude && 
      n.hotspot_details?.hotspot_id === viewMapDialog.hotspot?.hotspot_id
    )
    .map(n => ({
      latitude: n.latitude!,
      longitude: n.longitude!,
      label: n.node_name || `Node ${n.node_id}`,
      condition: n.condition ?? "Normal",
    }))


  // handlers
  const handleBarangaySelect = (value: string) => {
    setBarangay(value)
    setLatitude("")
    setLongitude("")
    if (fieldErrors.barangay) setFieldErrors(prev => ({ ...prev, barangay: "" }))

    const selected = allBarangays.find(b => String(b.barangay_id) === value)
    if (selected) loadBoundary(selected.barangay_name)
  }

  // Map click handler
  const handleMapClick = (lat: number, lng: number) => {
    if (!barangay) {
      addToast("Please select a barangay first.", "error")
      return
    }

    if (boundaryGeoJson && !boundaryFallback) {
      const clickedPoint = point([lng, lat])
      const inside = booleanPointInPolygon(clickedPoint, boundaryGeoJson)
      if (!inside) {
        addToast("That location is outside the selected barangay boundary. Please click inside the highlighted area.", "error")
        return
      }
    }

    setLatitude(String(lat))
    setLongitude(String(lng))
    if (fieldErrors.latitude) setFieldErrors(prev => ({ ...prev, latitude: "", longitude: "" }))
  }

  // validation handlers
  const handleConfirmationDialog = () => {
    const errors: Record<string, string> = {}
    if (!barangay) errors.barangay = "This field is required."
    if (!hotspotName.trim()) errors.hotspotName = "This field is required."
    if (!description.trim()) errors.description = "This field is required."
    if (!latitude) errors.latitude = "Please click on the map to set the location."
    if (!longitude) errors.longitude = "Please click on the map to set the location."
    if (!canalWidth) errors.canalWidth = "This field is required."
    if (!canalShape) errors.canalShape = "This field is required."
    if (!sensorHeight) errors.sensorHeight = "This field is required."

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      // scroll to first error
      if (errors.barangay) {
        barangayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.hotspotName) {
        hotspotNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.description) {
        descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.canalWidth) {
        canalWidthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.sensorHeight) {
        sensorHeightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.latitude || errors.longitude) {
        latitudeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setConfirmDialog({ open: true })
  }

  const handleCancel = () => {
    setCancelDialog({ open: false })
    setFormDialog({ open: false, hotspot: null })
  }

  const handleSubmit = async () => {
    setConfirmDialog({ open: false })
    setLoadingDialog({ open: true })

    const payload = {
      barangay: parseInt(barangay),
      name: hotspotName.trim(),
      description: description.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      canal_width: canalWidth ? parseFloat(canalWidth) : null,
      canal_shape: canalShape,
      sensor_height: sensorHeight ? parseFloat(sensorHeight) : null,
    }

    try {
      if (isEdit) {
        const updated = await api.patch(`/api/hotspots/${formDialog.hotspot!.hotspot_id}/`, payload)
        setHotspots(prev => prev.map(h => h.hotspot_id === formDialog.hotspot!.hotspot_id ? { ...h, ...updated } : h))
        addToast(`${hotspotName} has been updated.`, "success")
      } else {
        const created = await api.post("/api/hotspots/", payload)
        setHotspots(prev => [created, ...prev])
        addToast(`${hotspotName} has been added.`, "success")
      }
      setFormDialog({ open: false, hotspot: null })
    } catch (err: any) {
      if (err && typeof err === "object") {
        const backendErrors: Record<string, string> = {}
        for (const key in err) {
          backendErrors[key] = Array.isArray(err[key]) ? err[key][0] : err[key]
        }
        setFieldErrors(backendErrors)
        setFormDialog(prev => ({ ...prev })) // keep dialog open
      }
      addToast(err?.detail ?? err?.name ?? "Something went wrong.", "error")
    } finally {
      setLoadingDialog({ open: false })
    }
  }

  const handleDeleteClick = (hotspot: Hotspot) => {
    if (hotspot.is_occupied) {
      setBlockedDialog({ open: true })
      return
    }
    setDeleteDialog({ open: true, hotspot })
  }

  const handleDelete = async () => {
    const h = deleteDialog.hotspot
    if (!h) return
    setDeleteDialog({ open: false, hotspot: null })
    try {
      await api.delete(`/api/hotspots/${h.hotspot_id}/`)
      setHotspots(prev => prev.filter(x => x.hotspot_id !== h.hotspot_id))
      addToast(`${h.name} has been remove.`, "success")
    } catch (err: any) {
      addToast(err?.detail ?? "Failed to remove hotspot.", "error")
    }
  }

  // selected barangay object for map center fallback
  const selectedBarangay = allBarangays.find(b => String(b.barangay_id) === barangay)


  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* Header */}
        <div className="flex justify-between w-full mb-4">
          <div className="font-bold text-[#122A48] flex justify-center items-center ">
            <p className="text-[15px]">Canal Hotspots</p>
          </div>
          <div className="flex gap-3">
            <SearchFilter value={search} onChange={setSearch} placeholder="Search hotspot..." width="w-60" height="h-9" />

            <Select value={filterBarangay} onValueChange={setFilterBarangay}>
              <SelectTrigger className="w-40 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                <SelectItem value="All">All Barangays</SelectItem>
                {[...allBarangays].sort((a, b) => a.barangay_name.localeCompare(b.barangay_name)).map(b => (
                  <SelectItem key={b.barangay_id} value={String(b.barangay_id)}>{b.barangay_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-34 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setFormDialog({ open: true, hotspot: null })}
              className="p-5 py-4 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white"/> Add Hotspot
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="flex justify-between w-full text-[#122A48] -mt-1">
          {[
            { icon: <Target size={20} color="#1565BC" />, bg: "bg-[#CDE3DE]", count: total, label: "Total Hotspots" },
            { icon: <MapPinCheck size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: available, label: "Available" },
            { icon: <MapPin size={20} color="#1565BC" />, bg: "bg-[#DBEAFE]", count: occupied, label: "Occupied" },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-17 w-105 flex items-center p-3 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight">{card.count}</span>
                <p className="text-xs  text-[#122A48]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex gap-4 mt-3 h-120">
          <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col">
            <p className="p-2 px-3 text-sm font-bold text-[#122A48]">Hotspot List</p>

            <Table>
              <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
                <TableRow>
                  <TableHead className="font-semibold text-center text-xs text-[#727272]">ID</TableHead>
                  <TableHead className="font-semibold text-center text-xs text-[#727272]">BARANGAY</TableHead>
                  <TableHead className="font-semibold text-center text-xs text-[#727272]">HOTSPOT NAME</TableHead>
                  <TableHead className="font-semibold text-center text-xs text-[#727272]">DESCRIPTION</TableHead>
                  <TableHead className="font-semibold text-center text-xs text-[#727272]">STATUS</TableHead>
                  <TableHead className="font-semibold text-center text-xs text-[#727272]">LOCATION</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {fetchError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-15">
                      <div className="flex flex-col justify-center items-center gap-3 py-20">
                        <p className="text-[#D81010] font-semibold text-base">Failed to load hotspots. Please try again later.</p>
                        <Button onClick={fetchHotspots} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                      </div>
                    </TableCell>
                  </TableRow>

                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-15">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <Target size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No hotspots found</p>
                        <p className="text-[#727272] text-sm">
                          No canal hotspots have been added yet.
                          <> Click the button above to add one.</>
                        </p>
                        <Button
                          onClick={() => setFormDialog({ open: true, hotspot: null })}
                          className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                        >
                          + Add Hotspot
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                ) : (
                  paginated.map(hotspot => (
                    <TableRow key={hotspot.hotspot_id} className="border-b border-[#C6C6C8] text-xs">
                      <TableCell className="text-[#122A48] text-center h-14">{hotspot.hotspot_id}</TableCell>
                      <TableCell className="text-[#122A48] text-center h-14">{hotspot.barangay_details?.barangay_name}</TableCell>
                      <TableCell className="text-[#122A48] text-center h-14 font-medium">{hotspot.name}</TableCell>
                      <TableCell className="text-[#727272] text-center h-14 text-xs max-w-48 truncate">
                        {hotspot.description || "—"}
                      </TableCell>

                      <TableCell className="text-center h-14.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          hotspot.is_occupied
                            ? "bg-[#DBEAFE] text-[#1565BC]"
                            : "bg-[#B2FBC173] text-[#2C7B3C]"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hotspot.is_occupied ? "bg-[#1565BC]" : "bg-[#2C7B3C]"}`} />
                          {hotspot.is_occupied ? "Occupied" : "Available"}
                        </span>
                      </TableCell>

                      <TableCell className="text-[#122A48] text-center h-14">
                        <Button
                          onClick={() => setViewMapDialog({ open: true, hotspot })}
                          className="rounded-lg text-xs text-[#2C7B3C] border border-[#C6C6C8] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] py-3 px-3"
                        >
                          <Map size={16} /> View on map
                        </Button>
                      </TableCell>

                      <TableCell className="text-[#122A48] flex gap-3 justify-center items-center h-14">
                        <Button
                          onClick={() => setFormDialog({ open: true, hotspot })}
                          className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] py-3 text-xs px-3"
                        >
                          <SquarePen size={16} /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(hotspot)}
                          className="flex gap-2 text-[#D81010] rounded-lg bg-[#FFE5E5] hover:bg-[#dfc6c6] cursor-pointer border border-[#C6C6C8] py-3 text-xs px-3"
                        >
                          <Trash2 size={16} /> Remove
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
      </div>

      {/* crud dialog */}
      <Dialog open={formDialog.open}>
        <DialogContent className="overflow-y-auto [&>button]:hidden p-0 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] min-w-80 md:min-w-180 max-h-150">
          <DialogHeader>
            <div className="flex gap-3 p-4 py-3 md:p-5 md:py-5">
              <div className={`flex-shrink-0 self-start rounded-lg p-2 md:p-2.5 text-white ${isEdit ? "bg-[#FF9705] mt-0.5" : "bg-[#1565BC] mt-1.5 md:mt-0.5"}`}>
                {isEdit ? <MapPinPen className="md:h-7.5 md:w-7.5" /> : <MapPinPlus className="md:h-7.5 md:w-7.5" />}
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-base md:text-lg">{isEdit ? formDialog.hotspot?.name ?? "Edit Hotspot" : "Add Hotspot"}</p>
                <p className="text-[10px] md:text-sm">
                  {isEdit ? "Rosario, La Union" : "Register a new canal hotspot under AGOS monitoring coverage"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <DialogTitle className="sr-only">{isEdit ? "Edit Hotspot" : "Add Hotspot"}</DialogTitle>

          <form>
            {/* Hotspot Information */}
            <div className="border-t border-[#C6C6C8] p-4 md:p-5 -mt-3">
              <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                  <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2">
                    <MapPin className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xs md:text-base">Hotspot Information</p>
                    <p className="text-[10px] md:text-xs text-[#727272]">Basic identity details of the canal hotspot</p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-[#C6C6C8] p-2.5 md:p-4">
                  {/* Barangay select */}
                  <div ref={barangayRef} className="flex-1">
                    <Field className="flex gap-1.5 flex-col flex-1">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        BARANGAY <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                      <Select value={barangay} onValueChange={handleBarangaySelect}>
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.barangay ? "border-[#FF0000]" : "border-[#727272]"}`}>
                          <SelectValue placeholder="Select Barangay..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {[...allBarangays]
                            .sort((a, b) => a.barangay_name.localeCompare(b.barangay_name))
                            .map(b => (
                              <SelectItem key={b.barangay_id} value={String(b.barangay_id)} className="p-1 md:p-2 text-[#122A48]">
                                {b.barangay_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FieldError className="text-xs">{fieldErrors.barangay}</FieldError>
                    </Field>
                  </div>

                  {/* Hotspot name */}
                  <div ref={hotspotNameRef} className="flex-1">
                    <Field className="flex gap-1.5 flex-col flex-1">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        HOTSPOT NAME <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                      <Input
                        type="text"
                        value={hotspotName}
                        onChange={e => {
                          setHotspotName(e.target.value)
                          if (fieldErrors.hotspotName) setFieldErrors(prev => ({ ...prev, hotspotName: "" }))
                        }}
                        placeholder="e.g. Canal Bridge near Purok 3"
                        className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal md:h-10.5 bg-[#1565BC05] ${fieldErrors.hotspotName ? "border-[#FF0000]" : "border-[#727272]"}`}
                      />
                      <FieldError className="text-xs">{fieldErrors.hotspotName}</FieldError>
                    </Field>
                  </div>
                </div>

                {/* Description */}
                <div className="p-2.5 md:p-4 -mt-3">
                  <div ref={descriptionRef}>
                    <Field className="flex gap-1.5 flex-col">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">DESCRIPTION <span className="text-[#FF0000]">*</span></FieldLabel>
                      <textarea
                        value={description}
                        onChange={e => {
                          setDescription(e.target.value)
                          if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: "" }))
                        }}
                        rows={1}
                        placeholder="Brief description or landmark of this hotspot location e.g. (Near Tsongsan)..."
                        className={`w-full text-[#122A48] rounded-lg text-sm border bg-[#1565BC05] px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1565BC40] ${
                          fieldErrors.description ? "border-[#FF0000]" : "border-[#727272]"
                        }`}
                      />
                      <FieldError className="text-xs">{fieldErrors.description}</FieldError>
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {/* Canal Properties */}
            <div className="p-4 md:p-5 -mt-7">
              <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                  <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2">
                    <Navigation className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xs md:text-base">Canal Properties</p>
                    <p className="text-[10px] md:text-xs text-[#727272]">
                      Physical dimensions of the canal at this hotspot. Measured once at installation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-[#C6C6C8] p-2.5 md:p-4">
                  {/* Canal Width */}
                  <div ref={canalWidthRef} className="flex-1">
                    <Field className="flex gap-1.5 flex-col flex-1">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        CANAL WIDTH (meters)
                      </FieldLabel>
                      <Input
                        type="number"
                        value={canalWidth}
                        onChange={e => {
                          setCanalWidth(e.target.value)
                          if (fieldErrors.canalWidth) setFieldErrors(prev => ({ ...prev, canalWidth: "" }))
                        }}
                        placeholder="e.g. 1.2"
                        className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal md:h-10.5 bg-[#1565BC05] ${fieldErrors.canalWidth ? "border-[#FF0000]" : "border-[#727272]"}`}
                      />
                      <FieldError className="text-xs">{fieldErrors.canalWidth}</FieldError>
                    </Field>
                  </div>

                  {/* Canal Shape */}
                  <div className="flex-1">
                    <Field className="flex gap-1.5 flex-col flex-1">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        CANAL SHAPE
                      </FieldLabel>
                      <Select value={canalShape} 
                      onValueChange={value => {
                        setCanalShape(value)
                          if (fieldErrors.canalShape) setFieldErrors(prev => ({ ...prev, canalShape: "" }))
                        }}
                      >
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.canalShape ? "border-[#FF0000]" : "border-[#727272]"}`}>
                          <SelectValue placeholder="Select shape..." />
                        </SelectTrigger>
                        <FieldError className="text-xs">{fieldErrors.canalShape}</FieldError>
                        <SelectContent position="popper">
                          <SelectItem value="rectangular">Rectangular</SelectItem>
                          <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                          <SelectItem value="Circle">Circle</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Sensor Height */}
                  <div ref={sensorHeightRef} className="flex-1">
                    <Field className="flex gap-1.5 flex-col flex-1">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        SENSOR HEIGHT (cm)
                      </FieldLabel>
                      <Input
                        type="number"
                        value={sensorHeight}
                        onChange={e => {
                          setSensorHeight(e.target.value)
                          if (fieldErrors.sensorHeight) setFieldErrors(prev => ({ ...prev, sensorHeight: "" }))
                        }}
                        placeholder="e.g. 150"
                        className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal md:h-10.5 bg-[#1565BC05] ${fieldErrors.sensorHeight ? "border-[#FF0000]" : "border-[#727272]"}`}
                      />
                      <FieldError className="text-xs">{fieldErrors.sensorHeight}</FieldError>
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic Location */}
            <div className="p-4 md:p-5 -mt-5 md:-mt-7">
              <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                  <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2 flex justify-center items-center mt-1 md:mt-0">
                    <Navigation className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xs md:text-base">Geographic Location</p>
                    <p className="text-[10px] md:text-xs text-[#727272]">
                      Select a barangay first. The map will zoom to the barangay and show its boundary.
                      Click <strong>inside the highlighted area</strong> to pin the hotspot location.
                      {boundaryFallback && (
                        <span className="text-[#FF9705]"> (No boundary data found for this barangay — click anywhere near the center.)</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Map */}
                <div className="p-2.5 md:p-3 -mt-4">
                  <div className="rounded-lg bg-[#726D7814] border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                    <div className="p-2.5 md:p-3">
                      <p className="font-semibold text-xs md:text-sm">Map Preview</p>
                      <p className="text-[10px] text-[#727272] mt-0.5">
                        {boundaryLoading
                          ? "Loading barangay boundary..."
                          : barangay
                            ? "Click inside the boundary to pin the hotspot."
                            : "Select a barangay to see its boundary on the map."}
                      </p>
                    </div>
                    <div className="h-70 md:h-110 border-t border-[#C6C6C8] rounded-b-lg overflow-hidden">
                      <AgosMapWrapper
                        latitude={latitude ? parseFloat(latitude) : selectedBarangay?.latitude}
                        longitude={longitude ? parseFloat(longitude) : selectedBarangay?.longitude}
                        label={latitude ? "Hotspot" : undefined}
                        zoom={latitude ? 16 : 15}
                        onMapClick={handleMapClick}
                        boundaryGeoJson={boundaryGeoJson}
                        showLegend={false}
                        markers={allHotspotMarkers}
                      />
                    </div>
                  </div>
                </div>

                {/* Lat / Lng */}
                <div className="border-t border-[#C6C6C8] p-2.5 md:p-4">
                  <div className="flex gap-3 w-full -mt-3">
                    <div className="mt-3 flex-1">
                      <Field className="flex gap-1.5 flex-col">
                        <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LATITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                        <Input
                          type="text"
                          value={latitude}
                          readOnly
                          placeholder="Auto-filled on map click"
                          className={`text-[#122A48] rounded-lg text-xs bg-[#F0F0F0] cursor-not-allowed !font-normal md:h-9 ${fieldErrors.latitude ? "border-[#FF0000]" : "border-[#727272]"}`}
                        />
                        <FieldError className="text-xs">{fieldErrors.latitude}</FieldError>
                      </Field>
                    </div>
                    <div className="mt-3 flex-1">
                      <Field className="flex gap-1.5 flex-col">
                        <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LONGITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                        <Input
                          type="text"
                          value={longitude}
                          readOnly
                          placeholder="Auto-filled on map click"
                          className={`text-[#122A48] rounded-lg text-xs bg-[#F0F0F0] cursor-not-allowed !font-normal md:h-9 ${fieldErrors.longitude ? "border-[#FF0000]" : "border-[#727272]"}`}
                        />
                        <FieldError className="text-xs">{fieldErrors.longitude}</FieldError>
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
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
                {isEdit ? "Save Changes" : "Add Hotspot"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Map Dialog */}
      <Dialog open={viewMapDialog.open}>
        <DialogContent className="[&>button]:hidden p-4 md:p-6 text-[#122A48] rounded-lg border border-[#C6C6C8] min-w-80 md:min-w-150">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <p className="font-bold text-base md:text-lg">{viewMapDialog.hotspot?.name}</p>
                <p className="text-xs text-[#727272]">{viewMapDialog.hotspot?.barangay_details?.barangay_name}</p>
              </div>
              <button className="cursor-pointer" onClick={() => setViewMapDialog({ open: false, hotspot: null })}>
                <X size={18} />
              </button>
            </div>
          </DialogHeader>
          <div className="h-100 md:h-[380px] rounded-b-lg w-70 md:w-140 overflow-hidden">
            <AgosMapWrapper
              latitude={viewMapDialog.hotspot?.latitude}
              longitude={viewMapDialog.hotspot?.longitude}
              label={viewMapDialog.hotspot?.name}
              zoom={16}
              showLegend={false}
              markers={allHotspotMarkers}
            />
          </div>
          <div className="border-t border-[#C6C6C8] flex justify-between py-3 -mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <p className="text-xs md:text-sm">{viewMapDialog.hotspot?.latitude}</p>
              <p className="text-xs md:text-sm">{viewMapDialog.hotspot?.longitude}</p>
            </div>
            <Button
              onClick={() => {
                const h = viewMapDialog.hotspot
                if (!h) return
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`, "_blank")
              }}
              className="cursor-pointer rounded-lg border border-[#C6C6C8] bg-[#FAFCFD] hover:bg-[#d6e4eb] px-3 py-2 md:px-4 md:py-3 text-[#727272]"
            >
              <Map /> Open in Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <DialogModal
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false })}
        onConfirm={handleCancel}
        color={isEdit ? DIALOG_COLOR.lightyellow : DIALOG_COLOR.lightred}
        icon={isEdit ? SquarePen : X}
        iconColor={isEdit ? DIALOG_COLOR.yellow : DIALOG_COLOR.red}
        title={isEdit ? "Cancel Changes" : "Cancel Adding Hotspot"}
        description={isEdit ? "You have unsaved changes that will be lost if you cancel." : "Are you sure you want to cancel adding this hotspot?"}
        cancelLabel="Keep Editing"
        confirmLabel="Yes, Cancel"
      />

      {/* Confirm dialog */}
      <DialogModal
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        onConfirm={handleSubmit}
        color={DIALOG_COLOR.lightgreen}
        icon={isEdit ? MapPinPen : MapPinPlus}
        iconColor={DIALOG_COLOR.green}
        title={isEdit ? "Confirm Changes" : "Confirm Adding Hotspot"}
        description={isEdit
          ? <> Are you sure you want to update <strong>{hotspotName}</strong>?</>
          : <> Are you sure you want to add this new hotspot?</>
        }
        cancelLabel="Keep Editing"
        confirmLabel={isEdit ? "Confirm Changes" : "Add Hotspot"}
      />

      {/* Loading dialog */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title={isEdit ? "Saving Changes" : "Saving Hotspot"}
        description={<>Processing hotspot details. Please wait.</>}
      />

      {/* Remove dialog */}
      <DialogModal
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, hotspot: null })}
        onConfirm={handleDelete}
        color={DIALOG_COLOR.lightred}
        icon={Trash2}
        iconColor={DIALOG_COLOR.red}
        title="Remove Hotspot"
        description={<>Are you sure you want to remove <strong>{deleteDialog.hotspot?.name}</strong>? This cannot be undone.</>}
        cancelLabel="Cancel"
        confirmLabel="Remove"
      />

      {/* Blocked dialog */}
      <DialogModal
        open={blockedDialog.open}
        onClose={() => setBlockedDialog({ open: false })}
        onConfirm={() => setBlockedDialog({ open: false })}
        color={DIALOG_COLOR.lightorange}
        icon={CircleOff}
        iconColor={DIALOG_COLOR.orange}
        title="Cannot Remove Hotspot"
        description="This hotspot is currently occupied by an active sensor node. Unassign the node first before removing this hotspot."
        cancelLabel="Close"
        confirmLabel="Okay"
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}
