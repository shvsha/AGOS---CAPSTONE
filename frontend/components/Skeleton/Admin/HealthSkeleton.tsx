"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Battery, Signal, ScanSearch, FileSearch } from "lucide-react"

export function HealthSkeleton() {
  return (
    <div className="hidden md:flex md:flex-col md:h-full">

      {/* header cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-[#122A48]">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border-2 border-[#C6C6C8] h-17 min-[2560px]:h-20 min-[3840px]:h-24 w-full flex items-center p-6 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* map and preview node */}
      <div className="flex gap-3 mt-2 flex-1 min-h-[450px]">
        {/* map */}
        <div className="rounded-lg bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] p-3 border border-[#C9C9C9] flex-[3] min-w-0 h-full flex flex-col">
          <Skeleton className="h-4 w-56 mb-1" />
          <div className="flex-1 rounded-lg overflow-hidden">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>

        {/* preview node — stays in its real "no selection" empty state */}
        <div className="rounded-lg bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] flex-1 min-w-[240px]">
          <div className="flex justify-center items-center h-full flex-col gap-2 border border-[#C9C9C9] w-full rounded-lg">
            <FileSearch size={50} className="text-[#1565BC80]" />
            <p className="font-semibold text-[#122A488F]">No node selected</p>
            <p className="text-[#122A4873] text-xs text-center">
              Select a node from the network <br /> map to view its hardware status <br /> and sensor information
            </p>
          </div>
        </div>
      </div>

      {/* node health cards */}
      <div className="grid grid-cols-3 gap-3 mt-2 w-full min-h-[130px]">

        {/* Battery Voltage */}
        <div className="border border-[#C6C6C8] rounded-lg p-3 min-[2560px]:p-4 min-[3840px]:p-5 text-[#122A48] w-full bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center mb-1">
            <div className="flex gap-2 items-center">
              <Battery size={20} className="text-[#C6C6C8]" />
              <p className="font-bold text-sm">Battery Voltage</p>
            </div>
            <Skeleton className="h-2 w-2 rounded-full" />
          </div>
          <Skeleton className="h-6 w-14 mt-1" />
          <Skeleton className="h-3 w-10 mt-2 mb-2" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-2.5 w-24 mt-1" />
        </div>

        {/* 4G Signal */}
        <div className="border border-[#C6C6C8] rounded-lg p-3 min-[2560px]:p-4 min-[3840px]:p-5 text-[#122A48] w-full bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center mb-1">
            <div className="flex gap-2 items-center">
              <Signal size={20} className="text-[#C6C6C8]" />
              <p className="font-bold text-sm">4G Signal</p>
            </div>
            <Skeleton className="h-2 w-2 rounded-full" />
          </div>
          <Skeleton className="h-6 w-14 mt-1" />
          <Skeleton className="h-3 w-10 mt-2 mb-2" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-2.5 w-28 mt-1" />
        </div>

        {/* Sensor Continuity */}
        <div className="border border-[#C6C6C8] rounded-lg p-3 min-[2560px]:p-4 min-[3840px]:p-5 text-[#122A48] w-full bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center mb-1">
            <div className="flex gap-2 items-center">
              <ScanSearch size={20} className="text-[#C6C6C8]" />
              <p className="font-bold text-sm">Sensor</p>
            </div>
            <Skeleton className="h-2 w-2 rounded-full" />
          </div>
          <Skeleton className="h-6 w-14 mt-1" />
          <Skeleton className="h-3 w-16 mt-2 mb-2" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-2.5 w-32 mt-1" />
        </div>

      </div>
    </div>
  )
}