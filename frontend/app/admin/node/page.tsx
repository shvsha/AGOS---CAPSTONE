"use client"

// icons
import { FaPlus } from "react-icons/fa"
import { RadioTower, CheckCircle, SquarePen, MapPinPlus, MapPinPen, MapPin, Check, X, Unplug } from "lucide-react"

// react
import { useState, useEffect } from "react"

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
  node_name: string
  availability_status: string
  status: string
}

type DialogState = {
  open: boolean
  node?: SensorNode | null
}

export default function NodeManagement() {
  const [sensorNodes, setSensorNodes] = useState<SensorNode[]>([])
  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('All')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [nodeName, setNodeName] = useState('')

  const { toasts, addToast, removeToast } = useToast()

  const [nodeFormDialog, setNodeFormDialog] = useState<DialogState>({ open: false, node: null })
  const [loadingDialog, setLoadingDialog] = useState<DialogState>({ open: false })
  const [confirmDialog, setConfirmDialog] = useState<DialogState>({ open: false })
  const [cancelDialog, setCancelDialog] = useState<DialogState>({ open: false })
  const [unassignDialog, setUnassignDialog] = useState<DialogState>({ open: false, node: null })

  const isEdit = !!nodeFormDialog.node

  const filtered = sensorNodes
    .filter(n => n.availability_status !== 'Retired')
    .filter(n => availabilityFilter === 'All' || n.availability_status === availabilityFilter)
    .filter(n => n.node_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.node_id - a.node_id)

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  const total     = sensorNodes.filter(n => n.availability_status !== 'Retired').length
  const available = sensorNodes.filter(n => n.availability_status === 'Available').length
  const occupied  = sensorNodes.filter(n => n.availability_status === 'Occupied').length

  const fetchNodes = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSensorNodes(data.results ?? data)
      setCurrentPage(1)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNodes() }, [])

  useEffect(() => {
    if (nodeFormDialog.node) {
      setNodeName(nodeFormDialog.node.node_name ?? '')
    } else {
      setNodeName('')
      setFieldErrors({})
    }
  }, [nodeFormDialog.open])

  const resetForm = () => {
    setNodeName('')
    setFieldErrors({})
  }

  const handleConfirmationDialog = () => {
    const errors: Record<string, string> = {}
    if (!nodeName.trim()) errors.nodeName = "This field is required."
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    setConfirmDialog({ open: true })
  }

  const handleCancel = () => {
    setCancelDialog({ open: false })
    setNodeFormDialog({ open: false, node: null })
    resetForm()
  }

  const handleSubmit = async () => {
    setConfirmDialog({ open: false })
    setLoadingDialog({ open: true })

    const payload = { node_name: nodeName }

    try {
      if (isEdit) {
        const updated = await api.patch(`/api/sensor-nodes/${nodeFormDialog.node!.node_id}/`, payload)
        setSensorNodes(prev => prev.map(n =>
          n.node_id === nodeFormDialog.node!.node_id ? { ...n, ...updated } : n
        ))
        addToast(`${nodeName} has been updated.`, 'success')
      } else {
        const created = await api.post('/api/sensor-nodes/', payload)
        setSensorNodes(prev => [created, ...prev])
        addToast(`${nodeName} has been added.`, 'success')
      }
      setNodeFormDialog({ open: false, node: null })
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
      setSensorNodes(prev => prev.map(n =>
        n.node_id === node.node_id
          ? { ...n, availability_status: 'Available', status: 'Active' }
          : n
      ))
      addToast(`${node.node_name} has been unassigned and is now available.`, 'success')
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
            <p>Node Management</p>
          </div>
          <div className="flex gap-3">
            <SearchFilter value={search} onChange={setSearch} placeholder="Search node..." width="w-60" height="h-11" />
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-36 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-36 min-w-0">
                <SelectItem className="p-2 text-[#122A48]" value="All">All</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Available">Available</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Occupied">Occupied</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setNodeFormDialog({ open: true, node: null })}
              className="p-5 py-5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Add Node
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="flex justify-between w-full text-[#122A48] mt-1">
          {[
            { icon: <RadioTower size={20} color="#2C7B3C" />,  bg: "bg-[#CDE3DE]", count: total,     label: "Total Nodes" },
            { icon: <CheckCircle size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: available, label: "Available" },
            { icon: <RadioTower size={20} color="#1565BC" />,  bg: "bg-[#DBEAFE]", count: occupied,  label: "Occupied" },
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
            <p className="p-3 font-bold text-[#122A48]">IoT Sensor Nodes</p>
            <Table>
              <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
                <TableRow>
                  <TableHead className="font-semibold text-center text-[#727272]">NODE ID</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">NODE NAME</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">AVAILABILITY</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-15">
                      <div className="flex flex-col justify-center items-center gap-3 py-20">
                        <p className="text-[#D81010] font-semibold text-base">Failed to load nodes. Please try again.</p>
                        <Button onClick={fetchNodes} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-15">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <RadioTower size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No sensor nodes added</p>
                        <p className="text-[#727272] text-sm">Add a node to start monitoring.</p>
                        <Button
                          onClick={() => setNodeFormDialog({ open: true, node: null })}
                          className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                        >
                          + Add Node
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map(node => (
                    <TableRow key={node.node_id} className="border-b border-[#C6C6C8]">
                      <TableCell className="text-[#122A48] text-center h-18">{node.node_id}</TableCell>
                      <TableCell className="text-[#122A48] text-center h-18">{node.node_name}</TableCell>
                      <TableCell className="text-center h-18">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${
                          node.availability_status === 'Available' ? 'bg-[#B2FBC173] text-[#2C7B3C]' :
                          'bg-[#DBEAFE] text-[#1565BC]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            node.availability_status === 'Available' ? 'bg-[#1D8104]' : 'bg-[#1565BC]'
                          }`} />
                          {node.availability_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#122A48] flex gap-2 justify-center items-center h-18">
                        <Button
                          onClick={() => setNodeFormDialog({ open: true, node })}
                          className="flex gap-2 text-[#122A48] rounded-lg bg-[#CDE3DE45] hover:bg-[#75928a45] cursor-pointer border border-[#1565BC80] py-4.5 px-3"
                        >
                          <SquarePen size={16} /> Edit
                        </Button>
                        {node.availability_status === 'Occupied' && (
                          <Button
                            onClick={() => setUnassignDialog({ open: true, node })}
                            className="flex gap-2 text-[#FF9705] rounded-lg bg-[#FFF3E0] hover:bg-[#ffe0b2] cursor-pointer border border-[#C6C6C8] py-4.5 px-3"
                          >
                            <Unplug size={16} /> Unassign
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
      </div>

      {/* Node Form Dialog */}
      <Dialog open={nodeFormDialog.open}>
        <DialogContent className="overflow-y-auto [&>button]:hidden p-0 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] min-w-80 md:min-w-120 max-h-150">
          <DialogHeader>
            <div className="flex gap-3 p-4 py-3 md:p-5 md:py-5">
              <div className={`flex-shrink-0 self-start rounded-lg p-2 md:p-2.5 text-white ${isEdit ? 'bg-[#FF9705] mt-0.5' : 'bg-[#1565BC] mt-1.5 md:mt-0.5'}`}>
                {isEdit ? <MapPinPen className="md:h-7.5 md:w-7.5" /> : <MapPinPlus className="md:h-7.5 md:w-7.5" />}
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-base md:text-lg">{isEdit ? nodeFormDialog.node?.node_name ?? 'Edit Node' : 'Add Node'}</p>
                <p className="text-[10px] md:text-sm text-[#727272]">
                  {isEdit ? "Update this node's basic information." : 'Add a new IoT sensor node into the system.'}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogTitle className="sr-only">{isEdit ? 'Edit Node' : 'Add Node'}</DialogTitle>

          <form>
            <div className="border-t border-[#C6C6C8] p-4 md:p-5 -mt-3">
              <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex gap-2 md:gap-3 p-2.5 md:p-4">
                  <div className="rounded-lg bg-[#CDE3DE] p-1.5 md:p-2">
                    <MapPin className="text-[#1565BC] h-5 w-5 md:h-7 md:w-7" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xs md:text-base">Node Information</p>
                    <p className="text-[10px] md:text-xs text-[#727272]">Basic identity details of the sensor node</p>
                  </div>
                </div>

                <div className="border-t border-[#C6C6C8] p-2.5 md:p-4">
                  <Field className="flex gap-1.5 flex-col">
                    <FieldLabel className="text-[#122A48] text-xs md:text-sm">
                      NODE NAME <span className="text-[#FF0000]">*</span>
                    </FieldLabel>
                    <Input
                      type="text"
                      value={nodeName}
                      onChange={e => {
                        setNodeName(e.target.value)
                        if (fieldErrors.nodeName) setFieldErrors(prev => ({ ...prev, nodeName: '' }))
                      }}
                      placeholder="e.g. Node A"
                      className={`text-[#122A48] rounded-lg text-xs bg-[#1565BC05] !font-normal md:h-10.5 ${fieldErrors.nodeName ? 'border-[#FF0000]' : 'border-[#727272]'}`}
                    />
                    <FieldError className="text-xs">{fieldErrors.nodeName}</FieldError>
                  </Field>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end p-4 -mt-2">
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
                {isEdit ? 'Save Changes' : 'Add Node'}
              </Button>
            </div>
          </form>
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
        title={isEdit ? "Cancel Changes" : "Cancel Adding"}
        description={isEdit ? 'Unsaved changes will be lost.' : 'Are you sure you want to cancel adding this node?'}
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
        title={isEdit ? 'Confirm Changes' : 'Confirm Adding'}
        description={isEdit
          ? <> Are you sure you want to update <strong>{nodeName}</strong>? </>
          : <> Are you sure you want to add this new node? </>
        }
        cancelLabel="Keep Editing"
        confirmLabel={isEdit ? 'Confirm Changes' : 'Add Node'}
      />

      {/* Loading dialog */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title={isEdit ? "Saving Changes" : "Adding Node"}
        description={<> Processing details. Please wait. </>}
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
        description={<> Are you sure you want to unassign <strong>{unassignDialog.node?.node_name}</strong> from its hotspot? It will return to Available. </>}
        cancelLabel="Cancel"
        confirmLabel="Unassign"
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}