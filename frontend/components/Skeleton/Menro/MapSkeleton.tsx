"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Siren } from "lucide-react"

export function MapSkeleton() {
  return (
    <div className="hidden md:flex flex-col">

      <div className="text-[#122A48] flex gap-2 h-[calc(98vh-theme(spacing.16))]">

        {/* map */}
        <div className="bg-[#FAFCFD] rounded-lg border border-[#C6C6C8] flex-1 min-w-0 flex flex-col">
          <div className="w-full p-2 shrink-0">
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex-1 m-2 mt-0 rounded-lg overflow-hidden">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>

        {/* waste */}
        <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-67 rounded-lg flex flex-col">
          <div className="flex justify-between items-center p-2">
            <Skeleton className="h-3.5 w-36" />
          </div>
          <hr className="border-[#C6C6C8]" />
          <div className="flex flex-col gap-3 p-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-1 rounded-lg border border-[#E5E5E6] bg-white">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* alerts */}
        <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-67 rounded-lg flex flex-col">
          <div className="flex justify-between items-center p-2">
            <Skeleton className="h-3.5 w-24" />
          </div>
          <hr className="border-[#C6C6C8]" />
          <div className="flex flex-col gap-3 p-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-1 rounded-lg border border-[#E5E5E6] bg-white">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}