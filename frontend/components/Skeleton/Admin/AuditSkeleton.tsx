"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

import { Calendar as CalendarIcon, ChevronDown, FileDown } from "lucide-react"
import { FaSearch } from "react-icons/fa"

export function AuditSkeleton() {
  return (
    <div className="w-full flex flex-col gap-2 max-w-full box-border">

      {/* Toolbar */}
      <div className="w-full flex gap-2 items-end items-center justify-between">
        <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-9 w-150">
          <FaSearch size={14} className="text-[#C6C6C8]" />
          <input disabled suppressHydrationWarning placeholder="Search audit logs..." className="text-xs bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] outline-none w-full" />
        </div>

        <div className="relative flex gap-2">
          <button
            disabled
            className="flex items-center justify-between w-[240px] h-9 px-3 border border-[#D0D0D0] rounded-lg bg-white text-[12px] font-normal text-[#999999] outline-none text-left"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-[#122A48]" />
              <span>Filter by Date</span>
            </div>
            <ChevronDown size={14} className="text-[#999999]" />
          </button>

          <Button disabled className="bg-[#2fd45b] opacity-60 py-[17px]">
            <FileDown size={16} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Audit Table Card */}
      <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col overflow-hidden min-w-0 mt-2 h-149">
        <Skeleton className="h-4 w-40 m-2" />

        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[700px]">
            <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
              <TableRow>
                <TableHead className="font-semibold text-left text-[#727272] text-xs px-1 whitespace-nowrap">TIMESTAMP</TableHead>
                <TableHead className="font-semibold text-left text-[#727272] text-xs px-1 whitespace-nowrap">USER</TableHead>
                <TableHead className="font-semibold text-left text-[#727272] text-xs px-1 whitespace-nowrap">ACTION</TableHead>
                <TableHead className="font-semibold text-left text-[#727272] text-xs px-1 whitespace-nowrap">MODULE</TableHead>
                <TableHead className="font-semibold text-left text-[#727272] text-xs px-1 whitespace-nowrap">DETAILS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i} className="border-b border-[#C6C6C8]">
                  <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-28 mx-auto" /></TableCell>
                  <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-24 mx-auto" /></TableCell>
                  <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-20 mx-auto" /></TableCell>
                  <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-24 mx-auto" /></TableCell>
                  <TableCell className="px-4 py-3"><Skeleton className="h-3.5 w-48" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-auto flex items-center justify-between px-4 py-3 border-t border-[#00000015]">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>

    </div>
  )
}