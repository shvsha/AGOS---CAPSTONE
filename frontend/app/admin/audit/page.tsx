"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { RadioTower, Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/TablePagination"
import { usePagination } from "@/components/hooks/usePagination"
import { SearchFilter } from "@/components/SearchFilter"
import { api } from "@/lib/api"

const affectedTableLabels: Record<string, string> = {
  tbl_user: 'User Management',
  tbl_barangay: 'Barangay Management',
  tbl_sensor_nodes: 'Sensor Nodes',
  tbl_sensor_readings: 'Sensor Readings',
  tbl_alerts: 'Alerts',
  tbl_alert_reads: 'Alert Reads',
  tbl_waste_classification: 'Waste Classification',
  tbl_clog_events: 'CLOG Events',
  tbl_barangay_monthly_report: 'Barangay Monthly Reports',
  tbl_municipal_monthly_report: 'Municipal Monthly Reports',
  tbl_report_media: 'Report Media',
  tbl_system_health_logs: 'System Health Logs',
  tbl_audit_logs: 'Audit Logs',
}

function formatAffectedTableLabel(tableName?: string | null) {
  if (!tableName) return '—'
  return affectedTableLabels[tableName] ??
    tableName.replace(/^tbl_/, '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatAuditDetails(audit: AuditLog) {
  const oldValue = audit.old_value?.trim()
  const newValue = audit.new_value?.trim()

  if (oldValue && newValue) {
    return `${audit.action} from ${oldValue} to ${newValue}`
  }
  if (newValue) return `${audit.action}: ${newValue}`
  if (oldValue) return `${audit.action}: ${oldValue}`
  return audit.action
}

type AuditLog = {
  audit_id: number
  user: number | { user_id?: number; username?: string } | null
  action: string
  affected_table?: string | null
  old_value?: string | null
  new_value?: string | null
  ip_address?: string | null
  timestamp: string
}

export default function Audit() {
  const [audits, setAudits] = useState<AuditLog[]>([])
  const [search, setSearch] = useState<string>('')
  
  // Date State
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<boolean>(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredAudits = useMemo(() => {
    const q = search.trim().toLowerCase()
    
    return audits.filter((a) => {
      if (q) {
        const tableLabel = formatAffectedTableLabel(a.affected_table)
        const matchesSearch = [
          String(a.action),
          tableLabel,
          String(a.old_value ?? ''),
          String(a.new_value ?? ''),
          String(a.ip_address ?? ''),
          a.user && typeof a.user === 'object' ? a.user.username ?? '' : String(a.user ?? ''),
        ]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q))
        
        if (!matchesSearch) return false
      }

      if (startDate || endDate) {
        const auditDate = new Date(a.timestamp).toISOString().split('T')[0] // YYYY-MM-DD
        if (startDate && auditDate < startDate) return false
        if (endDate && auditDate > endDate) return false
      }

      return true
    })
  }, [audits, search, startDate, endDate])

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filteredAudits, 15)

  async function fetchAudits() {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await api.get('/api/audit-logs/')
      const data = res.results ?? res
      setAudits(Array.isArray(data) ? data : [])
    } catch (err) {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAudits()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, startDate, endDate, setCurrentPage])

  // Generate dynamic button label text 
  const dateLabel = useMemo(() => {
    if (startDate && endDate) return `${startDate} to ${endDate}`
    if (startDate) return `From: ${startDate}`
    if (endDate) return `Until: ${endDate}`
    return "Filter by Date"
  }, [startDate, endDate])

  return (
    <div className="w-full flex flex-col gap-2 p-3 max-w-full box-border">

      {/* Toolbar */}
      <div className="w-full flex gap-3 items-end items-center justify-between ">
        <SearchFilter value={search} onChange={setSearch} placeholder='Search audit logs...' width="w-180" height="h-11" />
        
        {/* Dropdown Container */}
        <div className="relative" ref={dropdownRef} >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center justify-between w-[240px] h-11 px-3 border border-[#D0D0D0] rounded-lg bg-white text-[12px] font-normal transition-colors outline-none text-left ${
              startDate || endDate ? "text-[#122A48]" : "text-[#999999]"
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-[#122A48]" />
              <span>{dateLabel}</span>
            </div>
            <ChevronDown size={14} className="text-[#999999]" />
          </button>

          {/* Expanded Dual Calendar Dropdown Card Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-1.5 p-4 bg-white border border-[#D0D0D0] rounded-lg shadow-xl z-50 flex flex-col gap-3 w-[280px]">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#727272] uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 border border-[#D0D0D0] rounded-md px-2 text-[12px] outline-none text-[#122A48]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#727272] uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 border border-[#D0D0D0] rounded-md px-2 text-[12px] outline-none text-[#122A48]"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="w-full text-center py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-dashed border-red-200 mt-1 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Table Card */}
      <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col overflow-hidden min-w-0 mt-2'>
        <p className='p-4 font-bold text-[#122A48] text-[12px]'>Audit Logs and Activities</p>

        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[700px]"> 
            <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC]'>
              <TableRow>
                <TableHead className='font-semibold text-center text-[#727272] text-[12px] px-1 whitespace-nowrap'>TIMESTAMP</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-[12px] px-1 whitespace-nowrap'>USER</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-[12px] px-1 whitespace-nowrap'>ACTION</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-[12px] px-1 whitespace-nowrap'>MODULE</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-[12px] px-1 whitespace-nowrap'>DETAILS</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading audit logs...</TableCell>
                </TableRow>
              ) : fetchError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-red-600">Failed to load audit logs.</TableCell>
                </TableRow>
              ) : filteredAudits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-5">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-[#E5E5E6] p-1">
                        <RadioTower size={36} color="#727272" />
                      </div>
                      <p className="text-[#122A48] font-bold">No audit logs available</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((a) => (
                  <TableRow key={a.audit_id} className="border-b border-[#C6C6C8]">
                    <TableCell className="text-[#122A48] text-center text-[12px] px-2 whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="text-[#122A48] text-center text-[12px] px-2 whitespace-nowrap">{a.user && typeof a.user === 'object' ? a.user.username ?? '—' : a.user ?? '—'}</TableCell>
                    <TableCell className="text-[#122A48] text-center text-[12px] px-2 whitespace-nowrap">{a.action}</TableCell>
                    <TableCell className="text-[#122A48] text-center text-[12px] px-2 whitespace-nowrap">{formatAffectedTableLabel(a.affected_table)}</TableCell>
                    <TableCell className="text-[#122A48] text-left text-[12px] max-w-xs px-4 truncate">{formatAuditDetails(a)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className='mt-auto border-t border-[#00000015]'>
          <TablePagination
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

      </div>

    </div>
  )
}