"use client"

// icons
import { RadioTower, BadgeCheck, CircleOff, Map, SquarePen, MapPinPlus, MapPinPen, MapPin, Navigation, Check, X, Unplug } from "lucide-react"

// react
import { useState, useEffect, useRef } from "react"

// shadcn
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTitle, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"

// component
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
import { fetchWithAuth } from "@/lib/auth"
import { api } from "@/lib/api"

type SensorNode = {
  node_id: number
  barangay_details: { barangay_id: number; barangay_name: string } | null
  hotspot_details: { hotspot_id: number; name: string; latitude: number; longitude: number } | null
  node_name: string
  availability_status: string
  status: string
  installed_at: string
  condition: string | null
  water_level: number | null
  clog_pct: number | null
}

type AvailableNode = {
  node_id: number
  node_name: string
}

type Barangay = {
  barangay_id: number
  barangay_name: string
}

type Hotspot = {
  hotspot_id: number
  name: string
  latitude: number
  longitude: number
}

type DialogState = {
  open: boolean
  node?: SensorNode | null
}

export default function NodeAssignment() {
  const [assignedNodes, setAssignedNodes] = useState<SensorNode[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(true)

  // form state
  const [availableNodes, setAvailableNodes] = useState<AvailableNode[]>([])
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedNode, setSelectedNode] = useState('')
  const [barangay, setBarangay] = useState('')
  const [hotspot, setHotspot] = useState('')
  const [installedAt, setInstalledAt] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { toasts, addToast, removeToast } = useToast()

  const [assignFormDialog, setAssignFormDialog] = useState<DialogState>({ open: false, node: null })
  const [viewMapDialog, setViewMapDialog] = useState<DialogState>({ open: false, node: null })
  const [loadingDialog, setLoadingDialog] = useState<DialogState>({ open: false })
  const [confirmDialog, setConfirmDialog] = useState<DialogState>({ open: false })
  const [cancelDialog, setCancelDialog] = useState<DialogState>({ open: false })
  const [unassignDialog, setUnassignDialog] = useState<DialogState>({ open: false, node: null })

  const isEdit = !!assignFormDialog.node

  const selectedHotspot = hotspots.find(h => String(h.hotspot_id) === hotspot)

  const selectedNodeRef = useRef<HTMLDivElement>(null)
  const barangayRef = useRef<HTMLDivElement>(null)
  const hotspotRef = useRef<HTMLDivElement>(null)
  const installedAtRef = useRef<HTMLDivElement>(null)

  const filtered = assignedNodes
    .filter(n => statusFilter === 'All Status' || n.status === statusFilter)
    .filter(n =>
      [n.node_name, n.barangay_details?.barangay_name, n.hotspot_details?.name]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => b.node_id - a.node_id)

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  const total    = assignedNodes.length
  const active   = assignedNodes.filter(n => n.status === 'Active').length
  const inactive = assignedNodes.filter(n => n.status === 'Inactive').length

  const fetchAssignedNodes = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/?availability_status=Occupied`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAssignedNodes(data.results ?? data)
      setCurrentPage(1)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableNodes = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/?availability_status=Available`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAvailableNodes(data.results ?? data)
    } catch {}
  }

  useEffect(() => { fetchAssignedNodes() }, [statusFilter])

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangays/`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAllBarangays(data.results ?? data)
      } catch {}
    }
    fetchBarangays()
  }, [])

  // Fetch available nodes when form opens for create
  useEffect(() => {
    if (assignFormDialog.open && !assignFormDialog.node) fetchAvailableNodes()
  }, [assignFormDialog.open])

  // Populate form on edit, reset on create
  useEffect(() => {
    if (assignFormDialog.node) {
      setBarangay(String(assignFormDialog.node.barangay_details?.barangay_id ?? ''))
      setHotspot(String(assignFormDialog.node.hotspot_details?.hotspot_id ?? ''))
      setInstalledAt(
        assignFormDialog.node.installed_at
          ? new Date(assignFormDialog.node.installed_at).toISOString().split('T')[0]
          : ''
      )
    } else {
      setSelectedNode('')
      setBarangay('')
      setHotspot('')
      setInstalledAt('')
      setFieldErrors({})
    }
  }, [assignFormDialog.open])

  // Fetch available hotspots when barangay changes
  useEffect(() => {
    if (!barangay) { setHotspots([]); setHotspot(''); return }

    const fetchHotspots = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/hotspots/barangay/${barangay}/available/`
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        let spots: Hotspot[] = data.results ?? data

        // On edit, keep the current hotspot in the list even if occupied
        if (assignFormDialog.node?.hotspot_details) {
          const current = assignFormDialog.node.hotspot_details
          const alreadyIncluded = spots.some(h => h.hotspot_id === current.hotspot_id)
          if (!alreadyIncluded) {
            spots = [{ hotspot_id: current.hotspot_id, name: current.name, latitude: current.latitude, longitude: current.longitude }, ...spots]
          }
        }

        setHotspots(spots)
      } catch { setHotspots([]) }
    }
    fetchHotspots()
  }, [barangay])

  const resetForm = () => {
    setSelectedNode('')
    setBarangay('')
    setHotspot('')
    setInstalledAt('')
    setFieldErrors({})
  }

  const handleConfirmationDialog = () => {
    const errors: Record<string, string> = {}
    if (!isEdit && !selectedNode.trim()) errors.selectedNode = "This field is required."
    if (!barangay.trim()) errors.barangay = "This field is required."
    if (!hotspot.trim()) errors.hotspot = "This field is required."
    if (!installedAt.trim()) errors.installedAt = "This field is required."
    
    setFieldErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      // scroll to first error
      if (errors.selectedNode) {
        selectedNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.barangay) {
        barangayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.hotspot) {
        hotspotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.installedAt) {
        installedAtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setConfirmDialog({ open: true })
  }

  const handleCancel = () => {
    setCancelDialog({ open: false })
    setAssignFormDialog({ open: false, node: null })
    resetForm()
  }

  const handleSubmit = async () => {
    setConfirmDialog({ open: false })
    setLoadingDialog({ open: true })

    const payload = {
      barangay: parseInt(barangay),
      hotspot: parseInt(hotspot),
      installed_at: installedAt ? new Date(installedAt).toISOString() : undefined,
    }

    try {
      if (isEdit) {
        const updated = await api.patch(`/api/sensor-nodes/${assignFormDialog.node!.node_id}/`, payload)
        setAssignedNodes(prev => prev.map(n =>
          n.node_id === assignFormDialog.node!.node_id ? { ...n, ...updated } : n
        ))
        addToast(`${assignFormDialog.node!.node_name} assignment updated.`, 'success')
      } else {
        const updated = await api.patch(`/api/sensor-nodes/${selectedNode}/`, payload)
        setAssignedNodes(prev => [updated, ...prev])
        addToast('Node has been assigned successfully.', 'success')
      }
      setAssignFormDialog({ open: false, node: null })
      resetForm()
    } catch (err: any) {
      addToast(err?.detail ?? err?.error ?? 'Something went wrong.', 'error')
    } finally {
      setLoadingDialog({ open: false })
    }
  }

  const handleUnassign = async (node: SensorNode) => {
    setUnassignDialog({ open: false, node: null })
    try {
      await api.post(`/api/sensor-nodes/${node.node_id}/unassign/`, {})
      setAssignedNodes(prev => prev.filter(n => n.node_id !== node.node_id))
      addToast(`${node.node_name} has been unassigned.`, 'success')
    } catch (err: any) {
      addToast(err?.detail ?? 'Failed to unassign node.', 'error')
    }
  }

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* Header */}
        <div className="flex justify-between w-full mb-4">
          <div className="font-bold text-[#122A48] flex justify-center items-center text-lg">
            <p>Node Assignment</p>
          </div>
          <div className="flex gap-3">
            <SearchFilter value={search} onChange={setSearch} placeholder="Search assigned node..." width="w-60" height="h-11" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-36 min-w-0">
                <SelectItem className="p-2 text-[#122A48]" value="All Status">All Status</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Active">Active</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setAssignFormDialog({ open: true, node: null })}
              className="p-5 py-5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <MapPinPlus size={16} /> Assign Node
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="flex justify-between w-full text-[#122A48] mt-1">
          {[
            { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: total,    label: "Total Assigned" },
            { icon: <BadgeCheck size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: active,   label: "Active" },
            { icon: <CircleOff size={20} color="#D81010" />,  bg: "bg-[#FFE5E5]", count: inactive, label: "Inactive" },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-105 flex items-center p-6 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{card.count}</span>
                <p className="text-sm">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex gap-4 mt-3 h-108.5">
          <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col">
            <p className="p-3 font-bold text-[#122A48]">Assigned Canal Nodes</p>
            <Table>
              <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
                <TableRow>
                  <TableHead className="font-semibold text-center text-[#727272]">NODE</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">BARANGAY</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">NODE NAME</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">HOTSPOT</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">LOCATION</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">STATUS</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">INSTALLED</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-15">
                      <div className="flex flex-col justify-center items-center gap-3 py-20">
                        <p className="text-[#D81010] font-semibold text-base">Failed to load assignments. Please try again.</p>
                        <Button onClick={fetchAssignedNodes} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-15">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <RadioTower size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No nodes assigned yet</p>
                        <p className="text-[#727272] text-sm">Assign an available node to a canal hotspot.</p>
                        <Button
                          onClick={() => setAssignFormDialog({ open: true, node: null })}
                          className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                        >
                          + Assign Node
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map(node => (
                    <TableRow key={node.node_id} className="border-b border-[#C6C6C8]">
                      <TableCell className="text-[#122A48] text-center h-18">{node.node_id}</TableCell>
                      <TableCell className="text-[#122A48] text-center h-18">{node.barangay_details?.barangay_name ?? '—'}</TableCell>
                      <TableCell className="text-[#122A48] text-center h-18">{node.node_name}</TableCell>
                      <TableCell className="text-[#122A48] text-center h-18">{node.hotspot_details?.name ?? '—'}</TableCell>
                      <TableCell className="text-center h-18">
                        <Button
                          className="text-[#2C7B3C] bg-[#B2FBC173] hover:bg-[#9ae2a873] cursor-pointer"
                          onClick={() => setViewMapDialog({ open: true, node })}
                        >
                          <Map size={16} /> View on map
                        </Button>
                      </TableCell>
                      <TableCell className="text-center h-18">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${
                          node.status === 'Active' ? 'bg-[#B2FBC173] text-[#2C7B3C]' : 'bg-[#FFE5E5] text-[#D81010]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            node.status === 'Active' ? 'bg-[#1D8104]' : 'bg-[#BB2325]'
                          }`} />
                          {node.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#122A48] text-center h-18">
                        {node.installed_at
                          ? new Date(node.installed_at.replace(' ', 'T')).toLocaleDateString('en-PH', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-[#122A48] flex gap-2 justify-center items-center h-18">
                        <Button
                          onClick={() => setAssignFormDialog({ open: true, node })}
                          className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] py-4.5 px-3"
                        >
                          <SquarePen size={16} /> Edit
                        </Button>
                        <Button
                          onClick={() => setUnassignDialog({ open: true, node })}
                          className="flex gap-2 text-[#FF9705] rounded-lg bg-[#FFF3E0] hover:bg-[#ffe0b2] cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                        >
                          <Unplug size={16} /> Unassign
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

      {/* Assign Form Dialog */}
      <Dialog open={assignFormDialog.open}>
        <DialogContent className="overflow-y-auto [&>button]:hidden p-0 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] min-w-80 md:min-w-180 max-h-150">
          <DialogHeader>
            <div className="flex gap-3 p-4 py-3 md:p-5 md:py-5">
              <div className={`flex-shrink-0 self-start rounded-lg p-2 md:p-2.5 text-white ${isEdit ? 'bg-[#FF9705] mt-0.5' : 'bg-[#1565BC] mt-1.5 md:mt-0.5'}`}>
                {isEdit ? <MapPinPen className="md:h-7.5 md:w-7.5" /> : <MapPinPlus className="md:h-7.5 md:w-7.5" />}
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-base md:text-lg">{isEdit ? assignFormDialog.node?.node_name ?? 'Edit Assignment' : 'Assign Node'}</p>
                <p className="text-[10px] md:text-sm text-[#727272]">
                  {isEdit ? "Update this node's hotspot assignment." : 'Assign an available node to a canal hotspot.'}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogTitle className="sr-only">{isEdit ? 'Edit Assignment' : 'Assign Node'}</DialogTitle>

          <form>
            <div className="border-t border-[#C6C6C8] p-4 md:p-5 -mt-3">
              <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                  <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2">
                    <MapPin className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xs md:text-base">Assignment Details</p>
                    <p className="text-[10px] md:text-xs text-[#727272]">Select a node and map it to a canal hotspot</p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-[#C6C6C8] p-2.5 md:p-4">
                  {/* Node select — create only */}
                  {!isEdit && (
                    <div ref={selectedNodeRef}>
                      <Field className="flex gap-1.5 flex-col w-[274px] md:w-[310px]">
                        <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                          NODE <span className="text-[#FF0000]">*</span>
                        </FieldLabel>
                        <Select
                          value={selectedNode}
                          onValueChange={val => {
                            setSelectedNode(val)
                            if (fieldErrors.selectedNode) setFieldErrors(prev => ({ ...prev, selectedNode: '' }))
                          }}
                        >
                          <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.selectedNode ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                            <SelectValue placeholder="Select available node..." />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                            {availableNodes.length === 0 ? (
                              <div className="p-2 text-xs text-[#727272] text-center">No available nodes</div>
                            ) : (
                              availableNodes.map(n => (
                                <SelectItem key={n.node_id} value={String(n.node_id)} className="p-1 md:p-2 text-[#122A48]">
                                  {n.node_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FieldError className="text-xs">{fieldErrors.selectedNode}</FieldError>
                      </Field>
                    </div>
                  )}

                  {/* Barangay select */}
                  <div ref={barangayRef}>
                    <Field className="flex gap-1.5 flex-col w-[274px] md:w-[310px]">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        BARANGAY <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                      <Select
                        value={barangay}
                        onValueChange={val => {
                          setBarangay(val)
                          setHotspot('')
                          if (fieldErrors.barangay) setFieldErrors(prev => ({ ...prev, barangay: '' }))
                        }}
                      >
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.barangay ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                          <SelectValue placeholder="Select Barangay..." />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 overflow-y-auto">
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
                </div>

                <div className="flex gap-3 -mt-4 p-2.5 md:p-4">
                  {/* Hotspot select */}
                  <div ref={hotspotRef}>
                    <Field className="flex gap-1.5 flex-col w-[274px] md:w-[310px]">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        HOTSPOT <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                      <Select
                        value={hotspot}
                        onValueChange={val => {
                          setHotspot(val)
                          if (fieldErrors.hotspot) setFieldErrors(prev => ({ ...prev, hotspot: '' }))
                        }}
                        disabled={!barangay}
                      >
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.hotspot ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                          <SelectValue placeholder={!barangay ? "Select barangay first..." : "Select hotspot..."} />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                          {hotspots.length === 0 ? (
                            <div className="p-2 text-xs text-[#727272] text-center">
                              {barangay ? "No available hotspots" : "Select a barangay first"}
                            </div>
                          ) : (
                            hotspots.map(h => (
                              <SelectItem key={h.hotspot_id} value={String(h.hotspot_id)} className="p-1 md:p-2 text-[#122A48]">
                                {h.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FieldError className="text-xs">{fieldErrors.hotspot}</FieldError>
                    </Field>
                  </div>

                  {/* Installed At */}
                  <div ref={installedAtRef}>
                    <Field className="flex gap-1.5 flex-col w-[274px] md:w-[310px]">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        INSTALLED AT <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                      <Input
                        type="date"
                        value={installedAt}
                        onChange={e => {
                          setInstalledAt(e.target.value)
                          if (fieldErrors.installedAt) setFieldErrors(prev => ({ ...prev, installedAt: '' }))
                        }}
                        className={`text-[#122A48] rounded-lg text-xs bg-[#1565BC05] !font-normal md:h-10.5 ${fieldErrors.installedAt ? 'border-[#FF0000]' : 'border-[#727272]'}`}
                      />
                      <FieldError className="text-xs">{fieldErrors.installedAt}</FieldError>
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Preview */}
            <div className="p-4 md:p-5 -mt-5 md:-mt-7">
              <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                  <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2 flex justify-center items-center mt-1.5 md:mt-0">
                    <Navigation className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xs md:text-base">Geographic Location</p>
                    <p className="text-[10px] md:text-xs text-[#727272]">Coordinates are auto-filled from the selected hotspot.</p>
                  </div>
                </div>
                <div className="p-2.5 md:p-3 -mt-4">
                  <div className="rounded-lg bg-[#726D7814] border border-[#C6C6C8]">
                    <div className="p-2.5 md:p-3">
                      <p className="font-semibold text-xs md:text-sm">Map Preview</p>
                    </div>
                    <div className="h-70 md:h-110 border-t border-[#C6C6C8] rounded-b-lg overflow-hidden">
                      <AgosMapWrapper
                        latitude={selectedHotspot?.latitude}
                        longitude={selectedHotspot?.longitude}
                        label={barangay}
                        showLegend={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#C6C6C8] p-2.5 md:p-4">
                  <div className="flex gap-3 w-full -mt-3">
                    <div className="mt-3 flex-1">
                      <Field className="flex gap-1.5 flex-col">
                        <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LATITUDE</FieldLabel>
                        <Input
                          type="number"
                          value={selectedHotspot?.latitude ?? ''}
                          readOnly
                          placeholder="Auto-filled from hotspot"
                          className="text-[#122A48] rounded-lg text-xs bg-[#F0F0F0] cursor-not-allowed !font-normal md:h-9 border-[#727272]"
                        />
                      </Field>
                    </div>
                    <div className="mt-3 flex-1">
                      <Field className="flex gap-1.5 flex-col">
                        <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LONGITUDE</FieldLabel>
                        <Input
                          type="number"
                          value={selectedHotspot?.longitude ?? ''}
                          readOnly
                          placeholder="Auto-filled from hotspot"
                          className="text-[#122A48] rounded-lg text-xs bg-[#F0F0F0] cursor-not-allowed !font-normal md:h-9 border-[#727272]"
                        />
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
                {isEdit ? 'Save Changes' : 'Assign Node'}
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
              <p className="font-bold text-base md:text-lg">{viewMapDialog.node?.node_name}</p>
              <button className="cursor-pointer" onClick={() => setViewMapDialog({ open: false, node: null })}>
                <X size={18} />
              </button>
            </div>
          </DialogHeader>
          <div className="h-100 md:h-[380px] rounded-b-lg w-70 md:w-140 overflow-hidden">
            <AgosMapWrapper
              markers={assignedNodes.map(n => ({
                latitude: n.hotspot_details?.latitude,
                longitude: n.hotspot_details?.longitude,
                label: n.node_name,
                condition: n.condition,
                sublabel: `Water: ${n.water_level ?? '—'}cm | Clog: ${n.clog_pct ?? '—'}%`,
              }))}
              zoom={13}
            />
          </div>
          <div className="border-t border-[#C6C6C8] flex justify-between py-3 -mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <p className="text-xs md:text-sm">{viewMapDialog.node?.hotspot_details?.latitude}</p>
              <p className="text-xs md:text-sm">{viewMapDialog.node?.hotspot_details?.longitude}</p>
            </div>
            <Button
              disabled={!viewMapDialog.node?.hotspot_details?.latitude}
              onClick={() => {
                const n = viewMapDialog.node
                if (!n) return
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${n.hotspot_details?.latitude},${n.hotspot_details?.longitude}`,
                  '_blank'
                )
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
        title={isEdit ? "Cancel Changes" : "Cancel Assignment"}
        description={isEdit ? 'Unsaved changes will be lost.' : 'Are you sure you want to cancel?'}
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
        title={isEdit ? 'Confirm Changes' : 'Confirm Assignment'}
        description={isEdit
          ? <> Are you sure you want to update this node's assignment? </>
          : <> Are you sure you want to assign this node? </>
        }
        cancelLabel="Keep Editing"
        confirmLabel={isEdit ? 'Confirm Changes' : 'Assign Node'}
      />

      {/* Loading dialog */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title={isEdit ? "Saving Changes" : "Assigning Node"}
        description={<> Processing. Please wait. </>}
      />

      {/* Unassign dialog */}
      <DialogModal
        open={unassignDialog.open}
        onClose={() => setUnassignDialog({ open: false, node: null })}
        onConfirm={() => handleUnassign(unassignDialog.node!)}
        color={DIALOG_COLOR.lightyellow}
        icon={Unplug}
        iconColor={DIALOG_COLOR.yellow}
        title="Unassign Node"
        description={<> Are you sure you want to unassign <strong>{unassignDialog.node?.node_name}</strong>? It will return to Available in Node Management. </>}
        cancelLabel="Cancel"
        confirmLabel="Unassign"
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}