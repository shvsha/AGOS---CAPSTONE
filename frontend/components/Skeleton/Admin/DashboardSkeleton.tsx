"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="hidden md:flex flex-col">

      {/* title */}
      <div className="flex w-full mb-2">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* total cards */}
      <div className="flex justify-between w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border-2 border-[#C6C6C8] h-17 w-75 flex items-center p-3 gap-3 bg-[#FAFCFD]">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* map, monthly report, waste, alerts */}
      <div className="mt-3 flex gap-2 w-full">
        <div className="flex flex-col gap-2 flex-1 min-w-0">

          {/* map */}
          <div className="bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg h-[380px] flex flex-col">
            <div className="px-2 pt-2 pb-1">
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex-1 m-2 rounded-lg overflow-hidden">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>

          {/* monthly report progress */}
          <div className="bg-[#FAFCFD] border border-[#C2C1C1] rounded-lg p-4 flex flex-col gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex items-center gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* waste panel */}
        <div className="bg-[#FAFCFD] border border-[#00000040] w-67 rounded-lg flex flex-col">
          <div className="p-1.5 px-3">
            <Skeleton className="h-4 w-36" />
          </div>
          <hr className="border-[#C6C6C8]" />
          <div className="flex flex-col gap-2 p-2">
            {[...Array(5)].map((_, i) => (
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

        {/* alerts panel */}
        <div className="bg-[#FAFCFD] border border-[#00000040] w-67 rounded-lg flex flex-col">
          <div className="p-1.5 px-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <hr className="border-[#C6C6C8]" />
          <div className="flex flex-col gap-2 p-2">
            {[...Array(5)].map((_, i) => (
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
      </div>

      {/* sensor node health summary */}
      <div className="bg-[#FAFCFD] rounded-lg border border-[#00000040] mt-2 p-3">
        <div className="mb-2 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-64" />
        </div>

        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-[#C6C6C8] rounded-lg p-3 flex-1 bg-[#FAFCFD]">
              <div className="flex justify-between items-center mb-1">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-2 w-2 rounded-full" />
              </div>
              <Skeleton className="h-6 w-14 mt-1" />
              <Skeleton className="h-3 w-10 mt-2 mb-2" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-2.5 w-40 mt-1" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}