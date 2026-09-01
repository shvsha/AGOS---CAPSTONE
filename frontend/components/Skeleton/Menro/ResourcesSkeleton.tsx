"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioTower, Trash2, TriangleAlert, BadgeCheck } from "lucide-react"

export function ResourcesSkeleton() {
  return (
    <div className="hidden md:flex md:flex-col md:h-full">

      {/* total cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-[#122A48]">
        {[
          { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]" },
          { icon: <Trash2 size={20} color="#122A48" />, bg: "bg-[#CDE3DE]" },
          { icon: <TriangleAlert size={20} color="#D81010" />, bg: "bg-[#FFE5E5]" },
          { icon: <BadgeCheck size={20} color="#1565BC" />, bg: "bg-[#1565BC29]" },
        ].map((card, i) => (
          <div key={i} className="rounded-lg border-2 border-[#C6C6C8] h-17 min-[2560px]:h-20 min-[3840px]:h-24 w-full flex items-center p-3 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            <div className={`${card.bg} rounded-lg p-2 opacity-60`}>{card.icon}</div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* waste hotspot, trash accumulated, priority */}
      <div className="flex gap-3 text-[#122A48] mt-2 h-70">

        {/* waste hotspot */}
        <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] bg-[#FAFCFD] flex-[2] min-w-[320px]">
          <div className="w-full">
            <Skeleton className="h-3.5 w-36 m-2" />
          </div>
          <Table>
            <TableHeader className="bg-[#F5F6F9]">
              <TableRow>
                <TableHead className="text-[#727272] text-left text-xs">NODE ID</TableHead>
                <TableHead className="text-[#727272] text-left text-xs">NAME</TableHead>
                <TableHead className="text-[#727272] text-left text-xs">LOCATION</TableHead>
                <TableHead className="text-[#727272] text-left text-xs">STATUS</TableHead>
                <TableHead className="text-[#727272] text-left text-xs">LAST UPDATED</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="text-left"><Skeleton className="h-3 w-6" /></TableCell>
                  <TableCell className="text-left"><Skeleton className="h-3 w-16" /></TableCell>
                  <TableCell className="text-left"><Skeleton className="h-3 w-16" /></TableCell>
                  <TableCell className="text-left"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-left"><Skeleton className="h-3 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* trash accumulated */}
        <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] bg-[#FAFCFD] flex-1 min-w-[240px]">
          <div className="w-full">
            <Skeleton className="h-3.5 w-48 m-2" />
          </div>
          <Table>
            <TableHeader className="bg-[#F5F6F9]">
              <TableRow>
                <TableHead className="text-[#727272] text-left text-xs">RANK</TableHead>
                <TableHead className="text-[#727272] text-left text-xs">HOTSPOT</TableHead>
                <TableHead className="text-[#727272] text-left text-xs">CLOG SEVERITY INDEX</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={i} className="border-b-0">
                  <TableCell className="text-left"><Skeleton className="h-3 w-4" /></TableCell>
                  <TableCell className="text-left"><Skeleton className="h-3 w-16" /></TableCell>
                  <TableCell className="text-left"><Skeleton className="h-3 w-12" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center gap-6 p-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex gap-2 items-center">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
                <Skeleton className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* priority */}
        <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] bg-[#FAFCFD] flex flex-col flex-1 min-w-[220px]">
          <div className="p-2 border-b">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-2.5 w-32 mt-1.5" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-md" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-4 w-14 rounded-full" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* all waste hotspots */}
      <div className="mt-2 bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg flex-1 min-h-[284px] flex flex-col">
        <div className="flex gap-2 w-full p-3 items-center">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Table>
          <TableHeader className="bg-[#CFD8D] border">
            <TableRow>
              <TableHead className="text-left text-xs text-[#727272]">NODE</TableHead>
              <TableHead className="text-left text-xs text-[#727272]">LOCATION</TableHead>
              <TableHead className="text-left text-xs text-[#727272]">CLOG SEVERITY INDEX</TableHead>
              <TableHead className="text-left text-xs text-[#727272]">TRASH VOLUME (kg)</TableHead>
              <TableHead className="text-left text-xs text-[#727272]">STATUS</TableHead>
              <TableHead className="text-left text-xs text-[#727272]">LAST UPDATED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(4)].map((_, i) => (
              <TableRow key={i} className="border-b-0">
                <TableCell className="text-left"><Skeleton className="h-3 w-16" /></TableCell>
                <TableCell className="text-left"><Skeleton className="h-3 w-16" /></TableCell>
                <TableCell className="text-left"><Skeleton className="h-3 w-12" /></TableCell>
                <TableCell className="text-left"><Skeleton className="h-3 w-12" /></TableCell>
                <TableCell className="text-left"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell className="text-left"><Skeleton className="h-3 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-auto flex items-center justify-between px-4 py-2">
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