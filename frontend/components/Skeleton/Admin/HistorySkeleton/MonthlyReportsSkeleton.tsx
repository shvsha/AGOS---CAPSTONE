"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import { FaSearch } from "react-icons/fa"
import { useState } from "react"

export function MonthlyReportsSkeleton() {
  const [selectedMonth, setSelectedMonth] = useState<string>("current")

  return (
    <div className="hidden md:flex flex-col">

      {/* filter */}
      <div className="flex gap-2">
        <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-9 w-55">
          <FaSearch size={14} className="text-[#C6C6C8]" />
          <Input disabled placeholder="Search..." className="text-xs bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-full" />
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="cursor-pointer text-xs w-40 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="current" className="p-2 text-xs">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* total cards */}
      <div className="flex justify-between w-full text-[#122A48] mt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border-2 border-[#C6C6C8] h-17 w-75 flex items-center p-3 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* table */}
      <div className="h-132 mt-2 bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg flex flex-col">
        <Table>
          <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC] h-10 rounded-lg">
            <TableRow>
              <TableHead className="font-semibold text-left text-xs text-[#727272]">ID</TableHead>
              <TableHead className="font-semibold text-left text-xs text-[#727272]">DATE</TableHead>
              <TableHead className="font-semibold text-left text-xs text-[#727272]">VERIFIED BY</TableHead>
              <TableHead className="font-semibold text-left text-xs text-[#727272]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(8)].map((_, i) => (
              <TableRow key={i} className="border-b border-[#C6C6C8]">
                <TableCell className="h-14"><Skeleton className="h-3.5 w-8" /></TableCell>
                <TableCell className="h-14"><Skeleton className="h-3.5 w-24" /></TableCell>
                <TableCell className="h-14"><Skeleton className="h-3.5 w-28" /></TableCell>
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
      </div>

    </div>
  )
}