"use client"

// icons
import { FaPlus } from "react-icons/fa"
import { RadioTower, BadgeCheck, CircleOff, Wrench, Map, SquarePen, MapPinPlus, MapPinPen, MapPin, Navigation, Check, X, MapPinOff } from "lucide-react"

// react
import { useState, useEffect } from "react"

// shadcn
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Dialog, DialogTitle, DialogContent, DialogHeader, } from "@/components/ui/dialog"
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
import { Toast } from "@/components/Toast";

// lib
import { DIALOG_COLOR } from "@/lib/constant"

// auth
import { fetchWithAuth, getAccessToken } from "@/lib/auth"
import { api } from "@/lib/api";

type SensorNodes = {
  node_id: number
  barangay_details: { barangay_id: number; barangay_name: string } | null
  node_name: string
  latitude: number
  longitude: number
  status: string
  installed_at: string
  condition: string | null
  water_level: number | null
  water_flow_rate: number | null
  clog_pct: number | null
}

type Barangay = {
  barangay_id: number
  barangay_name: string
  latitude: number
  longitude: number
}

type DialogState = {
  open: boolean
  node?: SensorNodes | null;
}


export default function Node() {
  // us
  const [sensorNodes, setSensorNodes] = useState<SensorNodes[]>([])

  // filter states
  const [search, setSearch] = useState<string>('')
  const [nodeStatus, setNodeStatus] = useState<string>('All Status')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // table states
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  
  // form state
  const [barangay, setBarangay] = useState<string>('')
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])
  const [nodeName, setNodeName] = useState<string>('')
  const [installedAt, setInstalledAt] = useState<string>("")
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')

  const {toasts, addToast, removeToast } = useToast()

  // dialog state
  const [nodeFormDialog , setNodeFormDialog] = useState<DialogState>({
    open: false,
    node: null
  })
  const [viewMapDialog, setViewMapDialog] = useState<DialogState>({
    open: false,
    node: null
  })
  const [loadingDialog, setLoadingDialog] = useState<DialogState>({
    open: false,
    node: null
  })
  const [confirmDialog, setConfirmDialog] = useState<DialogState>({
    open: false,
    node: null
  })
  const [cancelDialog, setCancelDialog] = useState<DialogState>({
    open: false,
    node: null
  })
  const [decommissionDialog , setDecommissionDialog] = useState<DialogState>({
    open: false,
    node: null
  })

  function getFilteredNode(nodes: SensorNodes[], status: string, search: string) {
    const q = search.toLowerCase()
    return nodes
      .filter(b => status === "All Status" || b.status === status)
      .filter(b =>
        [b.node_name, b.barangay_details?.barangay_name]
          .some(field => field?.toLowerCase().includes(q))
      )
      .sort((a, b) => b.node_id - a.node_id)
  }

  const filtered = getFilteredNode(sensorNodes, nodeStatus, search)
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  // summary cards
  const total = sensorNodes.length
  const active = sensorNodes.filter(n => n.status === 'Active').length
  const inactive = sensorNodes.filter(n => n.status === 'Inactive').length
  const maintenance = sensorNodes.filter(n => n.status === 'Maintenance').length

  const isEdit = !!nodeFormDialog.node

  const fetchNodes = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const params = new URLSearchParams()
      if (nodeStatus !== 'All Status') params.append('node_status', nodeStatus)

      const query = params.toString()

      const nodeRes = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/${query ? `?${query}` : ''}`
      )
      if (!nodeRes.ok) throw new Error()
      const nodeData = await nodeRes.json()

      setSensorNodes(nodeData.results ?? nodeData)
      setCurrentPage(1)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodes()
  }, [nodeStatus])

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

  useEffect(() => {
    if (nodeFormDialog.node) {
      setBarangay(String(nodeFormDialog.node.barangay_details?.barangay_id ?? ''))
      setNodeName(nodeFormDialog.node.node_name ?? '')
      setLatitude(String(nodeFormDialog.node.latitude ?? ''))
      setLongitude(String(nodeFormDialog.node.longitude ?? ''))
      setInstalledAt(
        nodeFormDialog.node.installed_at
          ? new Date(nodeFormDialog.node.installed_at).toISOString().split('T')[0]
          : ''
      )
    } else {
      setBarangay('')
      setNodeName('')
      setLatitude('')
      setLongitude('')
      setInstalledAt('')
      setFieldErrors({})
    }
  }, [nodeFormDialog.open])

  // handlers
  const handleDecomission = async (node: SensorNodes) => {
    if (!node) return
    setDecommissionDialog({ open: false, node: null })

    try {
      const token = getAccessToken()
      await api.post(`/api/sensor-nodes/${node.node_id}/decommission/`, {})
      setSensorNodes(prev => prev.map(n => 
        n.node_id === node.node_id ? { ...n, status: 'Decommissioned' } : n
      ))
      addToast(`${node.node_name} has been unregistered.`, 'success')
    } catch (err: any) {
      addToast(err?.detail ?? 'Failed to unregister barangay.', 'error')
    }
  }

  const handleConfirmationDialog = () => {
    const errors: Record<string, string> = {}
    if (!barangay.trim()) errors.barangay = "This field is required."
    if (!nodeName.trim()) errors.nodeName = "This field is required."
    if (!installedAt.trim()) errors.installedAt = "This field is required."
    if (!latitude.trim()) errors.latitude = 'This field is required.'
    if (!longitude.trim()) errors.longitude = 'This field is required.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setConfirmDialog({ open: true })
  }

  const handleCancel = () => {
    setCancelDialog({ open: false})
    setNodeFormDialog({ open: false, node: null})
    setBarangay('')
    setNodeName('')
    setInstalledAt('')
    setLatitude('')
    setLongitude('')
    setFieldErrors({})
  }

  const handleSubmit = async () => {
    setConfirmDialog({ open: false })
    setLoadingDialog({ open: true })

    const payload = {
      barangay: parseInt(barangay),
      node_name: nodeName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      installed_at: installedAt ? new Date(installedAt).toISOString() : undefined,
    }

    try {
      if (isEdit) {
        const updated = await api.patch(`/api/sensor-nodes/${nodeFormDialog.node!.node_id}/`, payload)
        setSensorNodes(prev => prev.map(n =>
          n.node_id === nodeFormDialog.node!.node_id
            ? { ...n, ...updated }
            : n
        ))
        addToast(`${nodeName} has been updated.`, 'success')
        } else {
          const created = await api.post('/api/sensor-nodes/', payload)
          setSensorNodes(prev => [created, ...prev])
          addToast(`${nodeName || 'New node'} has been added.`, 'success')
        }
        
        setNodeFormDialog({ open: false, node: null })
        setBarangay('')
        setNodeName('')
        setInstalledAt('')
        setLatitude('')
        setLongitude('')
        setFieldErrors({})
      } catch (err: any) {
        addToast(err?.detail ?? err?.error ?? 'Something went wrong.', 'error')
      } finally {
        setLoadingDialog({ open: false })
    }
  }
  


  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* title and filter container */}
        <div className="flex justify-between w-full mb-4">
          <div className="font-bold text-[#122A48] flex justify-center items-center text-lg">
            <p>IoT Nodes</p>
          </div>

          <div className="flex gap-3">

            {/* search filter */}
            <SearchFilter value={search} onChange={setSearch} placeholder='Search sensor node...' width="w-60" height="h-11" />

            {/* node status filter */}
            <Select value={nodeStatus} onValueChange={setNodeStatus}>
              <SelectTrigger className="w-30 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-30 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All Status">All Status</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Active">Active</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Inactive">Inactive</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Maintenance">Maintenance</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>

            {/* add user */}
            <Button
              onClick={() => setNodeFormDialog({ open: true, node: null})}
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Add Node
            </Button>

          </div>
        </div>

        {/* summary cards */}
        <div className="flex justify-between w-full text-[#122A48] mt-1">
          {[
            { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: total,    label: "Total Sensor Nodes" },
            { icon: <BadgeCheck size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: active,  label: "Active"},
            { icon: <CircleOff size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: inactive, label: "Inactive"},
            { icon: <Wrench size={20} color="#582579" />, bg: "bg-[#D8B4FE]", count: maintenance,  label: "Maintenance"},
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-75 flex items-center p-6 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{card.count}</span>
                <p className="text-sm">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className='flex gap-4 mt-3 h-108.5'>
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col'>
            <p className='p-3 font-bold text-[#122A48]'>Canal Sensor Nodes</p>

            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC]'>
                <TableRow>
                  <TableHead className='font-semibold text-center text-[#727272]'>NODE</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>BARANGAY</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>NODE NAME</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>LOCATION</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>STATUS</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>INSTALLED</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {/* fetch error state */}
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to load node. Please try again later.</p>
                          <Button onClick={fetchNodes} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  
                  // no node state
                  ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-15">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <RadioTower size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No sensor nodes in the system</p>
                        <p className="text-[#727272] text-sm">
                          No sensor node have been added yet. Click <br/> the button below to start adding node.
                        </p>
                        <Button
                          onClick={() => setNodeFormDialog({ open: true, node: null})}
                          className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                        >
                          + Add Node
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  // with node state
                  ) : (
                    paginated.map(node => (
                      <TableRow key={node.node_id} className="border-b border-[#C6C6C8]">
                        <TableCell className="text-[#122A48] text-center h-18">{node.node_id}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{node.barangay_details?.barangay_name}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{node.node_name}</TableCell>

                        <TableCell className="text-[#122A48] text-center h-18">
                          <Button
                            onClick={() => setViewMapDialog({ open: true, node: node })}
                            className="rounded-lg text-[#2C7B3C] border border-[#C6C6C8] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] py-4.5 px-3"
                          >
                            <Map size={16}/>
                            View on map
                          </Button>
                        </TableCell>
                        
                          <TableCell className="text-center h-18">
                            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${
                              node.status === 'Active'      ? 'bg-[#B2FBC173] text-[#2C7B3C]' :
                              node.status === 'Maintenance' ? 'bg-[#D8B4FE] text-[#582579]' :
                              node.status === 'Decommissioned' ? 'bg-[#E5E5E6] text-[#727272]' :
                              'bg-[#FFE5E5] text-[#D81010]'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                node.status === 'Active'      ? 'bg-[#1D8104]' :
                                node.status === 'Maintenance' ? 'bg-[#582579]' :
                                node.status === 'Decommissioned' ? 'bg-[#727272]' :
                                'bg-[#BB2325]'
                              }`}/>
                              {node.status}
                            </span>
                          </TableCell>

                        <TableCell className="text-[#122A48] text-center h-18">
                          {node.installed_at
                            ? new Date(node.installed_at.replace(' ', 'T')).toLocaleDateString('en-PH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : '—'}
                        </TableCell>

                        <TableCell className="text-[#122A48] flex gap-3 justify-center items-center h-18">
                          <Button
                            onClick={() => setNodeFormDialog({ open: true, node: node })}
                            className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] py-4.5 px-3"
                          >
                            <SquarePen size={16} />
                            Edit
                          </Button>
                          <Button
                            onClick={() => setDecommissionDialog({ open: true, node: node })}
                            className="flex gap-2 text-[#D81010] rounded-lg bg-[#FFE5E5] hover:bg-[#dfc6c6] cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                          >
                            <MapPinOff size={16} />
                            Remove
                          </Button>
                      </TableCell>

                      </TableRow>
                    ))
                  )}

              </TableBody>
            </Table>
            <div className='mt-auto'>
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

      {/* Node Dialog Form */}
      <Dialog open={nodeFormDialog.open}>
        <DialogContent className="overflow-y-auto [&>button]:hidden p-0 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] min-w-80 md:min-w-180 max-h-150">
          <DialogHeader>
            <div className="flex gap-3 p-4 py-3 md:p-5 md:py-5">
              <div className={`flex-shrink-0 self-start rounded-lg p-2 md:p-2.5 text-white ${isEdit ? 'bg-[#FF9705] mt-0.5' : 'bg-[#1565BC] mt-1.5 md:mt-0.5'}`}>
                {isEdit ? <MapPinPen className="md:h-7.5 md:w-7.5" /> : <MapPinPlus className="md:h-7.5 md:w-7.5" />}
              </div>
              <div className="flex flex-col ">
                <p className="font-bold text-base md:text-lg">{isEdit ? nodeFormDialog.node?.node_name ?? 'Edit Node' : 'Add Node'}</p>
                <p className="text-[10px] md:text-sm">
                  {isEdit ? (
                    'Rosario, La Union'
                  ) : (
                    <>
                      Register a new IoT sensor node under<br className="md:hidden" /> AGOS monitoring coverage
                    </>
                  )}
                </p>
              </div>
            </div>
            
          </DialogHeader>
          {/* hiddent title to remove error */}
          <DialogTitle className="sr-only">
            {isEdit ? 'Edit Node' : 'Add Node'}
          </DialogTitle>
            {/* form container */}
            <form>
              <div className="border-t border-[#C6C6C8] p-4 md:p-5 -mt-3">
                <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                  <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                    <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2">
                      <MapPin className="text-[#1565BC] h-5 w-5 md:h-7.5 md:w-7.5"/>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-xs md:text-base">Node Information</p>
                      <p className="text-[10px] md:text-xs text-[#727272]">Basic identity details of the sensor node</p>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-[#C6C6C8] p-2.5 md:p-4">
                    {/* Barangay Select */}
                    <Field className="flex gap-1.5 flex-col w-[274px] md:w-[310px]">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        BARANGAY <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                      <Select
                        value={barangay}
                        onValueChange={(value) => {
                          setBarangay(value)
                          if (fieldErrors.barangay) setFieldErrors(prev => ({ ...prev, barangay: '' }))

                          const selected = allBarangays.find(b => String(b.barangay_id) === value)
                          if (selected) {
                            setLatitude(String(selected.latitude))
                            setLongitude(String(selected.longitude))
                          }
                        }}
                      >
                        <SelectTrigger className={`!font-normal bg-[#1565BC05] py-0 md:py-[20px] text-xs md:text-sm rounded-lg ${fieldErrors.barangay ? 'border-[#FF0000]' : 'border-[#727272]'}`}>
                          <SelectValue placeholder="Select Barangay..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {[...allBarangays]
                            .sort((a, b) => a.barangay_name.localeCompare(b.barangay_name))
                            .map(b => (
                              <SelectItem
                                key={b.barangay_id}
                                value={String(b.barangay_id)}
                                className="p-1 md:p-2 text-[#122A48]"
                              >
                                {b.barangay_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FieldError className="text-xs">{fieldErrors.barangay}</FieldError>
                    </Field>
                    
                    {/* hotspot select */}


                  </div>

                  <div className="flex gap-3 -mt-4 p-2.5 md:p-4">
                    {/* Node Name */}
                    <Field className="flex gap-1.5 flex-col w-[274px] md:w-[310px]">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        NODE NAME <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                        <Input
                          type="text"
                          name="nodeName"
                          value={nodeName}
                          onChange={(e) => {
                            setNodeName(e.target.value)
                          }}
                          placeholder="e.g. Node A"
                          className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h- md:h-10.5 bg-[#1565BC05] ${
                            fieldErrors.nodeName ? 'border-[#FF0000]' : 'border-[#727272]'
                          }`}
                        />
                      <FieldError className="text-xs">{fieldErrors.nodeName}</FieldError>
                    </Field>

                    {/* Installed at */}
                    <Field className="flex gap-1.5 flex-col w-[274px] md:w-[310px]">
                      <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                        INSTALLED AT <span className="text-[#FF0000]">*</span>
                      </FieldLabel>
                        <Input
                          type="date"
                          name="installedat"
                          value={installedAt}
                          onChange={(e) => {
                            setInstalledAt(e.target.value)
                          }}
                          placeholder="e.g. 16.228951329585076"
                          className={`text-[#122A48] rounded-lg text-xs bg-white !font-normal h- md:h-10.5 bg-[#1565BC05] ${
                            fieldErrors.installedAt ? 'border-[#FF0000]' : 'border-[#727272]'
                          }`}
                        />
                      <FieldError className="text-xs">{fieldErrors.installedAt}</FieldError>
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
                      <p className="text-[10px] md:text-xs text-[#727272]">Select a barangay first, then click on the map to pin the exact canal node location.</p>
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
                        />
                      </div>
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
                        {/* latitude */}
                        <Field className="flex gap-1.5 flex-col">
                          <FieldLabel className="text-[#122A48] text-[11px] md:text-xs">LONGITUDE <span className="text-[#FF0000]">*</span></FieldLabel>
                            <Input
                              type="number"
                              name="longitude"
                              value={longitude}
                              readOnly
                              placeholder="Auto-filled on selection"
                              className={`text-[#122A48] rounded-lg text-xs bg-[#F0F0F0] cursor-not-allowed !font-normal h- md:h-9 ${
                                fieldErrors.latitude ? 'border-[#FF0000]' : 'border-[#727272]'
                              }`}
                            />
                            <div className="flex justify-between items-center">
                            <FieldError className="text-xs">{fieldErrors.longitude}</FieldError>
                          </div>
                        </Field>
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
                  {isEdit ? 'Save Changes' : 'Add Node'}
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
              <div className="flex gap-2 items-center">
                <p className="font-bold text-base md:text-lg">{viewMapDialog.node?.node_name}</p>
              </div>
              <button className="cursor-pointer" onClick={() => setViewMapDialog({ open: false, node: null })}>
                <X size={18} />
              </button>
            </div>
          </DialogHeader>
          <div className="h-100 md:h-[380px] rounded-b-lg w-70 md:w-140 overflow-hidden">
            <AgosMapWrapper
              markers={sensorNodes.map(n => ({
                latitude: n.latitude,
                longitude: n.longitude,
                label: n.node_name,
                condition: n.condition,
                sublabel: `Water: ${n.water_level ?? '—'}cm | Clog: ${n.clog_pct ?? '—'}%`,
              }))}
              zoom={13}
            />
          </div>
          <div className="border-t border-[#C6C6C8] flex justify-between py-3 -mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <p className="text-xs md:text-sm">{viewMapDialog.node?.latitude}</p>
              <p className="text-xs md:text-sm">{viewMapDialog.node?.longitude}</p>
            </div>
            <Button
              disabled={viewMapDialog.node?.latitude == null || viewMapDialog.node?.longitude == null}
              onClick={() => {
                const n = viewMapDialog.node
                if (!n) return
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${n.latitude},${n.longitude}`, '_blank')
              }}
              className="cursor-pointer rounded-lg border border-[#C6C6C8] bg-[#FAFCFD] hover:bg-[#d6e4eb] px-3 py-2 md:px-4 md:py-3 text-[#727272]"
            >
              <Map />
              Open in Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* cancel dialog */}
      <DialogModal
        open={cancelDialog.open}
        onClose={() => setCancelDialog({open: false})}
        onConfirm={handleCancel}
        color={isEdit ? DIALOG_COLOR.lightyellow : DIALOG_COLOR.lightred}
        icon={isEdit ? SquarePen : X}
        iconColor={isEdit ? DIALOG_COLOR.yellow : DIALOG_COLOR.red}
        title={isEdit ? "Cancel Changes" : "Cancel Adding Node"}
        description={isEdit ? 'You have unsaved changes that will be lost if you cancel.' : 'Are you sure you want to cancel adding node?'}
        cancelLabel='Keep Editing'
        confirmLabel='Yes, Cancel'
      />

      {/* confirm form dialog */}
      <DialogModal
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({open: false})}
        onConfirm={handleSubmit}
        color={DIALOG_COLOR.lightgreen}
        icon={isEdit? MapPinPen : MapPinPlus}
        iconColor={DIALOG_COLOR.green}
        title={isEdit ? 'Confirm Changes' : 'Confirm Adding Node'}
        description={isEdit ?
          <>
            Are you sure you want to change node <strong>{nodeName}</strong> information?
          </>
          :
          <>
            Are you sure you want to add this new node?
          </>
        }
        cancelLabel='Keep Editing'
        confirmLabel={isEdit ? 'Confirm Changes' : 'Add Node'}
      />

      {/* loading state */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title={isEdit? "Saving Changes" : "Saving Node"}
        description={isEdit ? 
          <>
            Processing barangay detail changes for node <strong>{nodeName}</strong>. Please wait.
          </>
          : 
          <>
            Proccessing barangay details. Please wait.
          </>
        }
      />

      {/* confirm decommission dialog */}
      <DialogModal
        open={decommissionDialog.open}
        onClose={() => setDecommissionDialog({ open: false, node: null })}
        onConfirm={() => handleDecomission(decommissionDialog.node!)}
        color={DIALOG_COLOR.lightred}
        icon={MapPinOff}
        iconColor={DIALOG_COLOR.red}
        title="Decommission Node"
        description={<>Are you sure you want to decommission <strong>{decommissionDialog.node?.node_name}</strong>? This cannot be undone.</>}
        cancelLabel="Cancel"
        confirmLabel="Decommission"
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}
