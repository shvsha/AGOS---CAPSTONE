"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaSearch } from "react-icons/fa"

const CONDITIONS = ["All", "Critical", "Warning", "Normal"]

export function MonitoringSkeleton() {
  return (
    <div className="hidden md:flex md:flex-col md:h-full">

      {/* title and date/time */}
      <div className="flex justify-between">
        <p className="font-bold text-[#122A48] text-[15px]">Live Feed</p>
        <div className="flex gap-3 items-center">
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full mt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border-2 border-[#C6C6C8] h-17 min-[2560px]:h-20 min-[3840px]:h-24 w-full flex items-center p-3 gap-3 bg-[#FAFCFD]">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* body */}
      <div className="flex gap-2 mt-3 flex-1 min-h-0">

        {/* table */}
        <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] flex-[3] min-w-0 rounded-lg flex flex-col h-full">
          {/* filters */}
          <div className="flex gap-3 items-center p-3">
            <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-9 w-105">
              <FaSearch size={14} className="text-[#C6C6C8]" />
              <Input disabled placeholder="Search sensor node or barangay..." className="text-xs bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-full" />
            </div>
            {CONDITIONS.map(c => (
              <Button key={c} disabled className="rounded-full border px-5 py-2 text-xs font-medium bg-transparent text-[#122A48] border-[#C6C6C8]">
                {c}
              </Button>
            ))}
          </div>

          <div className="px-4">
            <Skeleton className="h-4 w-32 mb-2 -mt-1" />
          </div>

          <Table>
            <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
              <TableRow>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">NODE ID</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">BARANGAY</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">LOCATION</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">WATER LEVEL</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">FLOW RATE</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">CLOG</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">CONDITION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="h-14"><Skeleton className="h-3.5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-28 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-auto flex items-center justify-between px-4 py-3 border-t border-[#C6C6C8]">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>

        {/* live alerts */}
        <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] flex-1 min-w-[240px] rounded-lg flex flex-col h-full">
          <div className="flex items-center p-2">
            <Skeleton className="h-4 w-24" />
          </div>
          <hr className="border-[#C6C6C8]" />
          <div className="flex flex-col gap-2 p-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-1 h-14 rounded-lg border border-[#E5E5E6] bg-white">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* clog level legend */}
        <div className="flex flex-col gap-3">
          <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-47 h-40 rounded-lg flex flex-col">
            <div className="p-3 flex flex-col gap-2">
              <Skeleton className="h-3.5 w-28" />
              <hr />
            </div>
            <div className="flex flex-col">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3 px-3 -mt-2">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}