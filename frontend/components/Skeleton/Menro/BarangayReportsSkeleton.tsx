"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useState } from "react"

export function BarangayReportsSkeleton() {
  const [selectedMonth, setSelectedMonth] = useState<string>("current")
  const [filterBarangay, setFilterBarangay] = useState<string>("All")
  const [filterStatus, setFilterStatus] = useState<string>("All")

  return (
    <div className="hidden md:flex flex-col">

      {/* top filter */}
      <div className="flex justify-between">
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="cursor-pointer w-40 px-3 py-3 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem className="p-2 py-1 text-[#122A48]" value="current">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBarangay} onValueChange={setFilterBarangay}>
            <SelectTrigger className="w-40 px-3 py-2 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="All">All Barangays</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="cursor-pointer w-40 px-3 py-3 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="All" className="p-2 py-1 text-[#122A48]">All Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* barangay reports table */}
      <div className="flex gap-4 mt-3 h-150">
        <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col">
          <Skeleton className="h-4 w-32 m-3" />

          <Table>
            <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
              <TableRow>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">DATE</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">BARANGAY</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">SUBMITTED BY</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">STATUS</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(8)].map((_, i) => (
                <TableRow key={i} className="border-b border-[#C6C6C8]">
                  <TableCell className="h-14"><Skeleton className="h-3.5 w-20" /></TableCell>
                  <TableCell className="h-14"><Skeleton className="h-3.5 w-24" /></TableCell>
                  <TableCell className="h-14"><Skeleton className="h-3.5 w-28" /></TableCell>
                  <TableCell className="h-14"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="h-14">
                    <div className="flex gap-3">
                      <Skeleton className="h-9 w-16 rounded-lg" />
                      <Skeleton className="h-9 w-26 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-auto">
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#C6C6C8]">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}